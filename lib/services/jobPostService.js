import { supabase } from '../supabase/client';

export const createJobPost = async (jobPostData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('job_posts')
      .insert([{
        title: jobPostData.title,
        brand: jobPostData.brand || 'venzo',
        department: jobPostData.department || null,
        location: jobPostData.location || null,
        employment_type: jobPostData.employmentType || 'full-time',
        salary_range_min: jobPostData.salaryRangeMin || null,
        salary_range_max: jobPostData.salaryRangeMax || null,
        description: jobPostData.description,
        requirements: jobPostData.requirements || null,
        status: jobPostData.status || 'OPEN',
        created_by: user.id,
        created_by_email: user.email,
      }])
      .select()
      .single();

    if (error) {
      console.error('Job post insert error:', error);
      throw new Error(`Failed to create job post: ${error.message}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Create job post error:', error);
    return { success: false, error: error.message };
  }
};

export const getJobPosts = async (filters = {}) => {
  try {
    let query = supabase
      .from('job_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.createdBy) {
      query = query.eq('created_by', filters.createdBy);
    }

    if (filters.brand) {
      query = query.eq('brand', filters.brand);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch job posts: ${error.message}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Get job posts error:', error);
    return { success: false, error: error.message };
  }
};

export const getJobPostById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('job_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch job post: ${error.message}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Get job post error:', error);
    return { success: false, error: error.message };
  }
};

export const updateJobPost = async (id, updateData) => {
  try {
    const { data, error } = await supabase
      .from('job_posts')
      .update({
        title: updateData.title,
        brand: updateData.brand,
        department: updateData.department || null,
        location: updateData.location || null,
        employment_type: updateData.employmentType || 'full-time',
        salary_range_min: updateData.salaryRangeMin || null,
        salary_range_max: updateData.salaryRangeMax || null,
        description: updateData.description,
        requirements: updateData.requirements || null,
        status: updateData.status,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update job post: ${error.message}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Update job post error:', error);
    return { success: false, error: error.message };
  }
};

export const deleteJobPost = async (id) => {
  try {
    const { error } = await supabase
      .from('job_posts')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete job post: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Delete job post error:', error);
    return { success: false, error: error.message };
  }
};
