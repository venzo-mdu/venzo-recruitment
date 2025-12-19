# Database Migration Required

## Critical: Run This Migration

You need to run the updated database migration to fix the `current_salary` constraint error.

## Steps:

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to: **SQL Editor**

2. **Run the Migration**
   - Open the file: `supabase-migration-analysis.sql`
   - Copy the entire content
   - Paste into Supabase SQL Editor
   - Click **Run**

3. **Verify Migration**
   The migration will:
   - Add all new analysis columns (scoring, SWIFT messages, etc.)
   - Make `current_salary` nullable (fixes the constraint error)
   - Make `position`, `experience`, `notice_period` nullable
   - Create indexes for performance

## What Was Fixed

### 1. Database Constraint Error ✅
- **Issue**: `current_salary` was NOT NULL, but AI sometimes can't extract salary
- **Fix**: Made `current_salary` nullable in migration
- **File**: [supabase-migration-analysis.sql:43](supabase-migration-analysis.sql#L43)

### 2. JSON Parsing Error ✅
- **Issue**: AI sometimes returns incomplete JSON, causing crashes
- **Fix**: Added try-catch with detailed error logging
- **File**: [app/api/generate-summary/route.js:171-196](app/api/generate-summary/route.js#L171-L196)

### 3. Blocking AI Analysis ✅
- **Issue**: Candidate fetch waited for AI analysis to complete
- **Fix**: Made AI analysis run in background without blocking
- **File**: [app/dashboard/page.js:38-57](app/dashboard/page.js#L38-L57)

## Expected Behavior After Migration

1. **Fast Page Load**: Candidates display immediately
2. **Background Processing**: AI analysis runs in background
3. **Progress Indicator**: Shows "Generating AI summaries... (X of Y)"
4. **Live Updates**: Candidates update with scores as analysis completes
5. **No Crashes**: Handles missing data and parsing errors gracefully

## Testing

After running the migration, test by:
1. Submitting a new candidate application
2. Check that candidates list loads immediately
3. Watch AI analysis progress indicator
4. Verify analysis appears without page refresh
5. Check console logs for any errors
