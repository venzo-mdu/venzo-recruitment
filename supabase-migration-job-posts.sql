-- Venzo Recruitment Portal - Job Posts Migration
-- Run this script in your Supabase SQL Editor

-- ================================================
-- 1. CREATE JOB_POSTS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS job_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT 'venzo' CHECK (brand IN ('venzo', 'kytz')),
  department TEXT,
  location TEXT,
  employment_type TEXT DEFAULT 'full-time',
  salary_range_min NUMERIC,
  salary_range_max NUMERIC,
  description TEXT NOT NULL,
  requirements TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('DRAFT', 'OPEN', 'PAUSED', 'CLOSED')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_by_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 2. CREATE INDEXES
-- ================================================

CREATE INDEX IF NOT EXISTS idx_job_posts_status ON job_posts(status);
CREATE INDEX IF NOT EXISTS idx_job_posts_brand ON job_posts(brand);
CREATE INDEX IF NOT EXISTS idx_job_posts_created_by ON job_posts(created_by);
CREATE INDEX IF NOT EXISTS idx_job_posts_created_at ON job_posts(created_at DESC);

-- ================================================
-- 3. CREATE UPDATED_AT TRIGGER
-- ================================================

CREATE TRIGGER update_job_posts_updated_at
    BEFORE UPDATE ON job_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- ================================================

ALTER TABLE job_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read open jobs" ON job_posts;
DROP POLICY IF EXISTS "Allow authenticated read all jobs" ON job_posts;
DROP POLICY IF EXISTS "Allow authenticated insert jobs" ON job_posts;
DROP POLICY IF EXISTS "Allow authenticated update jobs" ON job_posts;
DROP POLICY IF EXISTS "Allow authenticated delete jobs" ON job_posts;

-- Public can read OPEN job posts (for public job listings)
CREATE POLICY "Allow public read open jobs" ON job_posts
  FOR SELECT
  TO anon
  USING (status = 'OPEN');

-- Authenticated can read all job posts
CREATE POLICY "Allow authenticated read all jobs" ON job_posts
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated can create job posts (created_by must match their user id)
CREATE POLICY "Allow authenticated insert jobs" ON job_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Authenticated can update any job post
CREATE POLICY "Allow authenticated update jobs" ON job_posts
  FOR UPDATE
  TO authenticated
  USING (true);

-- Authenticated can delete their own job posts
CREATE POLICY "Allow authenticated delete jobs" ON job_posts
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- ================================================
-- 5. GRANT PERMISSIONS
-- ================================================

GRANT SELECT ON job_posts TO anon;
GRANT ALL ON job_posts TO authenticated;

-- ================================================
-- 6. ALTER CANDIDATES TABLE
-- ================================================

-- Add job_post_id foreign key
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS job_post_id UUID REFERENCES job_posts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_candidates_job_post_id ON candidates(job_post_id);

-- Change email uniqueness from global to per-job
-- (allows same person to apply to different jobs)
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_email_key;
ALTER TABLE candidates ADD CONSTRAINT candidates_email_job_unique UNIQUE (email, job_post_id);

-- ================================================
-- 7. VERIFY SETUP
-- ================================================

SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'job_posts'
);

SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'job_posts';

SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'job_posts';

SELECT 'Job posts migration completed successfully!' AS status;
