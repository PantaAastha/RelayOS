-- Drop tenant_id columns after successful migration to assistant_id

-- 1. Drop tenant_id from conversations
ALTER TABLE conversations DROP COLUMN tenant_id;

-- 2. Drop tenant_id from messages (if it exists - messages table usually refers to conversation_id, but sometimes denormalized)
-- Checking previous schema, messages might not have tenant_id, but let's check `events`
ALTER TABLE events DROP COLUMN tenant_id;

-- 3. Drop tenant_id from documents
ALTER TABLE documents DROP COLUMN tenant_id;

-- 4. Drop tenant_id from message_feedback
ALTER TABLE message_feedback DROP COLUMN tenant_id;

-- 5. Force schema cache reload
NOTIFY pgrst, 'reload schema';
