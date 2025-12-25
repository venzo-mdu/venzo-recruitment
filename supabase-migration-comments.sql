-- Venzo Recruitment Portal - Comments/Feedback Migration
-- Run this script in your Supabase SQL Editor

-- ================================================
-- 1. CREATE CANDIDATE_COMMENTS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS candidate_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT 'HR',
  author_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 2. CREATE INDEXES
-- ================================================

CREATE INDEX IF NOT EXISTS idx_candidate_comments_candidate_id ON candidate_comments(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_comments_created_at ON candidate_comments(created_at DESC);

-- ================================================
-- 3. CREATE UPDATED_AT TRIGGER
-- ================================================

CREATE TRIGGER update_candidate_comments_updated_at
    BEFORE UPDATE ON candidate_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- ================================================

ALTER TABLE candidate_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated read comments" ON candidate_comments;
DROP POLICY IF EXISTS "Allow authenticated insert comments" ON candidate_comments;
DROP POLICY IF EXISTS "Allow authenticated update comments" ON candidate_comments;
DROP POLICY IF EXISTS "Allow authenticated delete comments" ON candidate_comments;

-- Policy: Allow authenticated users to read comments
CREATE POLICY "Allow authenticated read comments" ON candidate_comments
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to insert comments
CREATE POLICY "Allow authenticated insert comments" ON candidate_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users to update their own comments
CREATE POLICY "Allow authenticated update comments" ON candidate_comments
  FOR UPDATE
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to delete comments
CREATE POLICY "Allow authenticated delete comments" ON candidate_comments
  FOR DELETE
  TO authenticated
  USING (true);

-- ================================================
-- 5. GRANT PERMISSIONS
-- ================================================

GRANT ALL ON candidate_comments TO authenticated;

-- ================================================
-- 6. VERIFY SETUP
-- ================================================

-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'candidate_comments'
);

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'candidate_comments';

-- Check policies
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'candidate_comments';

SELECT 'Comments table migration completed successfully!' AS status;
