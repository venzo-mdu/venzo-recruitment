import { supabase } from '../supabase/client';

export const submitCandidate = async (candidateData) => {
  try {
    const { data, error } = await supabase
      .from('candidates')
      .insert([{
        full_name: candidateData.fullName,
        email: candidateData.email,
        phone: candidateData.phone,
        position: '', // Default value for removed field
        experience: 0, // Default value for removed field
        current_salary: candidateData.currentSalary,
        expected_salary: candidateData.expectedSalary,
        notice_period: 0, // Default value for removed field
        linkedin_url: null,
        portfolio_url: null,
        skills: [],
        resume_path: candidateData.resumePath,
        cover_letter: null,
        status: 'PENDING',
        ai_summary: null,
      }])
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);

      // Parse error and return user-friendly message
      let userMessage = 'Failed to submit application. Please try again.';

      // Check for duplicate email
      if (error.code === '23505' && error.message.includes('email')) {
        userMessage = 'This email address has already been used to submit an application. Please use a different email or contact HR if you need to update your application.';
      }
      // Check for duplicate phone
      else if (error.code === '23505' && error.message.includes('phone')) {
        userMessage = 'This phone number has already been used to submit an application. Please use a different phone number or contact HR if you need to update your application.';
      }
      // Check for RLS policy violation
      else if (error.code === '42501') {
        userMessage = 'Permission denied. Please contact support if this issue persists.';
      }

      throw new Error(userMessage);
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Submit candidate error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getCandidates = async (filters = {}) => {
  try {
    let query = supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.search) {
      query = query.or(
        `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,position.ilike.%${filters.search}%`
      );
    }

    if (filters.position) {
      query = query.ilike('position', `%${filters.position}%`);
    }

    if (filters.minExperience !== undefined) {
      query = query.gte('experience', filters.minExperience);
    }

    if (filters.maxExperience !== undefined) {
      query = query.lte('experience', filters.maxExperience);
    }

    if (filters.minSalary !== undefined) {
      query = query.gte('expected_salary', filters.minSalary);
    }

    if (filters.maxSalary !== undefined) {
      query = query.lte('expected_salary', filters.maxSalary);
    }

    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch candidates: ${error.message}`);
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Get candidates error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getCandidateById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch candidate: ${error.message}`);
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Get candidate error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const updateCandidateStatus = async (id, status) => {
  try {
    // Validate status
    if (!['PENDING', 'SHORTLISTED', 'REJECTED'].includes(status)) {
      throw new Error('Invalid status value');
    }

    const { data, error } = await supabase
      .from('candidates')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update status: ${error.message}`);
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Update status error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Legacy function for backwards compatibility
export const toggleShortlist = async (id, isShortlisted) => {
  return updateCandidateStatus(id, isShortlisted ? 'SHORTLISTED' : 'PENDING');
};

export const updateAISummary = async (id, summary) => {
  try {
    const { data, error } = await supabase
      .from('candidates')
      .update({ ai_summary: summary })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update AI summary: ${error.message}`);
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Update AI summary error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const deleteCandidate = async (id) => {
  try {
    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete candidate: ${error.message}`);
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete candidate error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
