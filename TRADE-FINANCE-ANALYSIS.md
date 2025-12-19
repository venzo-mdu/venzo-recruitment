# Trade Finance Candidate Analysis System

## Overview

This system is designed to evaluate candidates from trade operations roles for their potential to transition into technology roles in trade finance (software tester, business analyst, consultant).

## Evaluation Criteria

### Total Score: 10 Points

| Criterion | Weight | Description |
|-----------|--------|-------------|
| **Tech Background** | 3 pts | Computer Science/IT degree, certifications, BA/UAT testing exposure |
| **Trade Finance Breadth** | 3 pts | Knowledge across multiple products (LC, Collections, Guarantees, SBLC, BG) |
| **Hands-on Experience** | 2 pts | Direct LC operations, document checking, UAT testing |
| **Digital Transformation** | 2 pts | Involvement in digital transformation, process improvement, automation |

### Detailed Scoring Breakdown

#### 1. Tech Background (3 points)
- **1.5 pts**: Computer Science/IT degree or certifications
- **1.0 pt**: BA/UAT testing exposure
- **0.5 pts**: Tech courses, certifications (SQL, automation tools)

#### 2. Trade Finance Breadth (3 points)
- **3.0 pts**: Deep knowledge in multiple products (LC, Collections, Guarantees, SBLC, BG)
- **2.0 pts**: Moderate breadth (2-3 products)
- **1.0 pt**: Limited to one area

#### 3. Hands-on LC/Doc Checking/UAT Experience (2 points)
- **1.0 pt**: Direct LC operations/document checking
- **1.0 pt**: UAT testing or requirements gathering

#### 4. Digital Transformation Exposure (2 points)
- **1.0 pt**: Directly involved in digital transformation projects
- **1.0 pt**: Process improvement, automation, or system testing

## Recommendation Levels

| Score Range | Recommendation | Description |
|-------------|----------------|-------------|
| 8.0 - 10.0 | **Highly Recommended** | Excellent fit with strong tech background and trade finance expertise |
| 6.0 - 7.9 | **Recommended** | Good candidate with solid potential for transition |
| 4.0 - 5.9 | **Maybe** | Some gaps but could work with training |
| 0.0 - 3.9 | **Not Recommended** | Lacks critical requirements for the role |

## Database Schema

### New Columns in `candidates` Table

#### Extracted Data Fields
- `education` (TEXT): Educational background
- `certifications` (TEXT[]): Array of certifications
- `current_salary` (NUMERIC): Current salary
- `total_experience_years` (NUMERIC): Total years of experience
- `trade_finance_experience_years` (NUMERIC): Years in trade finance
- `work_history` (JSONB): Complete work history
- `trade_finance_products` (TEXT[]): Products worked with

#### Scoring Fields
- `tech_background_score` (NUMERIC): Score for tech background (0-3)
- `trade_finance_breadth_score` (NUMERIC): Score for TF breadth (0-3)
- `hands_on_experience_score` (NUMERIC): Score for hands-on exp (0-2)
- `digital_transformation_score` (NUMERIC): Score for digital transformation (0-2)
- `overall_score` (NUMERIC): Total score (0-10)
- `recommendation` (TEXT): Final recommendation

#### Analysis Fields
- `ai_analysis` (JSONB): Complete AI analysis JSON
- `key_strengths` (TEXT[]): Array of key strengths
- `areas_of_concern` (TEXT[]): Array of concerns

## Setup Instructions

### 1. Run Database Migration

Execute the migration script in Supabase SQL Editor:

```bash
# Open Supabase Dashboard > SQL Editor
# Copy and run: supabase-migration-analysis.sql
```

### 2. Verify Database Update

Check that new columns exist:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'candidates'
AND column_name LIKE '%score%' OR column_name LIKE '%analysis%';
```

### 3. Test AI Analysis

The AI analysis runs automatically when a candidate submits their application. You can also manually trigger it from the dashboard for existing candidates.

## API Endpoint

### POST `/api/generate-summary`

**Request Body:**
```json
{
  "candidateId": "uuid",
  "resumePath": "string",
  "candidateName": "string",
  "position": "string"
}
```

**Response:**
```json
{
  "success": true,
  "summary": "150-200 word summary",
  "analysis": {
    "extracted_data": { ... },
    "scoring": { ... },
    "recommendation": "Highly Recommended",
    "key_strengths": [...],
    "areas_of_concern": [...],
    "transition_readiness": "..."
  }
}
```

## Viewing Analysis Results

### Dashboard Display

The analysis results are available in the candidate detail view:

1. **Overall Score**: Displayed prominently with color coding
2. **Recommendation**: Badge showing the recommendation level
3. **Breakdown Scores**: Individual scores for each criterion
4. **Key Strengths**: Bullet list of strengths
5. **Areas of Concern**: Bullet list of gaps
6. **Extracted Data**: Auto-populated fields from resume

### Score Color Coding

- **8.0-10.0**: Green (Highly Recommended)
- **6.0-7.9**: Blue (Recommended)
- **4.0-5.9**: Orange (Maybe)
- **0.0-3.9**: Red (Not Recommended)

## Trade Finance Products Tracked

The system tracks experience with the following products:

- **LC (Letter of Credit)**
- **BG (Bank Guarantee)**
- **SBLC (Standby Letter of Credit)**
- **Collections (Documentary Collections)**
- **Guarantees (Various types)**
- **Trade Payments**
- **Supply Chain Finance**
- **SWIFT Operations**
- **UCP 600 / ISBP / URR 725**

## Key Features

### Automatic Data Extraction

The AI automatically extracts and populates:
- Education details
- Certifications
- Work history
- Current position and company
- Years of experience
- Skills
- Trade finance products worked with

### Intelligent Scoring

The scoring algorithm:
- Evaluates tech background comprehensively
- Assesses breadth vs. depth of trade finance knowledge
- Weighs hands-on operational experience
- Values digital transformation exposure
- Provides detailed reasoning for each score

### Recommendation System

Recommendations are based on:
- Overall score
- Balance of scores across criteria
- Presence of critical requirements
- Potential for growth

## Best Practices

1. **Review AI Analysis**: Always review AI-generated scores and summaries
2. **Consider Context**: Look at the reasoning behind scores
3. **Check Trade Finance Products**: Ensure breadth across products
4. **Evaluate Tech Readiness**: Prioritize candidates with tech background
5. **Look for Growth Potential**: Consider candidates who can be trained

## Troubleshooting

### Analysis Not Generating

1. Check OpenAI API key in environment variables
2. Verify resume is a valid PDF
3. Check Supabase storage permissions
4. Review server logs for errors

### Scores Seem Incorrect

1. Review the AI reasoning in `ai_analysis` field
2. Check if resume text was extracted properly
3. Manually verify the information against the actual resume
4. Consider re-running analysis if needed

## Future Enhancements

- Add manual override for scores
- Include interview feedback in analysis
- Track success rate of hired candidates
- Machine learning for improved scoring
- Integration with skills assessment tests

## Support

For issues or questions about the analysis system, check:
- Server logs: `npm run dev`
- Supabase logs: Database > Logs
- API responses: Browser DevTools > Network tab
