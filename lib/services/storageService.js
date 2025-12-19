import { supabase } from '../supabase/client';

const RESUMES_BUCKET = 'resumes';

export const uploadResume = async (file, email, originalFileName = null) => {
  try {
    // Create a unique filename
    const timestamp = Date.now();
    const sanitizedEmail = email.replace(/[^a-zA-Z0-9]/g, '_');

    // Get file extension from original filename or file object
    let fileExt = 'pdf';
    if (originalFileName) {
      fileExt = originalFileName.split('.').pop();
    } else if (file.name) {
      fileExt = file.name.split('.').pop();
    }

    const fileName = `${sanitizedEmail}_${timestamp}.${fileExt}`;
    const filePath = `public/${fileName}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(RESUMES_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/pdf',
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload resume: ${error.message}`);
    }

    return {
      success: true,
      path: data.path,
      fileName: fileName,
    };
  } catch (error) {
    console.error('Storage service error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getResumeUrl = async (path) => {
  try {
    const { data, error } = await supabase.storage
      .from(RESUMES_BUCKET)
      .createSignedUrl(path, 300); // 5 minutes expiry

    if (error) {
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }

    return {
      success: true,
      url: data.signedUrl,
    };
  } catch (error) {
    console.error('Get URL error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const downloadResume = async (path) => {
  try {
    const { data, error } = await supabase.storage
      .from(RESUMES_BUCKET)
      .download(path);

    if (error) {
      throw new Error(`Failed to download resume: ${error.message}`);
    }

    return {
      success: true,
      blob: data,
    };
  } catch (error) {
    console.error('Download error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const deleteResume = async (path) => {
  try {
    const { error } = await supabase.storage
      .from(RESUMES_BUCKET)
      .remove([path]);

    if (error) {
      throw new Error(`Failed to delete resume: ${error.message}`);
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
