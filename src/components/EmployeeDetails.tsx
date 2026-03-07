import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, User, MapPin, Briefcase, Pencil, Save, X, Shield, ClipboardCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCareerHistory } from "@/hooks/useCareerHistory";
import CareerHistoryForm from "@/components/CareerHistoryForm";
import UserAccountManager from "@/components/UserAccountManager";
import EmployeeComplianceTab from "@/components/EmployeeComplianceTab";
import EmployeeReviewsTab from "@/components/EmployeeReviewsTab";
import { useAuth } from "@/contexts/AuthContext";
import { useUserCompanyId } from "@/hooks/useUserCompanyId";
import { toast } from "sonner";

interface EmployeeData {
  id: string;
  first_name: string;
  last_name: string;
  known_as?: string;
  email: string;
  work_email?: string;
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
  initialTab?: string;
  initialReviewId?: string;
}

const EmployeeDetails = ({ employeeId }: EmployeeDetailsProps) => {
  const { user } = useAuth();
  const { companyId } = useUserCompanyId();
  const queryClient = useQueryClient();
  const [showCareerForm, setShowCareerForm] = useState(false);
  const [editingCareerEntry, setEditingCareerEntry] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<EmployeeData>>({});
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      if (!user) return;
      const { data } = await supabase.rpc('user_can_edit_employees', { _user_id: user.id });
      setCanEdit(data || false);
    };
    checkPermission();
  }, [user]);

  // Load form configs for this company
  const { data: formConfigs = [] } = useQuery({
    queryKey: ['employee-form-configs', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_form_configs' as any)
        .select('*')
        .eq('company_id', companyId!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const getFieldConfig = (section: string, fieldKey: string) => {
    const config = formConfigs.find((c: any) => c.section === section);
    if (!config) return { visible: true, required: false };
    const fc = (config as any).field_configs?.[fieldKey];
    return fc || { visible: true, required: false };
  };

  const getCustomFields = (section: string) => {
    const config = formConfigs.find((c: any) => c.section === section);
    return ((config as any)?.custom_fields || []) as Array<{ key: string; label: string; type: string; required: boolean; options?: string[] }>;
  };

  const isFieldVisible = (section: string, fieldKey: string) => {
    return getFieldConfig(section, fieldKey).visible !== false;
  };

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .single();
      if (error) throw error;
      return data as unknown as EmployeeData;
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

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<EmployeeData>) => {
      const { error } = await supabase
        .from('employees')
        .update(updates as any)
        .eq('id', employeeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employee-positions'] });
      setIsEditing(false);
      toast.success('Employee details updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update employee: ' + error.message);
    }
  });

  const startEditing = () => {
    if (!employee) return;
    setEditData({
      first_name: employee.first_name,
      last_name: employee.last_name,
      known_as: employee.known_as || '',
      email: employee.email,
      work_email: employee.work_email || '',
      phone_number: employee.phone_number || '',
      date_of_birth: employee.date_of_birth || '',
      national_insurance_number: employee.national_insurance_number || '',
      tax_code: employee.tax_code || '',
      emergency_contact: employee.emergency_contact || {},
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData({});
  };

  const saveChanges = () => {
    updateMutation.mutate(editData);
  };

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

  const updateField = (field: string, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const updateEmergencyContact = (field: string, value: string) => {
    setEditData(prev => ({
      ...prev,
      emergency_contact: { ...(prev.emergency_contact || {}), [field]: value }
    }));
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4" />
            Reviews
          </TabsTrigger>
          <TabsTrigger value="address" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Address
          </TabsTrigger>
          <TabsTrigger value="employment" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Employment
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Employee's personal details and contact information</CardDescription>
                </div>
                {canEdit && !isEditing && (
                  <Button variant="outline" size="sm" onClick={startEditing}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
                {isEditing && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveChanges} disabled={updateMutation.isPending}>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" size="sm" onClick={cancelEditing}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={employee.profile_picture || `https://api.dicebear.com/7.x/lorelei/svg?seed=${employee.first_name + employee.last_name}`} />
                  <AvatarFallback>{employee.first_name[0]}{employee.last_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-semibold">
                    {employee.first_name} {employee.last_name}
                    {employee.known_as && <span className="text-muted-foreground text-lg ml-2">({employee.known_as})</span>}
                  </h2>
                  <p className="text-muted-foreground">{employee.department}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name - always visible */}
                <div>
                  <Label>First Name</Label>
                  <Input value={isEditing ? editData.first_name || '' : employee.first_name} readOnly={!isEditing} onChange={(e) => updateField('first_name', e.target.value)} />
                </div>
                {/* Last Name - always visible */}
                <div>
                  <Label>Last Name</Label>
                  <Input value={isEditing ? editData.last_name || '' : employee.last_name} readOnly={!isEditing} onChange={(e) => updateField('last_name', e.target.value)} />
                </div>
                {isFieldVisible('personal_details', 'known_as') && (
                  <div>
                    <Label>Known As</Label>
                    <Input value={isEditing ? editData.known_as || '' : employee.known_as || 'Not provided'} readOnly={!isEditing} onChange={(e) => updateField('known_as', e.target.value)} />
                  </div>
                )}
                {isFieldVisible('personal_details', 'date_of_birth') && (
                  <div>
                    <Label>Date of Birth</Label>
                    {isEditing ? (
                      <Input type="date" value={editData.date_of_birth || ''} onChange={(e) => updateField('date_of_birth', e.target.value)} />
                    ) : (
                      <Input value={formatDate(employee.date_of_birth)} readOnly />
                    )}
                  </div>
                )}
                {/* Email - always visible */}
                <div>
                  <Label>Personal Email</Label>
                  <Input value={isEditing ? editData.email || '' : employee.email} readOnly={!isEditing} onChange={(e) => updateField('email', e.target.value)} />
                </div>
                {isFieldVisible('personal_details', 'work_email') && (
                  <div>
                    <Label>Work Email</Label>
                    <Input value={isEditing ? editData.work_email || '' : employee.work_email || 'Not provided'} readOnly={!isEditing} onChange={(e) => updateField('work_email', e.target.value)} />
                  </div>
                )}
                {isFieldVisible('personal_details', 'phone_number') && (
                  <div>
                    <Label>Phone Number</Label>
                    <Input value={isEditing ? editData.phone_number || '' : employee.phone_number || 'Not provided'} readOnly={!isEditing} onChange={(e) => updateField('phone_number', e.target.value)} />
                  </div>
                )}
                {isFieldVisible('personal_details', 'national_insurance_number') && (
                  <div>
                    <Label>National Insurance Number</Label>
                    <Input value={isEditing ? editData.national_insurance_number || '' : employee.national_insurance_number || 'Not provided'} readOnly={!isEditing} onChange={(e) => updateField('national_insurance_number', e.target.value)} />
                  </div>
                )}
                {isFieldVisible('personal_details', 'tax_code') && (
                  <div>
                    <Label>Tax Code</Label>
                    <Input value={isEditing ? editData.tax_code || '' : employee.tax_code || 'Not provided'} readOnly={!isEditing} onChange={(e) => updateField('tax_code', e.target.value)} />
                  </div>
                )}

                {/* Custom fields for personal_details */}
                {getCustomFields('personal_details').map(cf => (
                  <div key={cf.key}>
                    <Label>{cf.label}</Label>
                    {cf.type === 'yes_no' ? (
                      <div className="flex items-center gap-3 mt-1">
                        <Switch
                          checked={(isEditing ? (editData as any).custom_fields?.[cf.key] : (employee as any).custom_fields?.[cf.key]) === true}
                          disabled={!isEditing}
                          onCheckedChange={(v) => setEditData(prev => ({
                            ...prev,
                            custom_fields: { ...((prev as any).custom_fields || {}), [cf.key]: v }
                          }))}
                        />
                        <span className="text-sm">{(isEditing ? (editData as any).custom_fields?.[cf.key] : (employee as any).custom_fields?.[cf.key]) ? 'Yes' : 'No'}</span>
                      </div>
                    ) : cf.type === 'select' && cf.options ? (
                      isEditing ? (
                        <Select
                          value={(editData as any).custom_fields?.[cf.key] || ''}
                          onValueChange={(v) => setEditData(prev => ({
                            ...prev,
                            custom_fields: { ...((prev as any).custom_fields || {}), [cf.key]: v }
                          }))}
                        >
                          <SelectTrigger><SelectValue placeholder={`Select ${cf.label}...`} /></SelectTrigger>
                          <SelectContent>
                            {cf.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={(employee as any).custom_fields?.[cf.key] || 'Not provided'} readOnly />
                      )
                    ) : (
                      <Input
                        type={cf.type === 'date' ? 'date' : cf.type === 'number' ? 'number' : 'text'}
                        value={isEditing ? ((editData as any).custom_fields?.[cf.key] || '') : ((employee as any).custom_fields?.[cf.key] || 'Not provided')}
                        readOnly={!isEditing}
                        onChange={(e) => setEditData(prev => ({
                          ...prev,
                          custom_fields: { ...((prev as any).custom_fields || {}), [cf.key]: e.target.value }
                        }))}
                      />
                    )}
                  </div>
                ))}
              </div>

              {(employee.emergency_contact || isEditing) && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isFieldVisible('emergency_contact', 'name') && (
                      <div>
                        <Label>Contact Name</Label>
                        <Input value={isEditing ? editData.emergency_contact?.name || '' : employee.emergency_contact?.name || 'Not provided'} readOnly={!isEditing} onChange={(e) => updateEmergencyContact('name', e.target.value)} />
                      </div>
                    )}
                    {isFieldVisible('emergency_contact', 'relationship') && (
                      <div>
                        <Label>Relationship</Label>
                        <Input value={isEditing ? editData.emergency_contact?.relationship || '' : employee.emergency_contact?.relationship || 'Not provided'} readOnly={!isEditing} onChange={(e) => updateEmergencyContact('relationship', e.target.value)} />
                      </div>
                    )}
                    {isFieldVisible('emergency_contact', 'phone') && (
                      <div>
                        <Label>Phone Number</Label>
                        <Input value={isEditing ? editData.emergency_contact?.phone || '' : employee.emergency_contact?.phone || 'Not provided'} readOnly={!isEditing} onChange={(e) => updateEmergencyContact('phone', e.target.value)} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <EmployeeComplianceTab
            employeeId={employeeId}
            canEdit={canEdit}
            employee={{
              right_to_work_status: employee.right_to_work_status,
              passport_number: employee.passport_number,
              visa_expiry: employee.visa_expiry,
            }}
          />
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <EmployeeReviewsTab employeeId={employeeId} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="address" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Address History</CardTitle>
                  <CardDescription>Employee's address history and current address</CardDescription>
                </div>
                {canEdit && (
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Address
                  </Button>
                )}
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
                          <div><Label>Address Line 1</Label><Input value={address.line_1} readOnly /></div>
                          <div><Label>Address Line 2</Label><Input value={address.line_2 || 'N/A'} readOnly /></div>
                          <div><Label>City</Label><Input value={address.city} readOnly /></div>
                          <div><Label>Postcode</Label><Input value={address.postcode} readOnly /></div>
                          <div><Label>Country</Label><Input value={address.country} readOnly /></div>
                          <div><Label>Period</Label><Input value={`${formatDate(address.start_date)} - ${address.end_date ? formatDate(address.end_date) : 'Present'}`} readOnly /></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No address history available</div>
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
                {canEdit && (
                  <Button size="sm" onClick={() => { setEditingCareerEntry(null); setShowCareerForm(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Position
                  </Button>
                )}
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
                          <div><Label>Job Title</Label><Input value={entry.job_title} readOnly /></div>
                          <div><Label>Location</Label><Input value={entry.location} readOnly /></div>
                          <div><Label>Employment Type</Label><Input value={entry.employment_type} readOnly /></div>
                          <div><Label>Contract Type</Label><Input value={entry.contract_type} readOnly /></div>
                          <div><Label>Pay Rate</Label><Input value={`${entry.currency} ${entry.pay_rate} (${entry.pay_type})`} readOnly /></div>
                          <div><Label>Period</Label><Input value={`${formatDate(entry.start_date)} - ${entry.end_date ? formatDate(entry.end_date) : 'Present'}`} readOnly /></div>
                        </div>
                        {canEdit && (
                          <div className="flex justify-end mt-4 space-x-2">
                            <Button variant="outline" size="sm" onClick={() => { setEditingCareerEntry(entry); setShowCareerForm(true); }}>
                              Edit
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No employment history available</div>
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
