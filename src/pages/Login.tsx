import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Lock, User, Users } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user, userRole, loading: authLoading } = useAuth();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    console.log('Login useEffect - user:', user?.email, 'userRole:', userRole, 'authLoading:', authLoading, 'permissionsLoading:', permissionsLoading);
    
    // Only redirect if we have a user and both auth and permissions are not loading
    if (user && !authLoading && !permissionsLoading) {
      console.log('User is authenticated and both auth and permissions finished loading');
      
      // Give a small delay to ensure permissions are fully loaded, then redirect based on permissions
      setTimeout(() => {
        if (hasPermission('view_dashboard')) {
          console.log('User has dashboard permission, redirecting to dashboard');
          navigate('/');
        } else if (hasPermission('view_staff_shifts')) {
          console.log('User has staff shifts permission, redirecting to My Shifts');
          navigate('/staff/shifts');
        } else {
          // Fallback to HR profile page if no other permissions
          console.log('User has no dashboard or shifts permission, redirecting to profile');
          navigate('/hr/profile');
        }
      }, 500);
    }
  }, [user, userRole, authLoading, permissionsLoading, hasPermission, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        // Navigation will happen in useEffect when user and role are available
      }
    } catch (error) {
      console.error('Unexpected login error:', error);
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading if authentication or permissions are in progress
  if ((authLoading && user) || (user && permissionsLoading)) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Completing login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 overflow-hidden">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-4 md:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-white rounded-full shadow-lg mb-2 md:mb-4">
            <Users className="w-6 h-6 md:w-8 md:h-8 text-teal-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4">
            <span className="text-slate-800">Care</span>
            <span className="text-teal-600">HR</span>
          </h1>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-3 md:pb-4">
            <CardTitle className="text-xl md:text-2xl font-semibold text-gray-800">Welcome Back</CardTitle>
            <CardDescription className="text-gray-600 text-sm md:text-base">
              Sign in to access your account
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 md:space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                    className="pl-10 h-10 md:h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="pl-10 h-10 md:h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-10 md:h-11 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-medium shadow-lg transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <Separator className="my-4 md:my-6" />
            
            
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-4 md:mt-8 text-xs md:text-sm text-gray-500">
          <p>&copy; 2024 CareHR. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
