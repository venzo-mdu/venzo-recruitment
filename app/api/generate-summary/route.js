import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseAdmin } from '../../../lib/supabase/server';
import pdfParse from 'pdf-parse';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Vision-based text extraction using OpenAI's direct PDF support
async function extractTextWithVision(buffer) {
  console.log('Using OpenAI Vision API with direct PDF support...');

  try {
    const base64Pdf = buffer.toString('base64');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text content from this resume PDF. Return only the extracted text, preserving the structure as much as possible. Include all details like name, contact info, work experience, education, skills, certifications, etc.'
            },
            {
              type: 'file',
              file: {
                filename: 'resume.pdf',
                file_data: `data:application/pdf;base64,${base64Pdf}`
              }
            }
          ]
        }
      ],
      max_tokens: 4000
    });

    const extractedText = response.choices[0]?.message?.content || '';
    console.log(`Vision API extracted ${extractedText.length} characters`);
    return extractedText;
  } catch (error) {
    console.error('Vision extraction error details:', error);
    throw error;
  }
}

async function extractTextFromPDF(buffer) {
  // First try pdf-parse (fast method)
  try {
    const data = await pdfParse(buffer);
    if (data.text && data.text.trim().length >= 50) {
      console.log(`pdf-parse extracted ${data.text.length} characters`);
      return { text: data.text, method: 'pdf-parse' };
    }

    console.log('pdf-parse extracted insufficient text, falling back to Vision API...');
    const visionText = await extractTextWithVision(buffer);
    return { text: visionText, method: 'vision' };

  } catch (error) {
    console.error('pdf-parse failed:', error.message);

    try {
      const visionText = await extractTextWithVision(buffer);
      return { text: visionText, method: 'vision' };
    } catch (visionError) {
      console.error('Vision extraction also failed:', visionError.message);
      throw new Error('Failed to extract text from PDF using both methods');
    }
  }
}

function buildDynamicPrompt(jobDescription, jobRequirements, jobTitle) {
  return `You are an expert recruitment analyst. You will be given a job description and a candidate's resume. Your task is to evaluate how well the candidate fits the role.

STEP 1: Based on the job description below, identify 3-5 key evaluation criteria relevant to this role. Distribute a total of 10 points across these criteria based on their importance for the role.

STEP 2: Score the candidate's resume against each criterion you identified.

JOB TITLE: ${jobTitle}

JOB DESCRIPTION:
${jobDescription}
${jobRequirements ? `\nKEY REQUIREMENTS:\n${jobRequirements}` : ''}

RESPONSE FORMAT (JSON):
{
  "extracted_data": {
    "education": "Degree details",
    "certifications": ["List all certifications"],
    "current_position": "Current role",
    "current_company": "Current company",
    "total_experience_years": number,
    "skills": ["All relevant skills"],
    "work_history": [
      {
        "company": "Company name",
        "role": "Job title",
        "duration": "Years/months",
        "key_responsibilities": ["Major responsibilities"]
      }
    ]
  },
  "evaluation_criteria": [
    {
      "name": "Criterion name",
      "max_points": number,
      "score": number,
      "reasoning": "Why this score was given"
    }
  ],
  "overall_score": 0.0-10.0,
  "recommendation": "Highly Recommended" | "Recommended" | "Maybe" | "Not Recommended",
  "detailed_analysis": "Write a conversational, detailed analysis in this format:

[Candidate Name] – [Current Company] ([Years] yrs experience)

Score: X.X / 10

Strengths:
• [Bullet point 1 - be specific with skills, achievements, metrics]
• [Bullet point 2 - mention relevant experience and qualifications]
• [Bullet point 3 - highlight unique skills or experiences]
• [Add more as needed]

Gaps:
• [Specific gap 1 - what's missing for this role]
• [Specific gap 2 - skill or experience limitations]
• [Specific gap 3 - areas needing development]

Fit for Role:
[2-3 sentences explaining suitability for this specific position, growth potential]

Recommendation:
[Highly Recommended/Recommended/Maybe/Not Recommended] — [Brief reasoning]",
  "key_strengths": ["3-5 key strengths relevant to this role"],
  "areas_of_concern": ["Specific gaps or limitations for this role"],
  "fit_for_role": "Detailed assessment of fit for this specific position"
}

Be conversational, specific, and honest. Mention exact skills, systems, metrics, and achievements. Be clear about gaps relative to the job requirements.`;
}

export async function POST(request) {
  try {
    const { candidateId, resumePath, candidateName, position } = await request.json();

    if (!candidateId || !resumePath) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Look up the candidate to get job_post_id
    const { data: candidate, error: candidateError } = await supabaseAdmin
      .from('candidates')
      .select('job_post_id')
      .eq('id', candidateId)
      .single();

    if (candidateError) {
      console.error('Candidate lookup error:', candidateError);
    }

    // Look up the job post for dynamic AI prompt
    let jobPost = null;
    if (candidate?.job_post_id) {
      const { data: jobData, error: jobError } = await supabaseAdmin
        .from('job_posts')
        .select('title, description, requirements')
        .eq('id', candidate.job_post_id)
        .single();

      if (!jobError && jobData) {
        jobPost = jobData;
      }
    }

    // Download resume from Supabase Storage
    const { data: resumeData, error: downloadError } = await supabaseAdmin.storage
      .from('resumes')
      .download(resumePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      return NextResponse.json(
        { error: 'Failed to download resume' },
        { status: 500 }
      );
    }

    const arrayBuffer = await resumeData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { text: resumeText, method } = await extractTextFromPDF(buffer);
    console.log(`Text extracted using: ${method}`);

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Could not extract sufficient text from resume' },
        { status: 400 }
      );
    }

    // Build system prompt - dynamic if job post exists, fallback to generic
    const systemPrompt = jobPost
      ? buildDynamicPrompt(jobPost.description, jobPost.requirements, jobPost.title)
      : buildDynamicPrompt(
          'General software/technology role. Evaluate the candidate based on their overall skills, experience, and qualifications.',
          null,
          position || 'General Position'
        );

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Candidate Name: ${candidateName || 'N/A'}
${jobPost ? `Applied For: ${jobPost.title}` : `Applied Position: ${position || 'N/A'}`}

Resume Content:
${resumeText.substring(0, 8000)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const analysisText = completion.choices[0]?.message?.content;

    if (!analysisText) {
      return NextResponse.json(
        { error: 'Failed to generate analysis' },
        { status: 500 }
      );
    }

    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      return NextResponse.json(
        {
          error: 'Failed to parse AI analysis',
          details: parseError.message,
          rawResponse: analysisText.substring(0, 500)
        },
        { status: 500 }
      );
    }

    if (!analysis.extracted_data) {
      console.error('Invalid analysis structure:', analysis);
      return NextResponse.json(
        { error: 'Invalid analysis structure returned by AI' },
        { status: 500 }
      );
    }

    const { extracted_data, evaluation_criteria, recommendation, detailed_analysis, key_strengths, areas_of_concern } = analysis;

    // Calculate overall score from evaluation criteria if not provided directly
    const overallScore = analysis.overall_score ||
      (evaluation_criteria ? evaluation_criteria.reduce((sum, c) => sum + (c.score || 0), 0) : 0);

    const updateData = {
      ai_summary: detailed_analysis || analysis.summary,
      ai_analysis: analysis,
      education: extracted_data.education || null,
      certifications: extracted_data.certifications || [],
      position: extracted_data.current_position || position || null,
      total_experience_years: extracted_data.total_experience_years || null,
      experience: Math.round(extracted_data.total_experience_years || 0),
      skills: extracted_data.skills || [],
      work_history: extracted_data.work_history || [],
      overall_score: overallScore,
      recommendation: recommendation || 'Not Recommended',
      key_strengths: key_strengths || [],
      areas_of_concern: areas_of_concern || [],
    };

    const { error: updateError } = await supabaseAdmin
      .from('candidates')
      .update(updateData)
      .eq('id', candidateId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to save analysis', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      summary: detailed_analysis || analysis.summary,
      analysis,
    }, { status: 200 });

  } catch (error) {
    console.error('Generate summary error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
