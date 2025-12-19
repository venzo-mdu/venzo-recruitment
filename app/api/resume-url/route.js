import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase/server';

export async function POST(request) {
  try {
    const { resumePath } = await request.json();

    if (!resumePath) {
      return NextResponse.json(
        { error: 'Resume path is required' },
        { status: 400 }
      );
    }

    // Generate signed URL with 5 minutes expiry
    const { data, error } = await supabaseAdmin.storage
      .from('resumes')
      .createSignedUrl(resumePath, 300);

    if (error) {
      console.error('Signed URL generation error:', error);
      return NextResponse.json(
        { error: 'Failed to generate signed URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: data.signedUrl }, { status: 200 });
  } catch (error) {
    console.error('Resume URL API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
