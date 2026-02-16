-- Migration: Update RPC functions for Assistant Rename
-- Description: Updates match_documents and hybrid_search to accept match_assistant_id and match_tenant_id (legacy).
-- Usage: Run this in Supabase SQL Editor.

BEGIN;

-- 1. match_documents
-- Drop old function signature to avoid ambiguity
DROP FUNCTION IF EXISTS match_documents(vector(768), uuid, int, float);

-- Create new function with backward compatibility
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(768),
  match_assistant_id uuid DEFAULT NULL, -- Previously match_tenant_id
  match_count int DEFAULT 5,
  match_threshold float DEFAULT 0.3,
  match_tenant_id uuid DEFAULT NULL -- Legacy fallback
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
  -- Resolve ID: Use assistant_id if provided, otherwise tenant_id
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
  WHERE d.assistant_id = target_id -- Query against the new column
    AND d.status = 'active'
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


-- 2. hybrid_search
-- Drop old function signature
DROP FUNCTION IF EXISTS hybrid_search(text, vector(768), uuid, int, int);

-- Create new function
CREATE OR REPLACE FUNCTION hybrid_search(
  query_text text,
  query_embedding vector(768),
  match_assistant_id uuid DEFAULT NULL, -- Previously match_tenant_id
  match_count int DEFAULT 5,
  rrf_k int DEFAULT 60,
  match_tenant_id uuid DEFAULT NULL -- Legacy fallback
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  semantic_similarity float,
  keyword_rank int,
  rrf_score float
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
      1 - (dc.embedding <=> query_embedding) AS similarity,
      ROW_NUMBER() OVER (ORDER BY dc.embedding <=> query_embedding) AS rank
    FROM document_chunks dc
    JOIN documents d ON dc.document_id = d.id
    WHERE d.assistant_id = target_id
      AND d.status = 'active'
  ),
  keyword_search AS (
    SELECT
      dc.id,
      dc.document_id,
      dc.content,
      dc.metadata,
      ts_rank_cd(dc.fts, websearch_to_tsquery('english', query_text)) AS rank_score,
      ROW_NUMBER() OVER (ORDER BY ts_rank_cd(dc.fts, websearch_to_tsquery('english', query_text)) DESC) AS rank
    FROM document_chunks dc
    JOIN documents d ON dc.document_id = d.id
    WHERE d.assistant_id = target_id
      AND d.status = 'active'
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
    )::float AS rrf_score
  FROM semantic_search s
  FULL OUTER JOIN keyword_search k ON s.id = k.id
  ORDER BY rrf_score DESC
  LIMIT match_count;
END;
$$;

COMMIT;
