-- Migration: Add message_feedback table for thumbs up/down feedback loop

CREATE TABLE IF NOT EXISTS message_feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    feedback_type text NOT NULL CHECK (feedback_type IN ('positive', 'negative')),
    comment text,
    created_at timestamptz DEFAULT now()
);

-- Index for quick lookup by message
CREATE INDEX IF NOT EXISTS idx_message_feedback_message_id ON message_feedback(message_id);

-- Index for tenant analytics
CREATE INDEX IF NOT EXISTS idx_message_feedback_tenant ON message_feedback(tenant_id, created_at DESC);
