-- Venzo Recruitment Portal - Supabase Database Setup
-- Run this script in your Supabase SQL Editor

-- ================================================
-- 1. CREATE CANDIDATES TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  position TEXT NOT NULL,
  experience INTEGER NOT NULL CHECK (experience >= 0 AND experience <= 50),
  expected_salary NUMERIC NOT NULL CHECK (expected_salary >= 0),
  notice_period INTEGER NOT NULL CHECK (notice_period >= 0),
  linkedin_url TEXT,
  portfolio_url TEXT,
  skills TEXT[] DEFAULT '{}',
  resume_path TEXT NOT NULL,
  cover_letter TEXT,
  is_shortlisted BOOLEAN DEFAULT FALSE,
  ai_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 2. CREATE INDEXES
-- ================================================

CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_position ON candidates(position);
CREATE INDEX IF NOT EXISTS idx_candidates_is_shortlisted ON candidates(is_shortlisted);
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON candidates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_candidates_expected_salary ON candidates(expected_salary);
CREATE INDEX IF NOT EXISTS idx_candidates_experience ON candidates(experience);

-- ================================================
-- 3. CREATE UPDATED_AT TRIGGER
-- ================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_candidates_updated_at
    BEFORE UPDATE ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- ================================================

ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public insert" ON candidates;
DROP POLICY IF EXISTS "Allow authenticated read" ON candidates;
DROP POLICY IF EXISTS "Allow authenticated update" ON candidates;
DROP POLICY IF EXISTS "Allow authenticated delete" ON candidates;

-- Policy: Allow public to insert (for candidate applications)
CREATE POLICY "Allow public insert" ON candidates
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Allow authenticated users to read (for CandidAI)
CREATE POLICY "Allow authenticated read" ON candidates
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to update (for HR operations)
CREATE POLICY "Allow authenticated update" ON candidates
  FOR UPDATE
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to delete (for HR operations)
CREATE POLICY "Allow authenticated delete" ON candidates
  FOR DELETE
  TO authenticated
  USING (true);

-- ================================================
-- 5. CREATE STORAGE BUCKET FOR RESUMES
-- ================================================

-- Create bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Allow public upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;

-- Storage Policy: Allow public to upload resumes
CREATE POLICY "Allow public upload" ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = 'public');

-- Storage Policy: Allow authenticated users to read resumes
CREATE POLICY "Allow authenticated read" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'resumes');

-- Storage Policy: Allow authenticated users to delete resumes
CREATE POLICY "Allow authenticated delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'resumes');

-- ================================================
-- 6. GRANT PERMISSIONS
-- ================================================

-- Grant permissions to authenticated users
GRANT ALL ON candidates TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant insert permission to anonymous users (for candidate submissions)
GRANT INSERT ON candidates TO anon;

-- ================================================
-- 7. CREATE SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ================================================

-- Uncomment below to insert sample data for testing

/*
INSERT INTO candidates (
  full_name,
  email,
  phone,
  position,
  experience,
  expected_salary,
  notice_period,
  linkedin_url,
  skills,
  resume_path,
  is_shortlisted
) VALUES
(
  'John Doe',
  'john.doe@example.com',
  '+91-9876543210',
  'Senior Full Stack Developer',
  5,
  1200000,
  30,
  'https://linkedin.com/in/johndoe',
  ARRAY['React', 'Node.js', 'PostgreSQL', 'AWS'],
  'public/sample_resume.pdf',
  true
),
(
  'Jane Smith',
  'jane.smith@example.com',
  '+91-9876543211',
  'UI/UX Designer',
  3,
  800000,
  60,
  'https://linkedin.com/in/janesmith',
  ARRAY['Figma', 'Adobe XD', 'User Research', 'Prototyping'],
  'public/sample_resume2.pdf',
  false
),
(
  'Mike Johnson',
  'mike.johnson@example.com',
  '+91-9876543212',
  'DevOps Engineer',
  7,
  1500000,
  45,
  'https://linkedin.com/in/mikejohnson',
  ARRAY['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Terraform'],
  'public/sample_resume3.pdf',
  true
);
*/

-- ================================================
-- 8. VERIFY SETUP
-- ================================================

-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'candidates'
);

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'candidates';

-- Check policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'candidates';

-- Check storage bucket
SELECT * FROM storage.buckets WHERE id = 'resumes';

-- ================================================
-- SETUP COMPLETE!
-- ================================================

-- Next steps:
-- 1. Create HR user accounts in Supabase Auth Dashboard
-- 2. Update .env.local with your Supabase credentials
-- 3. Test the application

SELECT 'Supabase setup completed successfully!' AS status;
