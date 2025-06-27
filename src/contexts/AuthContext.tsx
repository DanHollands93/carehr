
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
        console.log('Role fetch failed, checking if user_roles table exists or if user has no role assigned');
        return null;
      }
      
      console.log('User role data fetched successfully:', data);
      return data?.role || null;
    } catch (error) {
      console.error('Exception in fetchUserRole:', error);
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
        console.log('Profiles table error, defaulting to active status');
        return true; // Default to active if we can't check
      }
      
      console.log('User active status retrieved:', data?.active);
      const isActive = data?.active ?? true;
      console.log('Final active status determination:', isActive);
      return isActive;
    } catch (error) {
      console.error('Exception in checkUserActive:', error);
      return true;
    }
  };

  useEffect(() => {
    console.log('Setting up auth state listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          console.log('Session user found, checking active status...');
          // Check if user is active
          const isActive = await checkUserActive(session.user.id);
          console.log('Active status check completed:', isActive);
          
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
          
          console.log('User is active, proceeding with authentication');
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('Fetching user role...');
          // Use setTimeout to prevent blocking
          setTimeout(async () => {
            try {
              const role = await fetchUserRole(session.user.id);
              console.log('Setting user role:', role);
              setUserRole(role);
              console.log('Authentication process completed, setting loading to false');
              setLoading(false);
            } catch (error) {
              console.error('Error in role fetching:', error);
              setUserRole(null);
              setLoading(false);
            }
          }, 0);
        } else {
          console.log('No session user, clearing role and setting loading to false');
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      
      if (session?.user) {
        console.log('Initial session user found, checking active status...');
        // Check if user is active
        const isActive = await checkUserActive(session.user.id);
        console.log('Initial session active status check completed:', isActive);
        
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
        
        console.log('Initial session user is active, proceeding...');
      }

      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('Initial session: fetching user role...');
        setTimeout(async () => {
          try {
            const role = await fetchUserRole(session.user.id);
            console.log('Initial session user role:', role);
            setUserRole(role);
            console.log('Initial session authentication complete, setting loading to false');
            setLoading(false);
          } catch (error) {
            console.error('Error in initial session role fetching:', error);
            setUserRole(null);
            setLoading(false);
          }
        }, 0);
      } else {
        console.log('No initial session, setting loading to false');
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
    
    // Check if user is active after successful sign in
    if (data.user) {
      console.log('Checking if signed-in user is active...');
      const isActive = await checkUserActive(data.user.id);
      console.log('Signed-in user active status:', isActive);
      
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

  console.log('AuthProvider rendering with state:', { 
    user: user?.email, 
    userRole, 
    loading,
    hasSession: !!session 
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
