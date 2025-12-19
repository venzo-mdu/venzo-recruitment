# Venzo Recruitment Portal

A modern, full-stack recruitment management system built with Next.js 14, Supabase, Material-UI, and OpenAI.

## Features

### Candidate Portal
- **User-friendly application form** with comprehensive validation
- **Resume upload** (PDF only, max 5MB) with client-side validation
- **Skills tagging system** for easy categorization
- **Email confirmation** sent automatically after submission
- **Responsive design** for mobile and desktop

### CandidAI
- **Secure authentication** with Supabase Auth
- **Advanced filtering system** for candidates:
  - Search by name, email, or position
  - Filter by experience range
  - Filter by salary expectations
  - Filter by shortlist status
  - Filter by application date range
- **Sortable data table** with pagination
- **Candidate detail modal** with complete information
- **One-click shortlist toggle** functionality
- **Resume download** with signed URLs (5-minute expiry)
- **AI-powered resume analysis** using GPT-4
- **Real-time statistics dashboard**
- **Mobile-responsive card view** for smaller screens

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, Material-UI 5
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Email**: SendGrid
- **AI**: OpenAI GPT-4 Turbo
- **Styling**: Tailwind CSS + MUI

## Prerequisites

- Node.js 18+ and npm
- Supabase account
- SendGrid account
- OpenAI API key

## Setup Instructions

### 1. Clone and Install Dependencies

\`\`\`bash
cd /Users/vasanth/Desktop/projects/venzo-recruitment
npm install
\`\`\`

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)

2. Create the `candidates` table:

\`\`\`sql
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  position TEXT NOT NULL,
  experience INTEGER NOT NULL,
  expected_salary NUMERIC NOT NULL,
  notice_period INTEGER NOT NULL,
  linkedin_url TEXT,
  portfolio_url TEXT,
  skills TEXT[],
  resume_path TEXT NOT NULL,
  cover_letter TEXT,
  is_shortlisted BOOLEAN DEFAULT FALSE,
  ai_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_position ON candidates(position);
CREATE INDEX idx_candidates_is_shortlisted ON candidates(is_shortlisted);
CREATE INDEX idx_candidates_created_at ON candidates(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

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
\`\`\`

3. Create the storage bucket for resumes:

\`\`\`sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false);

-- Allow public to upload resumes
CREATE POLICY "Allow public upload" ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'resumes');

-- Allow authenticated users to read resumes
CREATE POLICY "Allow authenticated read" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'resumes');
\`\`\`

4. Create HR user accounts in Supabase Auth:
   - Go to Authentication > Users
   - Click "Add User"
   - Enter email and password for HR staff

### 3. Configure Environment Variables

Update the `.env.local` file with your credentials:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@venzo.com

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
HR_NOTIFICATION_EMAIL=hr@venzo.com
\`\`\`

**Where to find these values:**
- Supabase: Project Settings > API
- SendGrid: Settings > API Keys
- OpenAI: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

### 4. Run the Application

\`\`\`bash
# Development mode
npm run dev

# Production build
npm run build
npm start
\`\`\`

The application will be available at [http://localhost:3000](http://localhost:3000)

## Project Structure

\`\`\`
venzo-recruitment/
├── app/
│   ├── api/
│   │   ├── send-email/          # SendGrid email API
│   │   ├── resume-url/          # Signed URL generation
│   │   └── generate-summary/    # OpenAI AI summary
│   ├── dashboard/
│   │   ├── layout.js            # Protected CandidAI layout
│   │   └── page.js              # CandidAI page
│   ├── login/
│   │   └── page.js              # HR login page
│   ├── layout.js                # Root layout with providers
│   ├── page.js                  # Candidate portal homepage
│   └── globals.css              # Global styles
├── components/
│   ├── candidate/
│   │   └── CandidateForm.js     # Application form
│   ├── common/
│   │   └── SuccessDialog.js     # Success modal
│   ├── hr/
│   │   ├── FilterPanel.js       # Advanced filters
│   │   ├── CandidateTable.js    # Data table
│   │   ├── CandidateCard.js     # Mobile card view
│   │   ├── CandidateDetail.js   # Detail modal
│   │   └── AIResumeSummary.js   # AI summary component
│   └── providers/
│       └── AuthProvider.js      # Auth context
├── lib/
│   ├── services/
│   │   ├── authService.js       # Authentication
│   │   ├── candidateService.js  # Candidate CRUD
│   │   └── storageService.js    # File operations
│   ├── supabase/
│   │   ├── client.js            # Browser client
│   │   └── server.js            # Server client
│   └── utils/
│       └── validation.js        # Validation utilities
├── hooks/
│   └── useAuth.js               # Auth hook
├── theme/
│   └── theme.js                 # MUI theme
└── .env.local                   # Environment variables
\`\`\`

## Key Features Documentation

### Security

1. **Row Level Security (RLS)**: Database-level access control
2. **Signed URLs**: Time-limited resume downloads (5 minutes)
3. **Server-side API Routes**: All sensitive operations on server
4. **Environment Variables**: No credentials in code
5. **Auth Guards**: Protected routes with middleware

### Email Notifications

- Candidates receive confirmation emails
- HR team gets notified of new applications
- Professional HTML email templates
- Powered by SendGrid

### AI Resume Analysis

- Extracts text from PDF resumes
- Analyzes qualifications and experience
- Identifies key skills and achievements
- Provides suitability assessment
- Flags potential concerns
- 150-200 word summaries

### Data Validation

- Client-side form validation
- Server-side data validation
- File type and size restrictions
- Email and phone format validation
- SQL injection prevention

## Usage

### For Candidates

1. Visit the homepage at `/`
2. Fill out the application form
3. Upload your resume (PDF only)
4. Submit the application
5. Receive confirmation email

### For HR Staff

1. Navigate to `/login`
2. Sign in with your credentials
3. View all applications in the dashboard
4. Use filters to search candidates
5. Click on candidates to view details
6. Download resumes
7. Generate AI summaries
8. Toggle shortlist status

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

\`\`\`bash
# Or deploy via CLI
npm install -g vercel
vercel
\`\`\`

### Environment Variables for Production

Update `NEXT_PUBLIC_APP_URL` to your production domain:

\`\`\`env
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
\`\`\`

## Troubleshooting

### Issue: Resume upload fails
- Check Supabase storage policies
- Verify file is PDF and under 5MB
- Check browser console for errors

### Issue: Email not sending
- Verify SendGrid API key
- Check sender email is verified in SendGrid
- Review SendGrid activity dashboard

### Issue: AI summary generation fails
- Verify OpenAI API key
- Check API usage limits
- Ensure resume contains extractable text

### Issue: Authentication not working
- Verify Supabase Auth is enabled
- Check HR user exists in Supabase
- Clear browser cache and cookies

## Contributing

This is a private project for Venzo. For questions or support, contact the development team.

## License

Proprietary - Venzo Technologies
