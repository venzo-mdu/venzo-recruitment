import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase/server';

// GET /api/comments?candidateId=xxx - Get all comments for a candidate
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');

    if (!candidateId) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('candidate_comments')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('GET comments error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ comments: data });
  } catch (error) {
    console.error('GET comments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/comments - Add a new comment (with optional status change tracking)
export async function POST(request) {
  try {
    const body = await request.json();
    const { candidateId, comment, authorName, authorEmail, statusFrom, statusTo, isStatusChange } = body;

    if (!candidateId || !comment) {
      return NextResponse.json(
        { error: 'Candidate ID and comment are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('candidate_comments')
      .insert([{
        candidate_id: candidateId,
        comment,
        author_name: authorName || 'HR',
        author_email: authorEmail,
        status_from: statusFrom || null,
        status_to: statusTo || null,
        is_status_change: isStatusChange || false,
      }])
      .select()
      .single();

    if (error) {
      console.error('POST comment error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ comment: data }, { status: 201 });
  } catch (error) {
    console.error('POST comment error:', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}
