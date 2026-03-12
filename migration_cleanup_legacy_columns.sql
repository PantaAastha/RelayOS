-- Migration: Cleanup Legacy Documents Architecture
-- Description: Drops old tenant_id and assistant_id columns from documents table CASCADE.
-- This forcefully drops any lingering hybrid_search or match_documents functions that depended on them,
-- permanently solving the signature mismatch bugs and enforcing strict Collections architecture.
-- Usage: Run this in Supabase SQL Editor.

BEGIN;

DO $$
BEGIN
    -- 1. Drop the legacy tenant_id column (cascades to dependent functions)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'tenant_id') THEN
        ALTER TABLE documents DROP COLUMN tenant_id CASCADE;
        RAISE NOTICE 'Dropped tenant_id from documents';
    END IF;

    -- 2. Drop the legacy assistant_id column (cascades to dependent functions and views)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'assistant_id') THEN
        ALTER TABLE documents DROP COLUMN assistant_id CASCADE;
        RAISE NOTICE 'Dropped assistant_id from documents';
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
