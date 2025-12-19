# Quick Start Guide

Get the Venzo Recruitment Portal running locally in under 10 minutes!

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)
- SendGrid account (free tier works)
- OpenAI API key

## Quick Setup Steps

### 1. Install Dependencies (1 minute)

\`\`\`bash
npm install
\`\`\`

### 2. Set Up Supabase (3 minutes)

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy `supabase-setup.sql` content
3. Go to **SQL Editor** in Supabase
4. Paste and run the SQL script
5. Go to **Authentication** > **Users** and create an HR user
6. Get your credentials from **Project Settings** > **API**

### 3. Configure Environment Variables (2 minutes)

Update `.env.local` with your credentials:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

OPENAI_API_KEY=your_openai_key

NEXT_PUBLIC_APP_URL=http://localhost:3000
HR_NOTIFICATION_EMAIL=hr@yourdomain.com
\`\`\`

### 4. Start Development Server (1 minute)

\`\`\`bash
npm run dev
\`\`\`

Visit [http://localhost:3000](http://localhost:3000)

## Testing the Application

### Test Candidate Portal

1. Go to [http://localhost:3000](http://localhost:3000)
2. Fill out the application form
3. Upload a sample PDF resume
4. Submit and check for success message

### Test CandidAI

1. Go to [http://localhost:3000/login](http://localhost:3000/login)
2. Sign in with your HR credentials
3. View candidates, test filters, download resumes

### Test AI Summary

1. Open a candidate in the dashboard
2. Click "Generate AI Summary"
3. Wait for AI analysis to complete

## Common Issues

### Port Already in Use

\`\`\`bash
# Use a different port
npm run dev -- -p 3001
\`\`\`

### Environment Variables Not Loading

1. Restart the dev server after changing `.env.local`
2. Make sure file is named exactly `.env.local`
3. Check for syntax errors in the file

### Supabase Connection Error

1. Verify project URL and keys are correct
2. Check if Supabase project is paused (free tier)
3. Make sure RLS policies are set up

### Email Not Sending

1. Verify SendGrid API key
2. Check sender email is verified in SendGrid
3. For testing, check spam folder

### AI Summary Fails

1. Verify OpenAI API key
2. Check if you have credits in OpenAI account
3. Ensure resume has extractable text

## Project URLs

- **Home (Candidate Portal)**: http://localhost:3000
- **HR Login**: http://localhost:3000/login
- **CandidAI**: http://localhost:3000/dashboard

## What's Next?

- Read [README.md](README.md) for detailed documentation
- Review [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- Check out the code structure in the project files

## Getting Help

If you encounter issues:

1. Check the console for error messages
2. Review Supabase logs in the dashboard
3. Verify all environment variables are set correctly
4. Make sure all services (Supabase, SendGrid, OpenAI) are active

## Development Tips

### Hot Reload

The dev server supports hot reload. Changes to code will automatically refresh the page.

### Database Inspection

Use Supabase Table Editor to view candidate data:
- Go to Supabase Dashboard
- Click **Table Editor**
- Select **candidates** table

### Testing Emails

For development, consider using a test email service:
- [Mailinator](https://www.mailinator.com) for disposable emails
- SendGrid sandbox mode for testing

### API Testing

Test API routes directly:

\`\`\`bash
# Test email API
curl -X POST http://localhost:3000/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "candidateEmail": "test@example.com",
    "candidateName": "Test User",
    "position": "Developer"
  }'

# Test resume URL API (requires auth)
curl -X POST http://localhost:3000/api/resume-url \
  -H "Content-Type: application/json" \
  -d '{"resumePath": "public/test.pdf"}'
\`\`\`

## Useful Commands

\`\`\`bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Install dependencies
npm install

# Update dependencies
npm update
\`\`\`

## Sample Test Data

For testing, you can insert sample data in Supabase SQL Editor:

\`\`\`sql
INSERT INTO candidates (
  full_name, email, phone, position, experience,
  expected_salary, notice_period, skills, resume_path
) VALUES (
  'Test Candidate',
  'test@example.com',
  '+91-1234567890',
  'Software Engineer',
  3,
  800000,
  30,
  ARRAY['React', 'Node.js'],
  'public/test_resume.pdf'
);
\`\`\`

---

**Happy Coding!** 🚀

For detailed documentation, see [README.md](README.md)
