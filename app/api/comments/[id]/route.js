import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/server';

// PUT /api/comments/[id] - Update a comment
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { comment } = body;

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('candidate_comments')
      .update({ comment })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('PUT comment error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ comment: data });
  } catch (error) {
    console.error('PUT comment error:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

// DELETE /api/comments/[id] - Delete a comment
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const { error } = await supabaseAdmin
      .from('candidate_comments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('DELETE comment error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE comment error:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
