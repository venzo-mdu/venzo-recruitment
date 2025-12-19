import { supabase } from '../supabase/client';

export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  } catch (error) {
    console.error('Sign in error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Sign out error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return {
      success: false,
      error: error.message,
      user: null,
    };
  }
};

export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      session,
    };
  } catch (error) {
    console.error('Get session error:', error);
    return {
      success: false,
      error: error.message,
      session: null,
    };
  }
};

export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
};

export const resetPassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Reset password error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const updatePassword = async (newPassword) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Update password error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
