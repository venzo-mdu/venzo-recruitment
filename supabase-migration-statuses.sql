-- Venzo Recruitment Portal - Extended Statuses Migration
-- Run this script in your Supabase SQL Editor

-- ================================================
-- 1. UPDATE CANDIDATES TABLE - REMOVE OLD CONSTRAINT
-- ================================================

-- Drop the old status check constraint
ALTER TABLE candidates
DROP CONSTRAINT IF EXISTS candidates_status_check;

-- Add new status constraint with extended statuses
ALTER TABLE candidates
ADD CONSTRAINT candidates_status_check
CHECK (status = ANY (ARRAY[
  'PENDING',
  'UNDER_REVIEW',
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
  'INTERVIEWED',
  'OFFER_EXTENDED',
  'HIRED',
  'REJECTED',
  'ON_HOLD',
  'WITHDRAWN'
]));

-- ================================================
-- 2. UPDATE CANDIDATE_COMMENTS TABLE - ADD STATUS CHANGE TRACKING
-- ================================================

-- Add status_from and status_to columns to track status changes
ALTER TABLE candidate_comments
ADD COLUMN IF NOT EXISTS status_from TEXT,
ADD COLUMN IF NOT EXISTS status_to TEXT,
ADD COLUMN IF NOT EXISTS is_status_change BOOLEAN DEFAULT FALSE;

-- ================================================
-- 3. VERIFY SETUP
-- ================================================

-- Check constraints
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'candidates'::regclass AND conname = 'candidates_status_check';

-- Check new columns in candidate_comments
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'candidate_comments';

SELECT 'Extended statuses migration completed successfully!' AS status;
