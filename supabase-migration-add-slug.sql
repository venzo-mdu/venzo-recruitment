-- Add slug column to job_posts
-- Run this in Supabase SQL Editor

ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS slug TEXT;

-- Generate slugs for existing job posts
UPDATE job_posts
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      TRIM(title),
      '[^a-zA-Z0-9\s-]', '', 'g'
    ),
    '\s+', '-', 'g'
  )
) || '-' || LEFT(id::text, 8)
WHERE slug IS NULL;

-- Make slug unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_posts_slug ON job_posts(slug);

SELECT id, title, slug FROM job_posts;

SELECT 'Slug column added successfully!' AS status;
