'use client';

import { createContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signIn, signOut, getCurrentUser, getCurrentSession, onAuthStateChange } from '../../lib/services/authService';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check active session
    const checkUser = async () => {
      const { user: currentUser } = await getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };

    checkUser();

    // Listen for auth changes
    const { data: authListener } = onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }
      if (event === 'SIGNED_OUT') {
        console.log('User signed out');
      }

      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Periodic session refresh (every 50 minutes, before the 1-hour expiry)
    const refreshInterval = setInterval(async () => {
      const { data: { session } } = await getCurrentSession();
      if (session) {
        // Supabase will automatically refresh if needed
        console.log('Session check completed');
      }
    }, 50 * 60 * 1000); // 50 minutes

    return () => {
      authListener?.subscription?.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  useEffect(() => {
    // Redirect logic
    if (!loading) {
      const isAuthPage = pathname === '/login';
      const isDashboard = pathname?.startsWith('/dashboard');

      if (isDashboard && !user) {
        router.push('/login');
      } else if (isAuthPage && user) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  const login = async (email, password) => {
    const result = await signIn(email, password);
    if (result.success) {
      setUser(result.user);
      router.push('/dashboard');
    }
    return result;
  };

  const logout = async () => {
    const result = await signOut();
    if (result.success) {
      setUser(null);
      router.push('/login');
    }
    return result;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
