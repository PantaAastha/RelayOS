-- Migration: Elevate Documents to Org-Scope and Create Collections (Milestone 3)
-- Description: Creates collections, collection_documents, and assistant_collections tables.
-- Usage: Run this in Supabase SQL Editor.

BEGIN;

-- 1. Collections Table
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collections_org ON collections(organization_id);

-- 2. Collection Documents Mapping (Many-to-Many)
CREATE TABLE IF NOT EXISTS collection_documents (
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (collection_id, document_id)
);

CREATE INDEX IF NOT EXISTS idx_collection_docs_doc ON collection_documents(document_id);

-- 3. Assistant Collections Mapping (Many-to-Many)
CREATE TABLE IF NOT EXISTS assistant_collections (
  assistant_id UUID REFERENCES assistants(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (assistant_id, collection_id)
);

CREATE INDEX IF NOT EXISTS idx_assistant_collections_col ON assistant_collections(collection_id);

-- 4. Modifying Documents for Org-Scope
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'organization_id') THEN
        ALTER TABLE documents ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added organization_id to documents';
    END IF;

    -- Backfill organization_id from assistant_id
    UPDATE documents d
    SET organization_id = a.organization_id
    FROM assistants a
    WHERE d.assistant_id = a.id AND d.organization_id IS NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(organization_id);
END $$;

-- 5. Add Triggers for updated_at
-- This relies on the 'update_updated_at_column()' function created in 0001_initial_schema.sql
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_collections_updated_at') THEN
        CREATE TRIGGER update_collections_updated_at
        BEFORE UPDATE ON collections
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

COMMIT;
