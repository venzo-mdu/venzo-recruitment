# Plan: Transform Single-Job App to Multi-Job Recruitment Platform

## Overview
Transform the current trade-finance-specific single-job recruitment app into a flexible multi-job platform where HR can create job openings, customize AI evaluation prompts, set salary caps, and manage applications per job.

---

## Already Implemented Features

### Comments/Feedback System (Completed)

The application already has a full comments/feedback system with the following features:

**Database Table: `candidate_comments`**
```sql
CREATE TABLE public.candidate_comments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  comment text NOT NULL,
  author_name text DEFAULT 'HR',
  author_email text,
  status_from text,           -- Previous status (for status change tracking)
  status_to text,             -- New status (for status change tracking)
  is_status_change boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT candidate_comments_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_candidate_comments_candidate_id ON public.candidate_comments(candidate_id);
```

**API Routes:**
- `GET /api/comments?candidateId=xxx` - Get all comments for a candidate
- `POST /api/comments` - Add a new comment (with optional status change tracking)
- `PUT /api/comments/[id]` - Update a comment
- `DELETE /api/comments/[id]` - Delete a comment

**Features:**
- Comments displayed in CandidateDetail modal
- Edit and delete existing comments
- Status change comments show visual badges with "from → to" status
- Timestamps with "(edited)" indicator

### Extended Status Pipeline (Completed)

The application uses a 10-stage recruitment pipeline defined in `/lib/constants/statuses.js`:

| Status | Color | Description |
|--------|-------|-------------|
| `PENDING` | Gray (#757575) | New application, not yet reviewed |
| `UNDER_REVIEW` | Blue (#2196f3) | Application is being reviewed |
| `SHORTLISTED` | Green (#4caf50) | Candidate selected for interview |
| `INTERVIEW_SCHEDULED` | Orange (#ff9800) | Interview has been scheduled |
| `INTERVIEWED` | Purple (#9c27b0) | Interview completed, awaiting decision |
| `OFFER_EXTENDED` | Cyan (#00bcd4) | Job offer has been sent |
| `HIRED` | Green (#4caf50) | Candidate has accepted and joined |
| `REJECTED` | Red (#f44336) | Candidate not selected |
| `ON_HOLD` | Brown (#795548) | Decision pending, candidate on hold |
| `WITHDRAWN` | Gray (#9e9e9e) | Candidate withdrew application |

**Status Change Features:**
- Mandatory comment required when changing status
- Status change modal in CandidateDetail
- Status history tracked in comments with visual badges
- Bulk status update in CandidateTable/CandidateCardView
- Status filter in table/card views

**Helper Functions:**
- `getStatusOptions()` - Get all statuses for dropdowns (sorted by order)
- `getStatusDisplay(status)` - Get label, color, bgColor for a status
- `VALID_TRANSITIONS` - Optional validation for allowed status transitions

---

## Database Changes

### New Table: `jobs`
```sql
CREATE TABLE public.jobs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,  -- URL-friendly identifier (e.g., "senior-qa-analyst")
  description text,
  department text,
  location text,
  employment_type text DEFAULT 'Full-time',  -- Full-time, Part-time, Contract

  -- AI Configuration (HR customizable)
  ai_evaluation_prompt text NOT NULL,  -- Custom prompt for AI analysis
  scoring_criteria jsonb,  -- Optional structured scoring (weights, categories)

  -- Salary Configuration
  salary_min numeric,
  salary_max numeric,
  -- Note: Warning displays if expected salary > salary_max
  -- Message: "Your CTC expectation is above ₹{salary_max} per annum. Please note that we are looking for candidates with ₹{salary_min} to ₹{salary_max} per annum. Applications with higher expectations may or may not be considered."

  -- Status
  is_active boolean DEFAULT true,

  -- Metadata
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  CONSTRAINT jobs_pkey PRIMARY KEY (id)
);

-- Indexes
CREATE INDEX idx_jobs_slug ON public.jobs(slug);
CREATE INDEX idx_jobs_is_active ON public.jobs(is_active);
CREATE INDEX idx_jobs_created_at ON public.jobs(created_at DESC);
```

### Migration for `candidates` Table
```sql
-- Add job_id column (nullable initially for existing data)
ALTER TABLE public.candidates
ADD COLUMN job_id uuid REFERENCES public.jobs(id);

-- Create index for job filtering
CREATE INDEX idx_candidates_job_id ON public.candidates(job_id);

-- Drop global unique constraints on email/phone (will be per-job unique instead)
ALTER TABLE public.candidates
DROP CONSTRAINT IF EXISTS candidates_email_key,
DROP CONSTRAINT IF EXISTS candidates_phone_key;

-- Create per-job unique constraint (same person can apply to different jobs)
CREATE UNIQUE INDEX idx_candidates_job_email ON public.candidates(job_id, email);
CREATE UNIQUE INDEX idx_candidates_job_phone ON public.candidates(job_id, phone);

-- Remove trade-finance specific constraints (make columns nullable)
ALTER TABLE public.candidates
ALTER COLUMN tech_background_score DROP NOT NULL,
ALTER COLUMN trade_finance_breadth_score DROP NOT NULL,
ALTER COLUMN hands_on_experience_score DROP NOT NULL,
ALTER COLUMN digital_transformation_score DROP NOT NULL;

-- Drop trade-finance specific CHECK constraints
ALTER TABLE public.candidates
DROP CONSTRAINT IF EXISTS candidates_tech_background_score_check,
DROP CONSTRAINT IF EXISTS candidates_trade_finance_breadth_score_check,
DROP CONSTRAINT IF EXISTS candidates_hands_on_experience_score_check,
DROP CONSTRAINT IF EXISTS candidates_digital_transformation_score_check;

-- Update recommendation constraint to be more generic
ALTER TABLE public.candidates
DROP CONSTRAINT IF EXISTS candidates_recommendation_check;

ALTER TABLE public.candidates
ADD CONSTRAINT candidates_recommendation_check
CHECK (recommendation = ANY (ARRAY['Highly Recommended', 'Recommended', 'Maybe', 'Not Recommended', 'Strong Fit', 'Good Fit', 'Potential Fit', 'Not a Fit']));

-- Update status constraint to use the new extended statuses
ALTER TABLE public.candidates
DROP CONSTRAINT IF EXISTS candidates_status_check;

ALTER TABLE public.candidates
ADD CONSTRAINT candidates_status_check
CHECK (status = ANY (ARRAY['PENDING', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'OFFER_EXTENDED', 'HIRED', 'REJECTED', 'ON_HOLD', 'WITHDRAWN']));
```

### Handling Existing Data
```sql
-- Create a "Legacy - Trade Finance" job for existing candidates
INSERT INTO public.jobs (
  title,
  slug,
  description,
  ai_evaluation_prompt,
  salary_min,
  salary_max,
  is_active
) VALUES (
  'Trade Finance Specialist (Legacy)',
  'trade-finance-legacy',
  'Legacy job for candidates who applied before multi-job support.',
  'You are an expert trade finance recruitment analyst... [existing prompt from generate-summary/route.js]',
  600000,  -- 6 LPA min
  900000,  -- 9 LPA max (warning shows if expected > this)
  false  -- Inactive so new candidates can't apply
);

-- Link existing candidates to legacy job
UPDATE public.candidates
SET job_id = (SELECT id FROM public.jobs WHERE slug = 'trade-finance-legacy')
WHERE job_id IS NULL;

-- Now make job_id NOT NULL
ALTER TABLE public.candidates
ALTER COLUMN job_id SET NOT NULL;
```

### RLS Policies for Jobs Table
```sql
-- Public can view active jobs
CREATE POLICY "Public can view active jobs" ON public.jobs
FOR SELECT USING (is_active = true);

-- Authenticated users can manage jobs
CREATE POLICY "Authenticated users can manage jobs" ON public.jobs
FOR ALL USING (auth.role() = 'authenticated');
```

---

## New Routes Structure

```
/app
├── page.js                    -- Job listings (active jobs)
├── jobs/
│   └── [slug]/
│       └── page.js            -- Candidate application form for specific job
├── dashboard/
│   ├── page.js                -- Candidates list (with job filter)
│   └── jobs/
│       ├── page.js            -- Jobs management list
│       ├── new/page.js        -- Create new job
│       └── [id]/edit/page.js  -- Edit job
└── api/
    ├── jobs/
    │   ├── route.js           -- GET (list), POST (create)
    │   └── [id]/route.js      -- GET, PUT, DELETE
    ├── comments/
    │   ├── route.js           -- GET (list), POST (create) [EXISTING]
    │   └── [id]/route.js      -- PUT, DELETE [EXISTING]
    ├── submit-candidate/route.js  -- Updated to accept job_id
    └── generate-summary/route.js  -- Updated to use job's AI prompt
```

---

## Implementation Steps

### Phase 1: Database & Backend Setup

1. **Create migration file** for jobs table and candidates modifications
2. **Create jobService.js** in `/lib/services/`:
   - `createJob(jobData)`
   - `getJobs(filters)` - with active/inactive filter
   - `getJobById(id)`
   - `getJobBySlug(slug)`
   - `updateJob(id, data)`
   - `toggleJobStatus(id)`
   - `deleteJob(id)`

3. **Update candidateService.js**:
   - Add `job_id` to `submitCandidate()`
   - Add job filter to `getCandidates(filters)`
   - Update queries to join with jobs table
   - Keep existing status validation using `CANDIDATE_STATUSES`

4. **Create Jobs API routes**:
   - `/api/jobs/route.js` - List and create jobs
   - `/api/jobs/[id]/route.js` - Get, update, delete job

### Phase 2: Public-Facing Pages

5. **Update root page `/app/page.js`**:
   - Display list of active job openings
   - Each job card shows: title, department, location, brief description
   - "Apply Now" button links to `/jobs/[slug]`

6. **Create job application page `/app/jobs/[slug]/page.js`**:
   - Fetch job by slug
   - Show job details at top
   - Render CandidateForm with job context
   - Pass job's `salary_min` and `salary_max` for warning logic

7. **Update CandidateForm.js**:
   - Accept `job` prop with job details (including `salary_min`, `salary_max`)
   - Show warning if expected salary > `salary_max`
   - Warning message: "Your CTC expectation is above ₹{salary_max formatted} per annum. Please note that we are looking for candidates with ₹{salary_min formatted} to ₹{salary_max formatted} per annum. Applications with higher expectations may or may not be considered."
   - Include `job_id` in form submission

8. **Update `/api/submit-candidate/route.js`**:
   - Accept and validate `job_id`
   - Verify job exists and is active
   - Store job_id with candidate record

### Phase 3: HR Dashboard - Jobs Management

9. **Create Jobs List page `/app/dashboard/jobs/page.js`**:
   - Table/cards showing all jobs
   - Columns: Title, Slug, Status (Active/Inactive), Candidates Count, Created Date
   - Actions: Edit, Toggle Status, Delete, View Candidates

10. **Create Job Form component** `/components/hr/JobForm.js`:
    - Title, Slug (auto-generated from title)
    - Description (rich text or textarea)
    - Department, Location, Employment Type
    - Salary Range (min, max) - warning auto-triggers when expected > max
    - **AI Evaluation Prompt Builder** (see detailed spec below)
    - Status toggle

11. **Create New Job page** `/app/dashboard/jobs/new/page.js`
12. **Create Edit Job page** `/app/dashboard/jobs/[id]/edit/page.js`

### Phase 3.5: AI Prompt Builder Component

13. **Create AI Prompt Builder** `/components/hr/AIPromptBuilder.js`:

    **Guided Builder Mode** (Step-by-step form):
    - Job Role Category dropdown (Developer, QA, BA, Designer, Manager, etc.)
    - Required Skills input (multi-select/tags)
    - Experience Level (Entry/Mid/Senior/Lead)
    - Key Evaluation Criteria checkboxes:
      - Technical skills match
      - Industry experience
      - Education requirements
      - Communication skills
      - Leadership potential
      - Cultural fit indicators
    - Custom evaluation points (add your own)
    - Scoring weights (optional advanced toggle)

    **AI Suggestion Feature**:
    - "Generate Prompt with AI" button
    - Sends job title + description + selected criteria to OpenAI
    - AI generates a comprehensive evaluation prompt
    - HR can review, edit, and accept

    **Rich Editor Mode**:
    - Toggle between "Guided" and "Advanced Editor"
    - Markdown-enabled textarea with preview
    - Syntax highlighting for prompt structure
    - Use `react-markdown` + `@uiw/react-md-editor` or similar
    - Live preview of how prompt will look
    - Character/token count indicator

14. **Create AI Prompt Suggestion API** `/app/api/generate-job-prompt/route.js`:
    - Accepts: job title, description, skills, experience level, criteria
    - Uses OpenAI to generate a tailored evaluation prompt
    - Returns suggested prompt that HR can edit

### Phase 4: Dashboard Updates

15. **Update Dashboard `/app/dashboard/page.js`**:
    - Add job filter dropdown at top
    - Update stats to show per-job or all-jobs
    - Add "Manage Jobs" button/link
    - Stats already calculate using extended statuses (HIRED, in-process statuses, etc.)

16. **Update CandidateTable.js & CandidateCardView.js**:
    - Add "Job" column showing job title
    - Add job filter in column filters
    - Keep existing status filters (already using `getStatusOptions()`)
    - Keep existing bulk status update functionality

17. **Update CandidateDetail.js**:
    - Show applied job prominently
    - Keep existing comments/feedback section
    - Keep existing status change modal with mandatory comments

### Phase 5: AI Summary Updates

18. **Update `/api/generate-summary/route.js`**:
    - Fetch job's `ai_evaluation_prompt` from database
    - Use job-specific prompt instead of hardcoded trade-finance prompt
    - Store job-relevant scores (structure depends on job's criteria)

---

## Files to Create

| File | Purpose |
|------|---------|
| `/lib/services/jobService.js` | Job CRUD operations |
| `/app/api/jobs/route.js` | Jobs list & create API |
| `/app/api/jobs/[id]/route.js` | Single job API |
| `/app/api/generate-job-prompt/route.js` | AI prompt suggestion API |
| `/app/jobs/[slug]/page.js` | Public job application page |
| `/app/dashboard/jobs/page.js` | HR jobs management |
| `/app/dashboard/jobs/new/page.js` | Create new job |
| `/app/dashboard/jobs/[id]/edit/page.js` | Edit job |
| `/components/hr/JobForm.js` | Reusable job form |
| `/components/hr/JobCard.js` | Job card for listings |
| `/components/hr/AIPromptBuilder.js` | Guided prompt builder with AI suggestions |
| `/components/public/JobListings.js` | Public job listings grid |

## Files to Modify

| File | Changes |
|------|---------|
| `/app/page.js` | Replace form with job listings |
| `/components/candidate/CandidateForm.js` | Accept job prop, dynamic salary warning |
| `/app/api/submit-candidate/route.js` | Add job_id validation, per-job duplicate check |
| `/app/api/generate-summary/route.js` | Use job's AI prompt from database |
| `/lib/services/candidateService.js` | Add job_id support, update duplicate checks |
| `/app/dashboard/page.js` | Add job filter dropdown |
| `/components/hr/CandidateTable.js` | Add job column (keep existing status features) |
| `/components/hr/CandidateCardView.js` | Add job info (keep existing status features) |
| `/components/hr/CandidateDetail.js` | Show job info (keep comments/status change modal) |
| `/app/dashboard/layout.js` | Add jobs nav link |
| `/package.json` | Add `@uiw/react-md-editor` for markdown editing |

## Existing Files (No Changes Needed)

| File | Notes |
|------|-------|
| `/lib/constants/statuses.js` | Extended 10-status pipeline already defined |
| `/app/api/comments/route.js` | Comments API already working |
| `/app/api/comments/[id]/route.js` | Comment edit/delete API already working |

---

## UI/UX Considerations

1. **Public Job Listings Page**:
   - Clean grid of job cards
   - Search/filter by department or keyword
   - Mobile responsive

2. **Job Application Page**:
   - Job details header (title, department, location, description)
   - Same candidate form below
   - Clear indication of which job they're applying for

3. **HR Jobs Management**:
   - Quick toggle for activate/deactivate
   - Copy application link button
   - View candidates directly from job row

4. **AI Prompt Builder** (Key Feature):

   **Two-Mode Interface:**
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │  [Guided Builder]  [Advanced Editor]                        │
   ├─────────────────────────────────────────────────────────────┤
   │                                                              │
   │  GUIDED BUILDER MODE:                                        │
   │  ┌─────────────────────────────────────────────────────────┐│
   │  │ Role Category: [Developer ▼]                            ││
   │  │ Experience Level: [Mid-level ▼]                         ││
   │  │ Required Skills: [React] [Node.js] [+Add]               ││
   │  │                                                         ││
   │  │ Evaluation Criteria:                                    ││
   │  │ ☑ Technical skills match                                ││
   │  │ ☑ Relevant project experience                           ││
   │  │ ☐ Leadership potential                                  ││
   │  │ ☑ Communication skills                                  ││
   │  │                                                         ││
   │  │ [🤖 Generate Prompt with AI]                            ││
   │  └─────────────────────────────────────────────────────────┘│
   │                                                              │
   │  ADVANCED EDITOR MODE:                                       │
   │  ┌─────────────────────────────────────────────────────────┐│
   │  │ # Markdown Editor                                       ││
   │  │ You are an expert recruiter evaluating candidates...    ││
   │  │                                                         ││
   │  │ ## Scoring Criteria                                     ││
   │  │ - Technical Skills (4 points)                           ││
   │  │ - Experience (3 points)                                 ││
   │  │ ...                                                     ││
   │  │                                    [Preview] [Raw]      ││
   │  └─────────────────────────────────────────────────────────┘│
   │  Token count: 450/4000                                       │
   └─────────────────────────────────────────────────────────────┘
   ```

   **AI Generation Flow:**
   1. HR fills guided form → clicks "Generate with AI"
   2. Loading spinner while API generates prompt
   3. Generated prompt appears in Advanced Editor
   4. HR reviews, edits if needed, then saves

5. **Dashboard All-Candidates View**:
   - Job filter dropdown at top (default: "All Jobs")
   - Stats update based on selected job filter
   - Job name shown as column/chip on each candidate
   - Existing status pipeline filters remain functional

6. **Candidate Detail Modal** (Already Implemented):
   - Status change with mandatory comment
   - Status history shown in comments with visual badges
   - Full comments/feedback section with edit/delete

---

## Migration Safety

- All changes are additive initially (nullable job_id)
- Existing candidates linked to legacy job before making job_id required
- No data loss during migration
- Legacy job marked inactive to prevent new applications
- Rollback possible by making job_id nullable again
- Existing comments and status history preserved

---

## Future Enhancements (Out of Scope)

- Job categories/tags
- Application deadline dates
- Multiple HR users with job-level permissions
- Email templates per job
- Custom form fields per job
- Analytics dashboard per job
- Interview scheduling integration
- Calendar sync (Google Calendar, Outlook)
- SMS notifications
- Candidate communication log
