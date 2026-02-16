
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Mail, MapPin, Calendar, Edit3, Save, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmployeeData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  date_of_birth?: string;
  department?: string;
  job_title?: string;
  hire_date?: string;
  national_insurance_number?: string;
  tax_code?: string;
  passport_number?: string;
  visa_expiry?: string;
  right_to_work_status?: string;
  emergency_contact?: Record<string, any>;
}

const HRProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<EmployeeData>>({});

  // Fetch employee data linked to the current user
  const { data: employee, isLoading, error } = useQuery({
    queryKey: ['employee-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // First get the profile to find the employee_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('employee_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.employee_id) {
        throw new Error('No employee record found for this user');
      }

      // Then get the employee data
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone_number,
          date_of_birth,
          department,
          hire_date,
          national_insurance_number,
          tax_code,
          passport_number,
          visa_expiry,
          right_to_work_status,
          emergency_contact
        `)
        .eq('id', profile.employee_id)
        .single();

      if (employeeError) {
        throw employeeError;
      }

      // Get the current position from career history
      const { data: careerHistory } = await supabase
        .from('career_history')
        .select('job_title, location')
        .eq('employee_id', profile.employee_id)
        .is('end_date', null)
        .single();

      return {
        ...employeeData,
        job_title: careerHistory?.job_title || 'Not specified',
        location: careerHistory?.location || 'Not specified'
      };
    },
    enabled: !!user?.id
  });

  // Update employee mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: async (updatedData: Partial<EmployeeData>) => {
      if (!employee?.id) throw new Error('No employee ID found');

      const { error } = await supabase
        .from('employees')
        .update(updatedData)
        .eq('id', employee.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['employee-profile', user?.id] });
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  });

  const handleSave = () => {
    updateEmployeeMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({});
    setIsEditing(false);
  };

  const startEditing = () => {
    if (employee) {
      setFormData({
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        email: employee.email || '',
        phone_number: employee.phone_number || '',
        date_of_birth: employee.date_of_birth || '',
        national_insurance_number: employee.national_insurance_number || '',
        tax_code: employee.tax_code || '',
        passport_number: employee.passport_number || '',
        visa_expiry: employee.visa_expiry || '',
        right_to_work_status: employee.right_to_work_status || 'verified'
      });
      setIsEditing(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Personal Details</h1>
          <p className="text-gray-600 mt-1">Unable to load your profile information.</p>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <div className="space-y-3">
              <User className="w-12 h-12 mx-auto text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Profile Not Found</h3>
              <p className="text-gray-500">
                No employee record is linked to your user account. Please contact your administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const profileCompletion = () => {
    const fields = [
      employee.first_name,
      employee.last_name,
      employee.email,
      employee.phone_number,
      employee.date_of_birth,
      employee.national_insurance_number,
      employee.tax_code
    ];
    const completedFields = fields.filter(field => field && field.trim() !== '').length;
    return Math.round((completedFields / fields.length) * 100);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Personal Details</h1>
          <p className="text-gray-600 mt-1">View and update your personal information.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Profile {profileCompletion()}% Complete
          </Badge>
          {!isEditing ? (
            <Button onClick={startEditing}>
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button onClick={handleSave} disabled={updateEmployeeMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {updateEmployeeMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture & Summary */}
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold">{employee.first_name} {employee.last_name}</h2>
            <p className="text-gray-600">{employee.job_title}</p>
            <p className="text-sm text-gray-500">{employee.department || 'Department not specified'}</p>
            {employee.hire_date && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Started {formatDate(employee.hire_date)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your basic personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.first_name || ''}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.last_name || ''}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone_number || ''}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.date_of_birth || ''}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="niNumber">National Insurance Number</Label>
                  <Input
                    id="niNumber"
                    value={formData.national_insurance_number || ''}
                    onChange={(e) => setFormData({ ...formData, national_insurance_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxCode">Tax Code</Label>
                  <Input
                    id="taxCode"
                    value={formData.tax_code || ''}
                    onChange={(e) => setFormData({ ...formData, tax_code: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">First Name</span>
                    <div className="text-gray-900 mt-1">{employee.first_name || 'Not provided'}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Last Name</span>
                    <div className="text-gray-900 mt-1">{employee.last_name || 'Not provided'}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-600">Email Address</span>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-900">{employee.email}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-600">Phone Number</span>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-900">{employee.phone_number || 'Not provided'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-600">Date of Birth</span>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-900">{formatDate(employee.date_of_birth)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">National Insurance</span>
                    <div className="text-gray-900 mt-1">{employee.national_insurance_number || 'Not provided'}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Tax Code</span>
                    <div className="text-gray-900 mt-1">{employee.tax_code || 'Not provided'}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        {employee.emergency_contact && (
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
              <CardDescription>Primary emergency contact</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(employee.emergency_contact as any)?.name && (
                  <div>
                    <span className="text-sm text-gray-600">Contact Name:</span>
                    <div>{(employee.emergency_contact as any).name}</div>
                  </div>
                )}
                {(employee.emergency_contact as any)?.phone && (
                  <div>
                    <span className="text-sm text-gray-600">Contact Phone:</span>
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{(employee.emergency_contact as any).phone}</span>
                    </div>
                  </div>
                )}
                {(employee.emergency_contact as any)?.relationship && (
                  <div>
                    <span className="text-sm text-gray-600">Relationship:</span>
                    <div>{(employee.emergency_contact as any).relationship}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Work Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Work Information</CardTitle>
            <CardDescription>Your employment details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600">Department</span>
                <div className="text-gray-900 mt-1">{employee.department || 'Not specified'}</div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Job Title</span>
                <div className="text-gray-900 mt-1">{employee.job_title}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600">Start Date</span>
                <div className="text-gray-900 mt-1">{formatDate(employee.hire_date)}</div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Location</span>
                <div className="text-gray-900 mt-1">{employee.location}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HRProfile;
