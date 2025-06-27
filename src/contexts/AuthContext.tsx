
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
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }
      
      console.log('User role data:', data);
      return data?.role || null;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  };

  const checkUserActive = async (userId: string) => {
    try {
      console.log('Checking user active status for userId:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('active')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error checking user status:', error);
        return true; // Default to active if we can't check
      }
      
      console.log('User active status:', data?.active);
      return data?.active ?? true;
    } catch (error) {
      console.error('Error checking user status:', error);
      return true;
    }
  };

  useEffect(() => {
    console.log('Setting up auth state listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          // Check if user is active
          const isActive = await checkUserActive(session.user.id);
          
          if (!isActive) {
            console.log('User is inactive, signing out');
            // Sign out inactive user
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setUserRole(null);
            setLoading(false);
            return;
          }
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(async () => {
            const role = await fetchUserRole(session.user.id);
            console.log('Setting user role:', role);
            setUserRole(role);
          }, 0);
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      
      if (session?.user) {
        // Check if user is active
        const isActive = await checkUserActive(session.user.id);
        
        if (!isActive) {
          console.log('Initial session user is inactive, signing out');
          // Sign out inactive user
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setUserRole(null);
          setLoading(false);
          return;
        }
      }

      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(async () => {
          const role = await fetchUserRole(session.user.id);
          console.log('Initial session user role:', role);
          setUserRole(role);
          setLoading(false);
        }, 0);
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

    console.log('Sign in successful, checking user active status');
    
    // Check if user is active after successful sign in
    if (data.user) {
      const isActive = await checkUserActive(data.user.id);
      
      if (!isActive) {
        console.log('User is inactive after sign in, signing out');
        // Sign out inactive user immediately
        await supabase.auth.signOut();
        return { error: { message: 'Your account has been deactivated. Please contact an administrator.' } };
      }
    }

    console.log('Sign in completed successfully');
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
