
import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, User, MapPin, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCareerHistory } from "@/hooks/useCareerHistory";
import CareerHistoryForm from "@/components/CareerHistoryForm";
import UserAccountManager from "@/components/UserAccountManager";

interface EmployeeData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  date_of_birth?: string;
  department?: string;
  hire_date?: string;
  address?: any;
  emergency_contact?: any;
  national_insurance_number?: string;
  tax_code?: string;
  right_to_work_status?: string;
  passport_number?: string;
  visa_expiry?: string;
  bank_details?: any;
  profile_picture?: string;
}

interface AddressHistory {
  id: string;
  line_1: string;
  line_2?: string;
  city: string;
  postcode: string;
  country: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
}

interface EmployeeDetailsProps {
  employeeId: string;
}

const EmployeeDetails = ({ employeeId }: EmployeeDetailsProps) => {
  const [showCareerForm, setShowCareerForm] = useState(false);
  const [editingCareerEntry, setEditingCareerEntry] = useState<any>(null);

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .single();
      
      if (error) throw error;
      return data as EmployeeData;
    },
    enabled: !!employeeId
  });

  const { data: careerHistory, refetch: refetchCareer } = useCareerHistory(employeeId);

  const { data: addressHistory } = useQuery({
    queryKey: ['address-history', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('address_history')
        .select('*')
        .eq('employee_id', employeeId)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      return data as AddressHistory[];
    },
    enabled: !!employeeId
  });

  const handleCareerFormSuccess = () => {
    setShowCareerForm(false);
    setEditingCareerEntry(null);
    refetchCareer();
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Not provided';
    try {
      return new Date(dateString).toLocaleDateString('en-GB');
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading employee details...</div>;
  }

  if (!employee) {
    return <div className="text-center py-4">Employee not found.</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Personal Details
          </TabsTrigger>
          <TabsTrigger value="address" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Address History
          </TabsTrigger>
          <TabsTrigger value="employment" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Employment History
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            User Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Employee's personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={employee.profile_picture || `https://api.dicebear.com/7.x/lorelei/svg?seed=${employee.first_name + employee.last_name}`} />
                  <AvatarFallback>{employee.first_name[0]}{employee.last_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-semibold">{employee.first_name} {employee.last_name}</h2>
                  <p className="text-muted-foreground">{employee.department}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input value={employee.first_name} readOnly />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input value={employee.last_name} readOnly />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={employee.email} readOnly />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input value={employee.phone_number || 'Not provided'} readOnly />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input value={formatDate(employee.date_of_birth)} readOnly />
                </div>
                <div>
                  <Label>Hire Date</Label>
                  <Input value={formatDate(employee.hire_date)} readOnly />
                </div>
                <div>
                  <Label>National Insurance Number</Label>
                  <Input value={employee.national_insurance_number || 'Not provided'} readOnly />
                </div>
                <div>
                  <Label>Tax Code</Label>
                  <Input value={employee.tax_code || 'Not provided'} readOnly />
                </div>
                <div>
                  <Label>Right to Work Status</Label>
                  <Input value={employee.right_to_work_status || 'Not provided'} readOnly />
                </div>
                <div>
                  <Label>Passport Number</Label>
                  <Input value={employee.passport_number || 'Not provided'} readOnly />
                </div>
              </div>

              {employee.emergency_contact && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Contact Name</Label>
                      <Input value={employee.emergency_contact?.name || 'Not provided'} readOnly />
                    </div>
                    <div>
                      <Label>Relationship</Label>
                      <Input value={employee.emergency_contact?.relationship || 'Not provided'} readOnly />
                    </div>
                    <div>
                      <Label>Phone Number</Label>
                      <Input value={employee.emergency_contact?.phone || 'Not provided'} readOnly />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="address" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Address History</CardTitle>
                  <CardDescription>Employee's address history and current address</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Address
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {addressHistory && addressHistory.length > 0 ? (
                <div className="space-y-4">
                  {addressHistory.map((address) => (
                    <Card key={address.id} className={address.is_current ? 'border-primary' : ''}>
                      <CardContent className="pt-4">
                        {address.is_current && (
                          <div className="mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                              Current Address
                            </span>
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Address Line 1</Label>
                            <Input value={address.line_1} readOnly />
                          </div>
                          <div>
                            <Label>Address Line 2</Label>
                            <Input value={address.line_2 || 'N/A'} readOnly />
                          </div>
                          <div>
                            <Label>City</Label>
                            <Input value={address.city} readOnly />
                          </div>
                          <div>
                            <Label>Postcode</Label>
                            <Input value={address.postcode} readOnly />
                          </div>
                          <div>
                            <Label>Country</Label>
                            <Input value={address.country} readOnly />
                          </div>
                          <div>
                            <Label>Period</Label>
                            <Input value={`${formatDate(address.start_date)} - ${address.end_date ? formatDate(address.end_date) : 'Present'}`} readOnly />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No address history available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employment" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Employment History</CardTitle>
                  <CardDescription>Employee's career progression and employment records</CardDescription>
                </div>
                <Button size="sm" onClick={() => {
                  setEditingCareerEntry(null);
                  setShowCareerForm(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Position
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {careerHistory && careerHistory.length > 0 ? (
                <div className="space-y-4">
                  {careerHistory.map((entry) => (
                    <Card key={entry.id} className={!entry.end_date ? 'border-primary' : ''}>
                      <CardContent className="pt-4">
                        {!entry.end_date && (
                          <div className="mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                              Current Position
                            </span>
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Job Title</Label>
                            <Input value={entry.job_title} readOnly />
                          </div>
                          <div>
                            <Label>Location</Label>
                            <Input value={entry.location} readOnly />
                          </div>
                          <div>
                            <Label>Employment Type</Label>
                            <Input value={entry.employment_type} readOnly />
                          </div>
                          <div>
                            <Label>Contract Type</Label>
                            <Input value={entry.contract_type} readOnly />
                          </div>
                          <div>
                            <Label>Pay Rate</Label>
                            <Input value={`${entry.currency} ${entry.pay_rate} (${entry.pay_type})`} readOnly />
                          </div>
                          <div>
                            <Label>Period</Label>
                            <Input value={`${formatDate(entry.start_date)} - ${entry.end_date ? formatDate(entry.end_date) : 'Present'}`} readOnly />
                          </div>
                        </div>
                        <div className="flex justify-end mt-4 space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCareerEntry(entry);
                              setShowCareerForm(true);
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No employment history available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <UserAccountManager 
            employee={{
              id: employee.id,
              first_name: employee.first_name,
              last_name: employee.last_name,
              email: employee.email,
              department: employee.department || ''
            }} 
            onUpdate={() => {}} 
          />
        </TabsContent>
      </Tabs>

      {showCareerForm && (
        <CareerHistoryForm
          onClose={() => setShowCareerForm(false)}
          onSuccess={handleCareerFormSuccess}
          employeeId={employeeId}
          record={editingCareerEntry}
        />
      )}
    </div>
  );
};

export default EmployeeDetails;
