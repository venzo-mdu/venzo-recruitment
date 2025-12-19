# Deployment Guide - Venzo Recruitment Portal

This guide covers deploying the Venzo Recruitment Portal to production on Vercel with Supabase.

## Pre-Deployment Checklist

- [ ] Supabase project created and configured
- [ ] Database tables and RLS policies set up
- [ ] Storage bucket created
- [ ] HR user accounts created in Supabase Auth
- [ ] SendGrid account configured
- [ ] OpenAI API key obtained
- [ ] Code tested locally
- [ ] Environment variables documented

## Step 1: Prepare Supabase for Production

### 1.1 Database Setup

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the `supabase-setup.sql` file
4. Verify all tables and policies are created:

\`\`\`sql
-- Check candidates table
SELECT * FROM candidates LIMIT 1;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'candidates';

-- Check storage bucket
SELECT * FROM storage.buckets WHERE id = 'resumes';
\`\`\`

### 1.2 Create HR Users

1. Go to **Authentication** > **Users**
2. Click **Add User**
3. Create accounts for HR staff:
   - Email: hr@venzo.com
   - Password: (use a strong password)
   - Confirm password
4. Note these credentials for login

### 1.3 Configure Storage

1. Go to **Storage**
2. Verify **resumes** bucket exists
3. Check bucket settings:
   - Public: No
   - File size limit: 5MB
   - Allowed MIME types: application/pdf

### 1.4 Get Supabase Credentials

1. Go to **Project Settings** > **API**
2. Copy these values:
   - Project URL
   - anon/public key
   - service_role key (keep this secret!)

## Step 2: Configure SendGrid

### 2.1 Verify Sender Email

1. Log in to [SendGrid](https://app.sendgrid.com)
2. Go to **Settings** > **Sender Authentication**
3. Verify your domain or single sender email
4. Use verified email as `SENDGRID_FROM_EMAIL`

### 2.2 Create API Key

1. Go to **Settings** > **API Keys**
2. Click **Create API Key**
3. Name: "Venzo Recruitment Portal"
4. Permissions: Full Access (or Mail Send only)
5. Copy the API key (shown only once!)

### 2.3 Test Email Delivery

Test locally before deploying:

\`\`\`bash
curl -X POST http://localhost:3000/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "candidateEmail": "test@example.com",
    "candidateName": "Test Candidate",
    "position": "Software Engineer"
  }'
\`\`\`

## Step 3: Configure OpenAI

### 3.1 Get API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Click **Create new secret key**
3. Name: "Venzo Recruitment"
4. Copy the key immediately

### 3.2 Set Usage Limits (Recommended)

1. Go to **Settings** > **Limits**
2. Set monthly usage limit (e.g., $50)
3. Enable email notifications

## Step 4: Deploy to Vercel

### 4.1 Push to GitHub

\`\`\`bash
cd /Users/vasanth/Desktop/projects/venzo-recruitment

# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit - Venzo Recruitment Portal"

# Create GitHub repository and push
git remote add origin https://github.com/your-username/venzo-recruitment.git
git branch -M main
git push -u origin main
\`\`\`

### 4.2 Import to Vercel

1. Go to [Vercel Dashboard](https://vercel.com)
2. Click **Add New** > **Project**
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: .next

### 4.3 Add Environment Variables

In Vercel project settings, add these environment variables:

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# SendGrid
SENDGRID_API_KEY=SG.your_sendgrid_key_here
SENDGRID_FROM_EMAIL=noreply@venzo.com

# OpenAI
OPENAI_API_KEY=sk-your_openai_key_here

# Application
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
HR_NOTIFICATION_EMAIL=hr@venzo.com
\`\`\`

**Important**: Update `NEXT_PUBLIC_APP_URL` with your actual Vercel URL after deployment.

### 4.4 Deploy

1. Click **Deploy**
2. Wait for build to complete
3. Note your deployment URL

### 4.5 Update App URL

1. Go back to Vercel project settings
2. Update `NEXT_PUBLIC_APP_URL` with deployment URL
3. Redeploy the project

## Step 5: Post-Deployment Testing

### 5.1 Test Candidate Portal

1. Visit your deployment URL
2. Fill out the application form
3. Upload a sample PDF resume
4. Submit the application
5. Check for:
   - Success message displayed
   - Email received at candidate email
   - Email received at HR notification email
   - Data visible in Supabase dashboard

### 5.2 Test CandidAI

1. Go to `https://your-app.vercel.app/login`
2. Sign in with HR credentials
3. Verify:
   - Dashboard loads correctly
   - Statistics display properly
   - Candidate list shows submitted application
   - Filters work
   - Sorting and pagination work
   - Resume download works
   - Shortlist toggle works

### 5.3 Test AI Summary

1. In CandidAI, open a candidate detail
2. Click "Generate AI Summary"
3. Verify:
   - Summary generates successfully
   - Content is relevant and accurate
   - Summary saves to database

## Step 6: Configure Custom Domain (Optional)

### 6.1 Add Domain to Vercel

1. Go to **Project Settings** > **Domains**
2. Add your custom domain (e.g., recruitment.venzo.com)
3. Follow DNS configuration instructions

### 6.2 Update Environment Variables

Update these variables with your custom domain:

\`\`\`env
NEXT_PUBLIC_APP_URL=https://recruitment.venzo.com
\`\`\`

### 6.3 Update SendGrid

Update password reset redirect URLs if needed.

## Step 7: Monitoring and Maintenance

### 7.1 Set Up Monitoring

**Vercel Analytics**:
1. Enable in project settings
2. Monitor performance metrics

**Supabase Monitoring**:
1. Check **Database** > **Reports**
2. Monitor API usage
3. Review logs regularly

**SendGrid Analytics**:
1. Check email delivery rates
2. Monitor bounces and spam reports

**OpenAI Usage**:
1. Monitor API usage at platform.openai.com
2. Check costs daily

### 7.2 Backup Strategy

**Database Backups**:
- Supabase automatically backs up Pro plan databases
- For Free plan: Use `pg_dump` weekly

\`\`\`bash
# Export database
pg_dump -h db.your-project.supabase.co -U postgres -d postgres > backup.sql
\`\`\`

**Code Backups**:
- Code is backed up on GitHub
- Tag releases for important versions

### 7.3 Regular Maintenance

Weekly:
- [ ] Check application logs in Vercel
- [ ] Review Supabase database size
- [ ] Monitor email delivery stats
- [ ] Check OpenAI usage and costs

Monthly:
- [ ] Update dependencies
- [ ] Review and rotate API keys
- [ ] Audit HR user accounts
- [ ] Review candidate data retention

## Troubleshooting Production Issues

### Issue: Environment Variables Not Working

1. Verify all variables are set in Vercel
2. Check for typos in variable names
3. Redeploy after changing variables
4. Variables starting with `NEXT_PUBLIC_` are exposed to browser

### Issue: Database Connection Errors

1. Check Supabase project is active
2. Verify RLS policies are correct
3. Check API keys are valid
4. Review Supabase logs

### Issue: Email Not Sending

1. Verify SendGrid API key is valid
2. Check sender email is verified
3. Review SendGrid activity logs
4. Check email isn't in spam folder

### Issue: AI Summary Failing

1. Check OpenAI API key is valid
2. Verify account has credits
3. Check API usage limits
4. Review API error messages

### Issue: Resume Upload Failing

1. Check Supabase storage policies
2. Verify bucket exists
3. Check file size limits
4. Review browser console errors

## Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Rotate API keys** every 90 days
3. **Use different credentials** for development and production
4. **Enable 2FA** on all service accounts
5. **Review Supabase logs** regularly for suspicious activity
6. **Monitor OpenAI usage** for unexpected spikes
7. **Keep dependencies updated** with security patches
8. **Use strong passwords** for HR accounts
9. **Enable Vercel password protection** if needed during testing
10. **Set up alerts** for unusual activity

## Rollback Procedure

If deployment issues occur:

1. Go to Vercel dashboard
2. Click **Deployments**
3. Find previous working deployment
4. Click **...** > **Promote to Production**
5. Investigate and fix issues
6. Redeploy when ready

## Support and Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **SendGrid Docs**: https://docs.sendgrid.com
- **OpenAI Docs**: https://platform.openai.com/docs

## Deployment Checklist

- [ ] Database setup completed
- [ ] HR users created
- [ ] All environment variables configured
- [ ] Application deployed to Vercel
- [ ] Custom domain configured (if applicable)
- [ ] Candidate portal tested
- [ ] CandidAI tested
- [ ] Email notifications working
- [ ] AI summary generation working
- [ ] Resume upload/download working
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] Team trained on system usage

---

**Deployment Date**: _____________

**Deployed By**: _____________

**Production URL**: _____________

**Notes**: _____________
