import { supabase } from '../supabase/client';

export const getComments = async (candidateId) => {
  try {
    const { data, error } = await supabase
      .from('candidate_comments')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch comments: ${error.message}`);
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Get comments error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const addComment = async (candidateId, comment, authorName = 'HR', authorEmail = null) => {
  try {
    const { data, error } = await supabase
      .from('candidate_comments')
      .insert([{
        candidate_id: candidateId,
        comment,
        author_name: authorName,
        author_email: authorEmail,
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add comment: ${error.message}`);
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Add comment error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const updateComment = async (commentId, comment) => {
  try {
    const { data, error } = await supabase
      .from('candidate_comments')
      .update({ comment })
      .eq('id', commentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update comment: ${error.message}`);
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Update comment error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const deleteComment = async (commentId) => {
  try {
    const { error } = await supabase
      .from('candidate_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      throw new Error(`Failed to delete comment: ${error.message}`);
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete comment error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
