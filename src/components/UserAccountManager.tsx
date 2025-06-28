
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, UserPlus, Mail, Lock, Unlock, Shield, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
}

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  employee_id: string | null;
  active: boolean;
  created_at: string;
}

interface UserAccountManagerProps {
  employee: Employee;
  onUpdate?: () => void;
}

const UserAccountManager = ({ employee, onUpdate }: UserAccountManagerProps) => {
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, [employee.id]);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('employee_id', employee.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error loading user profile:', error);
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Exception loading user profile:', error);
    }
  };

  const createUserAccount = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user-account', {
        body: {
          email: employee.email,
          firstName: employee.first_name,
          lastName: employee.last_name,
          employeeId: employee.id
        }
      });

      if (error) {
        console.error('Error creating user account:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to create user account",
          variant: "destructive"
        });
      } else if (data?.error) {
        console.error('Server error creating user account:', data.error);
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "User account created successfully",
        });
        
        loadUserProfile();
        setShowCreateDialog(false);
        onUpdate?.();
      }
    } catch (error) {
      console.error('Exception creating user account:', error);
      toast({
        title: "Error",
        description: "Failed to create user account",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async () => {
    if (!userProfile) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userProfile.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        console.error('Error sending password reset:', error);
        toast({
          title: "Error",
          description: "Failed to send password reset email",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Password reset email sent successfully",
        });
      }
    } catch (error) {
      console.error('Exception sending password reset:', error);
      toast({
        title: "Error",
        description: "Failed to send password reset email",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAccountStatus = async () => {
    if (!userProfile) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active: !userProfile.active })
        .eq('id', userProfile.id);

      if (error) {
        console.error('Error toggling account status:', error);
        toast({
          title: "Error",
          description: "Failed to update account status",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: `Account ${userProfile.active ? 'deactivated' : 'activated'} successfully`,
        });
        
        loadUserProfile();
        onUpdate?.();
      }
    } catch (error) {
      console.error('Exception toggling account status:', error);
      toast({
        title: "Error",
        description: "Failed to update account status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!userProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            User Account
          </CardTitle>
          <CardDescription>
            No user account exists for this employee
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Create User Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create User Account</DialogTitle>
                <DialogDescription>
                  This will create a user account for {employee.first_name} {employee.last_name} with email {employee.email}
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-2 pt-4">
                <Button onClick={createUserAccount} disabled={loading}>
                  Create Account
                </Button>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          User Account Management
        </CardTitle>
        <CardDescription>
          Manage user account settings and access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">{userProfile.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={userProfile.active ? "default" : "destructive"}>
                  {userProfile.active ? "Active" : "Inactive"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Created {new Date(userProfile.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Button
            variant="outline"
            onClick={sendPasswordReset}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Send Password Reset
          </Button>
          
          <Button
            variant="outline"
            onClick={toggleAccountStatus}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {userProfile.active ? (
              <>
                <Lock className="w-4 h-4" />
                Deactivate Account
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                Activate Account
              </>
            )}
          </Button>

          <Button
            variant="outline"
            disabled={true}
            className="flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Unlock Account
            <span className="text-xs">(Coming Soon)</span>
          </Button>
        </div>

        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-amber-800">
              Account unlocking for failed login attempts will be implemented in a future update.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserAccountManager;
