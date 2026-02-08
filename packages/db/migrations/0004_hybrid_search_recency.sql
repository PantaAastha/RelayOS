-- Migration: Add document timestamps to hybrid_search for recency boosting

-- Drop existing function first (PostgreSQL can't change return type of existing function)
DROP FUNCTION IF EXISTS hybrid_search(text, vector, uuid, integer, integer);

-- Update hybrid_search function to return document timestamps
CREATE OR REPLACE FUNCTION hybrid_search(
  query_text text,
  query_embedding vector(768),
  match_tenant_id uuid,
  match_count int DEFAULT 5,
  rrf_k int DEFAULT 60
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
BEGIN
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
    WHERE d.tenant_id = match_tenant_id
      AND d.status = 'active'
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
    WHERE d.tenant_id = match_tenant_id
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
    )::float AS rrf_score,
    COALESCE(s.doc_created_at, k.doc_created_at) AS doc_created_at,
    COALESCE(s.doc_updated_at, k.doc_updated_at) AS doc_updated_at
  FROM semantic_search s
  FULL OUTER JOIN keyword_search k ON s.id = k.id
  ORDER BY rrf_score DESC
  LIMIT match_count;
END;
$$;
