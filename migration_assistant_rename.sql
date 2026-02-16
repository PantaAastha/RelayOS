-- Migration: Add assistant_id to dependent tables and backfill from tenant_id
-- Description: Phase 2 of Tenant -> Assistant rename. Adds new columns, backfills data, adds FKs and Indexes.
-- Usage: Run this in Supabase SQL Editor.

BEGIN;

-- 1. conversations
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'tenant_id') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'assistant_id') THEN
            ALTER TABLE conversations ADD COLUMN assistant_id UUID references assistants(id);
            RAISE NOTICE 'Added assistant_id to conversations';
        END IF;
        
        -- Backfill
        UPDATE conversations SET assistant_id = tenant_id WHERE assistant_id IS NULL;
        
        -- Index
        CREATE INDEX IF NOT EXISTS idx_conversations_assistant_id ON conversations(assistant_id);
    END IF;
END $$;

-- 2. documents
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'tenant_id') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'assistant_id') THEN
            ALTER TABLE documents ADD COLUMN assistant_id UUID references assistants(id);
            RAISE NOTICE 'Added assistant_id to documents';
        END IF;

        UPDATE documents SET assistant_id = tenant_id WHERE assistant_id IS NULL;
        CREATE INDEX IF NOT EXISTS idx_documents_assistant_id ON documents(assistant_id);
    END IF;
END $$;

-- 3. events
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'tenant_id') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'assistant_id') THEN
            ALTER TABLE events ADD COLUMN assistant_id UUID references assistants(id);
            RAISE NOTICE 'Added assistant_id to events';
        END IF;

        UPDATE events SET assistant_id = tenant_id WHERE assistant_id IS NULL;
        CREATE INDEX IF NOT EXISTS idx_events_assistant_id ON events(assistant_id);
    END IF;
END $$;

-- 4. message_feedback
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'message_feedback' AND column_name = 'tenant_id') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'message_feedback' AND column_name = 'assistant_id') THEN
            ALTER TABLE message_feedback ADD COLUMN assistant_id UUID references assistants(id);
            RAISE NOTICE 'Added assistant_id to message_feedback';
        END IF;

        UPDATE message_feedback SET assistant_id = tenant_id WHERE assistant_id IS NULL;
        CREATE INDEX IF NOT EXISTS idx_message_feedback_assistant_id ON message_feedback(assistant_id);
    END IF;
END $$;

-- 5. messages (Conditional check)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'tenant_id') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'assistant_id') THEN
            ALTER TABLE messages ADD COLUMN assistant_id UUID references assistants(id);
            RAISE NOTICE 'Added assistant_id to messages';
        END IF;

        UPDATE messages SET assistant_id = tenant_id WHERE assistant_id IS NULL;
        CREATE INDEX IF NOT EXISTS idx_messages_assistant_id ON messages(assistant_id);
    END IF;
END $$;

-- 6. document_chunks (Conditional check)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_chunks' AND column_name = 'tenant_id') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_chunks' AND column_name = 'assistant_id') THEN
            ALTER TABLE document_chunks ADD COLUMN assistant_id UUID references assistants(id);
            RAISE NOTICE 'Added assistant_id to document_chunks';
        END IF;

        UPDATE document_chunks SET assistant_id = tenant_id WHERE assistant_id IS NULL;
        CREATE INDEX IF NOT EXISTS idx_document_chunks_assistant_id ON document_chunks(assistant_id);
    END IF;
END $$;

-- 7. grading (Conditional check)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'grading') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grading' AND column_name = 'tenant_id') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grading' AND column_name = 'assistant_id') THEN
            ALTER TABLE grading ADD COLUMN assistant_id UUID references assistants(id);
            RAISE NOTICE 'Added assistant_id to grading';
        END IF;

        UPDATE grading SET assistant_id = tenant_id WHERE assistant_id IS NULL;
        CREATE INDEX IF NOT EXISTS idx_grading_assistant_id ON grading(assistant_id);
    END IF;
END $$;

-- 8. feedback (Conditional check - distinct from message_feedback?)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feedback') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'tenant_id') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'assistant_id') THEN
            ALTER TABLE feedback ADD COLUMN assistant_id UUID references assistants(id);
            RAISE NOTICE 'Added assistant_id to feedback';
        END IF;

        UPDATE feedback SET assistant_id = tenant_id WHERE assistant_id IS NULL;
        CREATE INDEX IF NOT EXISTS idx_feedback_assistant_id ON feedback(assistant_id);
    END IF;
END $$;


COMMIT;
