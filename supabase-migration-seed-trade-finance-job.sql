-- Venzo Recruitment Portal - Seed Trade Finance Job Post
-- Run this script in your Supabase SQL Editor AFTER the job_posts migration

-- ================================================
-- 1. INSERT LEGACY TRADE FINANCE JOB POST
-- Uses the first auth user as the creator
-- ================================================

INSERT INTO job_posts (
  title,
  brand,
  department,
  location,
  employment_type,
  salary_range_min,
  salary_range_max,
  description,
  requirements,
  status,
  created_by,
  created_by_email
)
SELECT
  'Trade Finance QA / BA / Implementation Consultant',
  'venzo',
  'Trade Finance',
  'Chennai / Hybrid',
  'full-time',
  600000,
  900000,
  'Move from Ops to TradeTech: QA → Business Analyst → Implementation Consulting.

Work on Trade Finance, SCF & TBML platforms with leading banks and fintechs.

We are looking for candidates with trade finance operations experience who want to transition into technology roles. You will work on trade finance platforms, performing QA testing, business analysis, and eventually implementation consulting for banks and financial institutions.

Responsibilities:
• Test and validate trade finance platform features (LCs, Guarantees, Collections, SBLC, BG, Payments)
• Perform UAT testing, requirements gathering, and system testing
• Work with SWIFT messages (MT700, MT710, MT760, etc.)
• Document business requirements and functional specifications
• Support digital transformation and automation projects
• Coordinate with development teams and banking clients

This is a growth-track role: start as QA Analyst, progress to Business Analyst, and advance to Implementation Consultant.',

  'Must have:
• Deep knowledge of trade finance products (Import/Export LC, Collections, Guarantees, SBLC, BG, Payments)
• Familiarity with SWIFT messages and trade finance operations
• Can speak clearly on calls and write crisp updates
• Comfortable with systems/screens/flows
• Learn fast, ask smart questions

Nice to have:
• CS/IT degree or certifications
• BA/UAT testing exposure
• SQL, automation tools, SDLC knowledge
• Experience with digital transformation or process improvement projects',

  'OPEN',
  u.id,
  u.email
FROM auth.users u
ORDER BY u.created_at ASC
LIMIT 1;

-- ================================================
-- 2. LINK EXISTING CANDIDATES TO THIS JOB POST
-- ================================================

UPDATE candidates
SET job_post_id = (
  SELECT id FROM job_posts
  WHERE title = 'Trade Finance QA / BA / Implementation Consultant'
  LIMIT 1
)
WHERE job_post_id IS NULL;

-- ================================================
-- 3. VERIFY
-- ================================================

SELECT id, title, brand, status, created_by_email
FROM job_posts
WHERE title = 'Trade Finance QA / BA / Implementation Consultant';

SELECT COUNT(*) AS candidates_linked
FROM candidates
WHERE job_post_id IS NOT NULL;

SELECT 'Trade finance job seeded and candidates linked!' AS status;
