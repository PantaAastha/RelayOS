-- Supabase RPC Function for Vector Similarity Search
-- Run this in Supabase SQL Editor after the initial migration

CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_tenant_id uuid,
  match_count int DEFAULT 5,
  match_threshold float DEFAULT 0.3
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
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  JOIN documents d ON dc.document_id = d.id
  WHERE d.tenant_id = match_tenant_id
    AND d.status = 'active'
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
