-- Migration: Add Trade Finance Analysis Fields to Candidates Table
-- Run this in Supabase SQL Editor

-- ================================================
-- 1. ADD NEW COLUMNS FOR EXTRACTED DATA
-- ================================================

-- Add columns for auto-extracted information from resume
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS current_salary NUMERIC,
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS certifications TEXT[],
ADD COLUMN IF NOT EXISTS work_history JSONB,
ADD COLUMN IF NOT EXISTS total_experience_years NUMERIC,
ADD COLUMN IF NOT EXISTS trade_finance_experience_years NUMERIC;

-- ================================================
-- 2. ADD TRADE FINANCE SCORING COLUMNS
-- ================================================

ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS ai_analysis JSONB,
ADD COLUMN IF NOT EXISTS tech_background_score NUMERIC(3,1) CHECK (tech_background_score >= 0 AND tech_background_score <= 3),
ADD COLUMN IF NOT EXISTS trade_finance_breadth_score NUMERIC(3,1) CHECK (trade_finance_breadth_score >= 0 AND trade_finance_breadth_score <= 3),
ADD COLUMN IF NOT EXISTS hands_on_experience_score NUMERIC(3,1) CHECK (hands_on_experience_score >= 0 AND hands_on_experience_score <= 2),
ADD COLUMN IF NOT EXISTS digital_transformation_score NUMERIC(3,1) CHECK (digital_transformation_score >= 0 AND digital_transformation_score <= 2),
ADD COLUMN IF NOT EXISTS overall_score NUMERIC(4,1) CHECK (overall_score >= 0 AND overall_score <= 10),
ADD COLUMN IF NOT EXISTS recommendation TEXT CHECK (recommendation IN ('Highly Recommended', 'Recommended', 'Maybe', 'Not Recommended')),
ADD COLUMN IF NOT EXISTS key_strengths TEXT[],
ADD COLUMN IF NOT EXISTS areas_of_concern TEXT[],
ADD COLUMN IF NOT EXISTS trade_finance_products TEXT[], -- LC, BG, SBLC, Guarantees, Collections, etc.
ADD COLUMN IF NOT EXISTS swift_messages TEXT[]; -- MT700, MT710, MT760, etc.

-- ================================================
-- 3. UPDATE EXISTING COLUMNS (IF NEEDED)
-- ================================================

-- Make some fields nullable since they'll be auto-populated
ALTER TABLE candidates
ALTER COLUMN position DROP NOT NULL,
ALTER COLUMN experience DROP NOT NULL,
ALTER COLUMN notice_period DROP NOT NULL,
ALTER COLUMN current_salary DROP NOT NULL;

-- ================================================
-- 4. CREATE INDEXES FOR NEW COLUMNS
-- ================================================

CREATE INDEX IF NOT EXISTS idx_candidates_overall_score ON candidates(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_candidates_recommendation ON candidates(recommendation);
CREATE INDEX IF NOT EXISTS idx_candidates_tech_background_score ON candidates(tech_background_score DESC);
CREATE INDEX IF NOT EXISTS idx_candidates_trade_finance_breadth_score ON candidates(trade_finance_breadth_score DESC);

-- ================================================
-- 5. UPDATE UPDATED_AT TRIGGER (Already exists, no change needed)
-- ================================================

-- The existing trigger will automatically update updated_at for all changes

-- ================================================
-- 6. VERIFY MIGRATION
-- ================================================

-- Check new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'candidates'
AND column_name IN (
  'current_salary',
  'education',
  'certifications',
  'work_history',
  'total_experience_years',
  'trade_finance_experience_years',
  'ai_analysis',
  'tech_background_score',
  'trade_finance_breadth_score',
  'hands_on_experience_score',
  'digital_transformation_score',
  'overall_score',
  'recommendation',
  'key_strengths',
  'areas_of_concern',
  'trade_finance_products'
)
ORDER BY column_name;

-- ================================================
-- MIGRATION COMPLETE!
-- ================================================

SELECT 'Trade Finance Analysis migration completed successfully!' AS status;
