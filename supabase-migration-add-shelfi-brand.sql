-- Add SHELFi brand to job_posts
-- Run this in Supabase SQL Editor

ALTER TABLE job_posts DROP CONSTRAINT IF EXISTS job_posts_brand_check;
ALTER TABLE job_posts ADD CONSTRAINT job_posts_brand_check CHECK (brand IN ('venzo', 'kytz', 'shelfi'));

SELECT 'SHELFi brand added successfully!' AS status;
