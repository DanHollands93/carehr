
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  userRole: 'admin' | 'hr_user' | 'super_admin' | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Production-safe logging
const isDevelopment = import.meta.env.DEV;
const secureLog = (message: string, ...args: any[]) => {
  if (isDevelopment) {
    console.log(message, ...args);
  }
};

const secureError = (message: string, ...args: any[]) => {
  if (isDevelopment) {
    console.error(message, ...args);
  } else {
    // In production, log without sensitive details
    console.error('Authentication error occurred');
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'hr_user' | 'super_admin' | null>(null);

  const fetchUserRole = async (userId: string) => {
    try {
      secureLog('Fetching user role for userId:', userId);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (error) {
        secureError('Error fetching user role:', error);
        return null;
      }
      
      // Prioritize: super_admin > admin > hr_user
      const roles = data?.map(r => r.role) || [];
      const role = roles.includes('super_admin') ? 'super_admin' 
                 : roles.includes('admin') ? 'admin' 
                 : roles[0] || null;
      secureLog('User role fetched:', role);
      return role;
    } catch (error) {
      secureError('Exception in fetchUserRole:', error);
      return null;
    }
  };

  useEffect(() => {
    secureLog('Setting up auth state listener');
    
    // Safety timeout - if auth never resolves, stop loading anyway
    const timeout = setTimeout(() => {
      setLoading(prev => {
        if (prev) {
          secureLog('Auth loading timed out, forcing loading=false');
          return false;
        }
        return prev;
      });
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        secureLog('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          secureLog('User authenticated, fetching role...');
          
          // Fetch role in a non-blocking way
          fetchUserRole(session.user.id).then(role => {
            secureLog('Setting user role:', role);
            setUserRole(role);
            setLoading(false);
            secureLog('Authentication process completed');
          }).catch(error => {
            secureError('Role fetch failed:', error);
            setUserRole(null);
            setLoading(false);
          });
        } else {
          secureLog('No session user, clearing role');
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      secureLog('Initial session check:', session?.user?.email);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        secureLog('Initial session: fetching user role...');
        
        fetchUserRole(session.user.id).then(role => {
          secureLog('Initial session user role:', role);
          setUserRole(role);
          setLoading(false);
        }).catch(error => {
          secureError('Initial role fetch failed:', error);
          setUserRole(null);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    secureLog('Attempting to sign in with email:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      secureError('Sign in error:', error);
      return { error };
    }

    secureLog('Sign in successful, user data:', data.user?.email);
    return { error: null };
  };

  const signOut = async () => {
    secureLog('Signing out user');
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
    userRole,
  };

  secureLog('AuthProvider rendering with state:', { 
    user: user?.email, 
    userRole, 
    loading,
    hasSession: !!session 
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
