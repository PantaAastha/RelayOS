-- Migration: Enforce strict Collection scoping for RAG pipeline
-- Description: Removes the global organization-wide document fallback. 
-- Vector searches will now ONLY return chunks from documents that exist inside Collections currently mounted to the calling Assistant.
-- Usage: Run this in Supabase SQL Editor.

BEGIN;

-- 1. Drop existing functions dynamically to catch all overloads (e.g. vector vs vector(768))
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT oid::regprocedure AS sig
        FROM pg_proc
        WHERE proname IN ('hybrid_search', 'match_documents')
        AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.sig || ';';
    END LOOP;
END $$;

-- 2. match_documents (Strict Scoping)

CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(768),
  match_assistant_id uuid DEFAULT NULL,
  match_count int DEFAULT 5,
  match_threshold float DEFAULT 0.3,
  match_tenant_id uuid DEFAULT NULL -- Legacy alias support
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
DECLARE
  target_id uuid;
BEGIN
  target_id := COALESCE(match_assistant_id, match_tenant_id);

  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  JOIN documents d ON dc.document_id = d.id
  WHERE d.status = 'active'
    AND d.id IN (
      SELECT cd.document_id 
      FROM collection_documents cd
      JOIN assistant_collections ac ON cd.collection_id = ac.collection_id
      WHERE ac.assistant_id = target_id
    )
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


-- 3. hybrid_search (Strict Scoping)

CREATE OR REPLACE FUNCTION hybrid_search(
  query_text text,
  query_embedding vector(768),
  match_assistant_id uuid DEFAULT NULL,
  match_count int DEFAULT 5,
  rrf_k int DEFAULT 60,
  match_tenant_id uuid DEFAULT NULL -- Legacy alias support
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  semantic_similarity float,
  keyword_rank int,
  rrf_score float,
  doc_created_at timestamptz,
  doc_updated_at timestamptz
)
LANGUAGE plpgsql
AS $$
DECLARE
  target_id uuid;
BEGIN
  target_id := COALESCE(match_assistant_id, match_tenant_id);

  RETURN QUERY
  WITH semantic_search AS (
    SELECT
      dc.id,
      dc.document_id,
      dc.content,
      dc.metadata,
      d.created_at AS doc_created_at,
      d.updated_at AS doc_updated_at,
      1 - (dc.embedding <=> query_embedding) AS similarity,
      ROW_NUMBER() OVER (ORDER BY dc.embedding <=> query_embedding) AS rank
    FROM document_chunks dc
    JOIN documents d ON dc.document_id = d.id
    WHERE d.status = 'active'
      AND d.id IN (
        SELECT cd.document_id 
        FROM collection_documents cd
        JOIN assistant_collections ac ON cd.collection_id = ac.collection_id
        WHERE ac.assistant_id = target_id
      )
  ),
  keyword_search AS (
    SELECT
      dc.id,
      dc.document_id,
      dc.content,
      dc.metadata,
      d.created_at AS doc_created_at,
      d.updated_at AS doc_updated_at,
      ts_rank_cd(dc.fts, websearch_to_tsquery('english', query_text)) AS rank_score,
      ROW_NUMBER() OVER (ORDER BY ts_rank_cd(dc.fts, websearch_to_tsquery('english', query_text)) DESC) AS rank
    FROM document_chunks dc
    JOIN documents d ON dc.document_id = d.id
    WHERE d.status = 'active'
      AND d.id IN (
        SELECT cd.document_id 
        FROM collection_documents cd
        JOIN assistant_collections ac ON cd.collection_id = ac.collection_id
        WHERE ac.assistant_id = target_id
      )
      AND dc.fts @@ websearch_to_tsquery('english', query_text)
  )
  SELECT
    COALESCE(s.id, k.id) AS id,
    COALESCE(s.document_id, k.document_id) AS document_id,
    COALESCE(s.content, k.content) AS content,
    COALESCE(s.metadata, k.metadata) AS metadata,
    COALESCE(s.similarity, 0.0)::float AS semantic_similarity,
    COALESCE(k.rank, 1000)::int AS keyword_rank,
    (
      COALESCE(1.0 / (rrf_k + s.rank), 0.0) +
      COALESCE(1.0 / (rrf_k + k.rank), 0.0)
    )::float AS rrf_score,
    COALESCE(s.doc_created_at, k.doc_created_at) AS doc_created_at,
    COALESCE(s.doc_updated_at, k.doc_updated_at) AS doc_updated_at
  FROM semantic_search s
  FULL OUTER JOIN keyword_search k ON s.id = k.id
  ORDER BY rrf_score DESC
  LIMIT match_count;
END;
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;
