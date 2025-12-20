import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseAdmin } from '../../../lib/supabase/server';
import pdfParse from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import os from 'os';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Vision-based text extraction using OpenAI's direct PDF support
async function extractTextWithVision(buffer) {
  console.log('Using OpenAI Vision API with direct PDF support...');

  try {
    // Convert buffer to base64
    const base64Pdf = buffer.toString('base64');

    // Send PDF directly to GPT-4o (OpenAI now supports PDF files natively)
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

    // pdf-parse returned insufficient text, try Vision
    console.log('pdf-parse extracted insufficient text, falling back to Vision API...');
    const visionText = await extractTextWithVision(buffer);
    return { text: visionText, method: 'vision' };

  } catch (error) {
    console.error('pdf-parse failed:', error.message);

    // Fallback to Vision API
    try {
      const visionText = await extractTextWithVision(buffer);
      return { text: visionText, method: 'vision' };
    } catch (visionError) {
      console.error('Vision extraction also failed:', visionError.message);
      throw new Error('Failed to extract text from PDF using both methods');
    }
  }
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

    // Convert blob to buffer
    const arrayBuffer = await resumeData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF (tries pdf-parse first, falls back to Vision if needed)
    const { text: resumeText, method } = await extractTextFromPDF(buffer);
    console.log(`Text extracted using: ${method}`);

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Could not extract sufficient text from resume' },
        { status: 400 }
      );
    }

    // Generate comprehensive AI analysis using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert trade finance recruitment analyst evaluating candidates from trade operations for transition into technology roles (QA Analyst, Business Analyst, Functional Consultant) in trade finance.

EVALUATION CRITERIA (Total: 10 points):

1. **Tech Background (3 points)**:
   - Computer Science/IT degree or certifications: 1.5 pts
   - BA/UAT testing exposure: 1 pt
   - Tech courses, certifications (SQL, automation tools, SDLC knowledge): 0.5 pts

2. **Trade Finance Breadth (3 points)**:
   - Deep knowledge across multiple products (Import/Export LC, Collections, Guarantees, SBLC, BG, Payments): 3 pts
   - Moderate breadth (2-3 products): 2 pts
   - Limited to one area: 1 pt

3. **Hands-on LC/Doc Checking/UAT Experience (2 points)**:
   - Direct LC operations/document checking: 1 pt
   - UAT testing, requirements gathering, or system testing: 1 pt

4. **Digital Transformation Exposure (2 points)**:
   - Directly involved in digital transformation/automation projects: 1 pt
   - Process improvement, system testing, or IT coordination: 1 pt

RESPONSE FORMAT (JSON):
{
  "extracted_data": {
    "education": "Degree details",
    "certifications": ["List all certifications"],
    "current_position": "Current role",
    "current_company": "Current company",
    "total_experience_years": number,
    "trade_finance_experience_years": number,
    "skills": ["All relevant skills"],
    "work_history": [
      {
        "company": "Company name",
        "role": "Job title",
        "duration": "Years/months",
        "key_responsibilities": ["Major responsibilities"]
      }
    ],
    "trade_finance_products": ["Import LC", "Export LC", "Collections", "SBLC", "BG", "Guarantees", "Payments", etc.],
    "swift_messages": ["MT700", "MT710", "MT760", etc.]
  },
  "scoring": {
    "tech_background_score": 0.0-3.0,
    "tech_background_reasoning": "Explain tech background evaluation",
    "trade_finance_breadth_score": 0.0-3.0,
    "trade_finance_breadth_reasoning": "Explain product breadth",
    "hands_on_experience_score": 0.0-2.0,
    "hands_on_experience_reasoning": "Explain hands-on experience",
    "digital_transformation_score": 0.0-2.0,
    "digital_transformation_reasoning": "Explain digital/tech exposure",
    "overall_score": 0.0-10.0
  },
  "recommendation": "Highly Recommended" | "Recommended" | "Maybe" | "Not Recommended",
  "detailed_analysis": "Write a conversational, detailed analysis in this format:

[Candidate Name] – [Current Company] ([Years] yrs TF experience, [Key specialization])

Score: X.X / 10

Strengths:
• [Bullet point 1 - be specific with products, systems, achievements]
• [Bullet point 2 - mention SWIFT messages, accuracy rates, metrics]
• [Bullet point 3 - highlight unique skills or experiences]
• [Add more as needed]

Gaps:
• [Specific gap 1 - what's missing for tech transition]
• [Specific gap 2 - product breadth limitations]
• [Specific gap 3 - technical skill gaps]

Fit for Venzo:
[2-3 sentences explaining suitability for QA/BA/Consultant roles, growth potential]

Proceed: 
[Yes/Maybe/No] — [Brief reasoning]",
  "key_strengths": ["3-5 key strengths"],
  "areas_of_concern": ["Specific gaps or limitations"],
  "fit_for_role": "Detailed assessment of fit for QA → BA → Consultant track"
}

Be conversational, specific, and honest. Mention exact products, SWIFT messages, systems, metrics, and achievements. Be clear about gaps.`
        },
        {
          role: 'user',
          content: `Candidate Name: ${candidateName || 'N/A'}
Applied Position: ${position || 'N/A'}

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

    // Parse the JSON response with error handling
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw AI Response:', analysisText);

      return NextResponse.json(
        {
          error: 'Failed to parse AI analysis',
          details: parseError.message,
          rawResponse: analysisText.substring(0, 500) // First 500 chars for debugging
        },
        { status: 500 }
      );
    }

    // Validate analysis structure
    if (!analysis.extracted_data || !analysis.scoring) {
      console.error('Invalid analysis structure:', analysis);
      return NextResponse.json(
        { error: 'Invalid analysis structure returned by AI' },
        { status: 500 }
      );
    }

    const { extracted_data, scoring, recommendation, detailed_analysis, key_strengths, areas_of_concern } = analysis;

    // Prepare update data for candidate record
    const updateData = {
      ai_summary: detailed_analysis || analysis.summary, // Use detailed_analysis as the main summary
      ai_analysis: analysis,
      // Extracted data
      education: extracted_data.education || null,
      certifications: extracted_data.certifications || [],
      position: extracted_data.current_position || position || null,
      current_salary: extracted_data.current_salary || null,
      total_experience_years: extracted_data.total_experience_years || null,
      trade_finance_experience_years: extracted_data.trade_finance_experience_years || null,
      experience: Math.round(extracted_data.total_experience_years || 0),
      skills: extracted_data.skills || [],
      work_history: extracted_data.work_history || [],
      trade_finance_products: extracted_data.trade_finance_products || [],
      // Add SWIFT messages if available in extracted_data
      ...(extracted_data.swift_messages && { swift_messages: extracted_data.swift_messages }),
      // Scoring
      tech_background_score: scoring.tech_background_score || 0,
      trade_finance_breadth_score: scoring.trade_finance_breadth_score || 0,
      hands_on_experience_score: scoring.hands_on_experience_score || 0,
      digital_transformation_score: scoring.digital_transformation_score || 0,
      overall_score: scoring.overall_score || 0,
      recommendation: recommendation || 'Not Recommended',
      key_strengths: key_strengths || [],
      areas_of_concern: areas_of_concern || [],
    };

    // Update candidate record with comprehensive analysis
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
