-- Phase 2: Tenant Persona & Configuration
-- Adds persona, assistant type, welcome message, and starter questions to tenants

-- Persona definition (name, tone, voice, boundaries, custom instructions)
ALTER TABLE tenants ADD COLUMN persona jsonb DEFAULT '{}';

-- Assistant type: reactive (support Q&A), guided (onboarding flows), reference (docs lookup)
-- NOTE: 'guided' is system-prompt-only for now. Full step-tracking/progress is planned for Phase 3.
ALTER TABLE tenants ADD COLUMN assistant_type text DEFAULT 'reactive'
  CHECK (assistant_type IN ('reactive', 'guided', 'reference'));

-- Starter questions shown as chips in the widget
ALTER TABLE tenants ADD COLUMN starter_questions jsonb DEFAULT '[]';

-- Welcome message shown when widget opens (moved out of config JSONB for direct access)
ALTER TABLE tenants ADD COLUMN welcome_message text DEFAULT 'Hi there! How can I help you today?';
