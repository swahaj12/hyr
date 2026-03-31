-- Add integrity_flag column to assessments table
-- Run this in the Supabase SQL Editor

-- Add the integrity flag for server-side validation
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS integrity_flag text NOT NULL DEFAULT 'clean';

-- Add a comment explaining the values
COMMENT ON COLUMN assessments.integrity_flag IS 'Assessment integrity: clean, suspicious, or flagged';

-- Index for quick filtering of flagged assessments
CREATE INDEX IF NOT EXISTS idx_assessments_integrity ON assessments(integrity_flag);
