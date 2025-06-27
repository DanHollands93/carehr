
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    console.log('Login useEffect - user:', user?.email, 'userRole:', userRole, 'authLoading:', authLoading);
    
    // Only redirect if we have a user and auth is not loading
    if (user && !authLoading) {
      console.log('User is authenticated and auth finished loading');
      
      // Give a small delay to ensure role is fetched, then redirect based on role or default
      setTimeout(() => {
        if (userRole === 'admin') {
          console.log('Redirecting admin to dashboard');
          navigate('/');
        } else if (userRole === 'hr_user') {
          console.log('Redirecting HR user to HR dashboard');
          navigate('/hr');
        } else {
          // Default redirect if role is still null or unknown
          console.log('Redirecting to default dashboard');
          navigate('/');
        }
      }, 500);
    }
  }, [user, userRole, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login form submitted with email:', email);
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        console.error('Login failed:', error);
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('Login successful');
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

  // Show loading if authentication is in progress
  if (authLoading && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Completing login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">CareHR</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>Demo credentials:</p>
            <p>Admin: admin@demo.com / admin</p>
            <p>HR User: hr@demo.com / hr</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
