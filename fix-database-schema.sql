-- Fix Database Schema for Venzo Recruitment Portal
-- Run this in your Supabase SQL Editor

-- Step 1: Add current_salary column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'candidates' AND column_name = 'current_salary'
    ) THEN
        ALTER TABLE candidates ADD COLUMN current_salary NUMERIC;
    END IF;
END $$;

-- Step 2: Make removed fields optional (allow NULL)
ALTER TABLE candidates
  ALTER COLUMN position DROP NOT NULL,
  ALTER COLUMN experience DROP NOT NULL,
  ALTER COLUMN notice_period DROP NOT NULL,
  ALTER COLUMN linkedin_url DROP NOT NULL,
  ALTER COLUMN portfolio_url DROP NOT NULL,
  ALTER COLUMN skills DROP NOT NULL,
  ALTER COLUMN cover_letter DROP NOT NULL;

-- Step 3: Set default values for fields
ALTER TABLE candidates
  ALTER COLUMN position SET DEFAULT '',
  ALTER COLUMN experience SET DEFAULT 0,
  ALTER COLUMN notice_period SET DEFAULT 0,
  ALTER COLUMN linkedin_url SET DEFAULT NULL,
  ALTER COLUMN portfolio_url SET DEFAULT NULL,
  ALTER COLUMN skills SET DEFAULT '{}',
  ALTER COLUMN cover_letter SET DEFAULT NULL,
  ALTER COLUMN current_salary SET DEFAULT 0;

-- Step 4: Drop existing RLS policies
DROP POLICY IF EXISTS "Allow public insert" ON candidates;
DROP POLICY IF EXISTS "Allow authenticated read" ON candidates;
DROP POLICY IF EXISTS "Allow authenticated update" ON candidates;
DROP POLICY IF EXISTS "Allow authenticated delete" ON candidates;

-- Step 5: Create new RLS policies
-- Policy: Allow anyone (including anonymous) to insert candidates
CREATE POLICY "Enable insert for all users" ON candidates
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Allow authenticated users to read all candidates
CREATE POLICY "Enable read for authenticated users" ON candidates
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to update candidates
CREATE POLICY "Enable update for authenticated users" ON candidates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to delete candidates
CREATE POLICY "Enable delete for authenticated users" ON candidates
  FOR DELETE
  TO authenticated
  USING (true);

-- Step 6: Verify the setup
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'candidates'
ORDER BY ordinal_position;

-- Step 7: Check RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'candidates';

-- Success message
SELECT 'Database schema updated successfully!' AS status;
