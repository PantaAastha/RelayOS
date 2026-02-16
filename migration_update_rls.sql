-- Migration: Enable RLS and Update Policies for Assistant Rename
-- Description: Enables RLS on all core tables and adds policies scoping access by assistant_id.
-- Usage: Run this in Supabase SQL Editor.

BEGIN;

-- 1. Enable RLS (Idempotent)
ALTER TABLE IF EXISTS conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS message_feedback ENABLE ROW LEVEL SECURITY;

-- 2. Create Policies (assuming auth.uid() maps to assistant_id)

-- Conversations
DROP POLICY IF EXISTS "Assistants can view own conversations" ON conversations;
-- Also drop old tenant-based policies if likely to exist (guessing names)
DROP POLICY IF EXISTS "Tenants can view own conversations" ON conversations;

CREATE POLICY "Assistants can access own conversations" ON conversations
    FOR ALL
    USING (assistant_id = auth.uid());

-- Messages (Scoped via Conversation)
DROP POLICY IF EXISTS "Assistants can view own messages" ON messages;
DROP POLICY IF EXISTS "Tenants can view own messages" ON messages;

CREATE POLICY "Assistants can access own messages" ON messages
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = messages.conversation_id
            AND c.assistant_id = auth.uid()
        )
    );

-- Documents
DROP POLICY IF EXISTS "Assistants can view own documents" ON documents;
DROP POLICY IF EXISTS "Tenants can view own documents" ON documents;

CREATE POLICY "Assistants can access own documents" ON documents
    FOR ALL
    USING (assistant_id = auth.uid());

-- Document Chunks (Scoped via Document)
DROP POLICY IF EXISTS "Assistants can view own chunks" ON document_chunks;
DROP POLICY IF EXISTS "Tenants can view own chunks" ON document_chunks;

CREATE POLICY "Assistants can access own chunks" ON document_chunks
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_chunks.document_id
            AND d.assistant_id = auth.uid()
        )
    );

-- Events
DROP POLICY IF EXISTS "Assistants can view own events" ON events;
DROP POLICY IF EXISTS "Tenants can view own events" ON events;

CREATE POLICY "Assistants can access own events" ON events
    FOR ALL
    USING (assistant_id = auth.uid());

-- Message Feedback
DROP POLICY IF EXISTS "Assistants can view own feedback" ON message_feedback;
DROP POLICY IF EXISTS "Tenants can view own feedback" ON message_feedback;

CREATE POLICY "Assistants can access own feedback" ON message_feedback
    FOR ALL
    USING (assistant_id = auth.uid());

COMMIT;
