-- Migration: Add confidence and grade columns to messages table

ALTER TABLE messages ADD COLUMN IF NOT EXISTS confidence float;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS grade text CHECK (grade IN ('SUPPORTED', 'PARTIAL', 'UNSUPPORTED'));
