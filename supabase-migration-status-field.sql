-- Migration: Replace is_shortlisted with status field
-- Run this in Supabase SQL Editor

-- ================================================
-- 1. ADD STATUS COLUMN
-- ================================================

-- Add status column with CHECK constraint
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS status TEXT
CHECK (status IN ('PENDING', 'SHORTLISTED', 'REJECTED'))
DEFAULT 'PENDING';

-- ================================================
-- 2. MIGRATE EXISTING DATA
-- ================================================

-- Migrate data from is_shortlisted to status
UPDATE candidates
SET status = CASE
  WHEN is_shortlisted = true THEN 'SHORTLISTED'
  ELSE 'PENDING'
END
WHERE status IS NULL OR status = 'PENDING';

-- ================================================
-- 3. DROP OLD COLUMN
-- ================================================

-- Drop the is_shortlisted column
ALTER TABLE candidates
DROP COLUMN IF EXISTS is_shortlisted;

-- ================================================
-- 4. CREATE INDEX FOR STATUS
-- ================================================

CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);

-- ================================================
-- 5. VERIFY MIGRATION
-- ================================================

-- Check status column exists and is_shortlisted is gone
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'candidates'
AND column_name IN ('status', 'is_shortlisted')
ORDER BY column_name;

-- Check status distribution
SELECT status, COUNT(*) as count
FROM candidates
GROUP BY status
ORDER BY status;

-- ================================================
-- MIGRATION COMPLETE!
-- ================================================

SELECT 'Status field migration completed successfully!' AS status;
