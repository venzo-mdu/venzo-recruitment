import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIP } from '../../../lib/utils/rateLimiter';
import { submitCandidate } from '../../../lib/services/candidateService';
import { uploadResume } from '../../../lib/services/storageService';

export async function POST(request) {
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);

    // Check rate limit
    const rateLimitResult = checkRateLimit(clientIP);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: rateLimitResult.message,
          rateLimitExceeded: true,
        },
        {
          status: 429, // Too Many Requests
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '3600',
            'X-RateLimit-Limit': '3',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + (rateLimitResult.retryAfter * 1000)).toISOString(),
          }
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { candidateData, resumeFile } = body;

    // Validate required fields
    if (!candidateData || !resumeFile) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // Convert base64 resume back to Buffer for upload
    const resumeBuffer = Buffer.from(resumeFile.data, 'base64');

    // Create a proper file-like object for Supabase upload
    // We need to preserve the filename and content type
    const fileWithMetadata = {
      buffer: resumeBuffer,
      name: resumeFile.name,
      type: resumeFile.type || 'application/pdf',
    };

    // Upload resume (passing just the buffer, the service will use name from second param)
    const uploadResult = await uploadResume(resumeBuffer, candidateData.email, resumeFile.name);
    if (!uploadResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: uploadResult.error || 'Failed to upload resume',
        },
        { status: 500 }
      );
    }

    // Submit candidate with resume path
    const finalCandidateData = {
      ...candidateData,
      resumePath: uploadResult.path,
    };

    const submitResult = await submitCandidate(finalCandidateData);

    if (!submitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: submitResult.error,
        },
        { status: 400 }
      );
    }

    // Return success with rate limit info
    return NextResponse.json(
      {
        success: true,
        data: submitResult.data,
      },
      {
        headers: {
          'X-RateLimit-Limit': '3',
          'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
        }
      }
    );

  } catch (error) {
    console.error('Submit candidate API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
