
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  userRole: 'admin' | 'hr_user' | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
  const [userRole, setUserRole] = useState<'admin' | 'hr_user' | null>(null);

  const fetchUserRole = async (userId: string) => {
    try {
      console.log('Fetching user role for userId:', userId);
      
      // Simple query without complex error handling
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .limit(1);
      
      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }
      
      const role = data?.[0]?.role || null;
      console.log('User role fetched:', role);
      return role;
    } catch (error) {
      console.error('Exception in fetchUserRole:', error);
      return null;
    }
  };

  useEffect(() => {
    console.log('Setting up auth state listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('User authenticated, fetching role...');
          
          // Fetch role in a non-blocking way
          fetchUserRole(session.user.id).then(role => {
            console.log('Setting user role:', role);
            setUserRole(role);
            setLoading(false);
            console.log('Authentication process completed');
          }).catch(error => {
            console.error('Role fetch failed:', error);
            setUserRole(null);
            setLoading(false);
          });
        } else {
          console.log('No session user, clearing role');
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('Initial session: fetching user role...');
        
        fetchUserRole(session.user.id).then(role => {
          console.log('Initial session user role:', role);
          setUserRole(role);
          setLoading(false);
        }).catch(error => {
          console.error('Initial role fetch failed:', error);
          setUserRole(null);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('Attempting to sign in with email:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      return { error };
    }

    console.log('Sign in successful, user data:', data.user?.email);
    return { error: null };
  };

  const signOut = async () => {
    console.log('Signing out user');
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

  console.log('AuthProvider rendering with state:', { 
    user: user?.email, 
    userRole, 
    loading,
    hasSession: !!session 
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
