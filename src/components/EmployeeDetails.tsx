import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Edit, Plus, MapPin, Phone, Mail, Calendar, Briefcase, PoundSterling, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CareerHistoryForm from "@/components/CareerHistoryForm";
import { usePermissions } from "@/hooks/usePermissions";

interface Employee {
  id?: string;
  employee_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  phone_number?: string;
  national_insurance_number?: string;
  hire_date?: string;
  job_title?: string;
  location?: string;
  pay_rate?: number;
  pay_type?: string;
  employment_type?: string;
}

interface CareerHistoryEntry {
  id: string;
  job_title: string;
  location: string;
  pay_rate: number;
  pay_type: string;
  hours_per_week: number;
  employment_type: string;
  contract_type: string;
  start_date: string;
  end_date?: string;
  currency: string;
  probation_end_date?: string;
  notice_period_weeks?: number;
}

interface AddressHistoryEntry {
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

interface PersonalFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  date_of_birth: string;
  national_insurance_number: string;
  tax_code: string;
  passport_number: string;
  visa_expiry: string;
  right_to_work_status: string;
}

interface EmployeeDetailsProps {
  employee: Employee;
  onUpdate: () => void;
  onBack: () => void;
}

const EmployeeDetails = ({ employee, onUpdate, onBack }: EmployeeDetailsProps) => {
  const [showCareerForm, setShowCareerForm] = useState(false);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [personalFormData, setPersonalFormData] = useState<PersonalFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    date_of_birth: '',
    national_insurance_number: '',
    tax_code: '',
    passport_number: '',
    visa_expiry: '',
    right_to_work_status: 'verified'
  });

  const { hasPermission } = usePermissions();

  // Get the correct employee ID - could be 'id' or 'employee_id' depending on the data source
  const employeeId = employee.id || employee.employee_id;

  const { data: fullEmployee, refetch: refetchEmployee } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      if (!employeeId) return null;
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!employeeId
  });

  const { data: careerHistory = [], refetch: refetchCareer } = useQuery({
    queryKey: ['career-history', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      
      const { data, error } = await supabase
        .from('career_history')
        .select('*')
        .eq('employee_id', employeeId)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      return data as CareerHistoryEntry[];
    },
    enabled: !!employeeId
  });

  // Mock address history - in real implementation, this would come from a separate addresses table
  const [addressHistory, setAddressHistory] = useState<AddressHistoryEntry[]>(() => {
    if (fullEmployee?.address && Object.keys(fullEmployee.address).length > 0) {
      return [{
        id: '1',
        line_1: fullEmployee.address.line_1 || '',
        line_2: fullEmployee.address.line_2 || '',
        city: fullEmployee.address.city || '',
        postcode: fullEmployee.address.postcode || '',
        country: fullEmployee.address.country || 'United Kingdom',
        start_date: fullEmployee.hire_date || new Date().toISOString().split('T')[0],
        is_current: true
      }];
    }
    return [];
  });

  const formatCurrency = (amount: number, type: string) => {
    const formatted = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
    
    return type === 'hourly' ? `${formatted}/hour` : `${formatted}/year`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePersonalSave = async () => {
    if (!employeeId) {
      toast.error("Employee ID not found");
      return;
    }

    try {
      const { error } = await supabase
        .from('employees')
        .update(personalFormData)
        .eq('id', employeeId);

      if (error) throw error;

      toast.success("Personal details updated successfully!");
      setEditingPersonal(false);
      refetchEmployee();
      onUpdate();
    } catch (error) {
      console.error('Error updating personal details:', error);
      toast.error("Failed to update personal details");
    }
  };

  const handleAddAddress = async (addressData: any) => {
    // Mark current address as not current and set end date to day before new start date
    const newStartDate = new Date(addressData.start_date);
    const endDate = new Date(newStartDate);
    endDate.setDate(endDate.getDate() - 1);
    
    const updatedHistory = addressHistory.map(addr => ({
      ...addr,
      is_current: false,
      end_date: endDate.toISOString().split('T')[0]
    }));

    // Add new address
    const newAddress: AddressHistoryEntry = {
      id: Date.now().toString(),
      ...addressData,
      is_current: true
    };

    setAddressHistory([newAddress, ...updatedHistory]);
    setShowAddressDialog(false);
    toast.success("New address added successfully!");
  };

  // Use the passed employee data or fullEmployee data, prioritizing fullEmployee when available
  const displayEmployee = fullEmployee || employee;

  if (!employeeId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to List
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-red-600">Error: Employee ID not found</h2>
            <p className="text-gray-600">Unable to load employee details</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to List
          </Button>
          <div>
            <h2 className="text-2xl font-bold">
              {displayEmployee.first_name} {displayEmployee.last_name}
            </h2>
            <p className="text-gray-600">{displayEmployee.job_title}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="address">Address & Contact</TabsTrigger>
          <TabsTrigger value="career">Career History</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Basic personal details and identification</CardDescription>
                </div>
                {!editingPersonal && hasPermission('edit_employees') && (
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditingPersonal(true);
                    setPersonalFormData({
                      first_name: displayEmployee.first_name || '',
                      last_name: displayEmployee.last_name || '',
                      email: displayEmployee.email || '',
                      phone_number: displayEmployee.phone_number || '',
                      date_of_birth: displayEmployee.date_of_birth || '',
                      national_insurance_number: displayEmployee.national_insurance_number || '',
                      tax_code: displayEmployee.tax_code || '',
                      passport_number: displayEmployee.passport_number || '',
                      visa_expiry: displayEmployee.visa_expiry || '',
                      right_to_work_status: displayEmployee.right_to_work_status || 'verified'
                    });
                  }}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Details
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {editingPersonal ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="first_name">First Name *</Label>
                        <Input
                          id="first_name"
                          value={personalFormData.first_name}
                          onChange={(e) => setPersonalFormData({...personalFormData, first_name: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="last_name">Last Name *</Label>
                        <Input
                          id="last_name"
                          value={personalFormData.last_name}
                          onChange={(e) => setPersonalFormData({...personalFormData, last_name: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={personalFormData.email}
                          onChange={(e) => setPersonalFormData({...personalFormData, email: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone_number">Phone Number</Label>
                        <Input
                          id="phone_number"
                          value={personalFormData.phone_number}
                          onChange={(e) => setPersonalFormData({...personalFormData, phone_number: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="date_of_birth">Date of Birth</Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={personalFormData.date_of_birth}
                        onChange={(e) => setPersonalFormData({...personalFormData, date_of_birth: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">Government & Tax Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="national_insurance_number">National Insurance Number</Label>
                        <Input
                          id="national_insurance_number"
                          value={personalFormData.national_insurance_number}
                          onChange={(e) => setPersonalFormData({...personalFormData, national_insurance_number: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="tax_code">Tax Code</Label>
                        <Input
                          id="tax_code"
                          value={personalFormData.tax_code}
                          onChange={(e) => setPersonalFormData({...personalFormData, tax_code: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">Immigration & Work Authorization</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="passport_number">Passport Number</Label>
                        <Input
                          id="passport_number"
                          value={personalFormData.passport_number}
                          onChange={(e) => setPersonalFormData({...personalFormData, passport_number: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="visa_expiry">Visa Expiry Date</Label>
                        <Input
                          id="visa_expiry"
                          type="date"
                          value={personalFormData.visa_expiry}
                          onChange={(e) => setPersonalFormData({...personalFormData, visa_expiry: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="right_to_work_status">Right to Work Status</Label>
                        <Select
                          value={personalFormData.right_to_work_status}
                          onValueChange={(value) => setPersonalFormData({...personalFormData, right_to_work_status: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="verified">Verified</SelectItem>
                            <SelectItem value="pending">Pending Verification</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                            <SelectItem value="not_required">Not Required (UK/EU Citizen)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-6 border-t">
                    <Button variant="outline" onClick={() => setEditingPersonal(false)}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel Changes
                    </Button>
                    <Button onClick={handlePersonalSave}>
                      <Check className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <span className="text-sm font-medium text-gray-600">First Name</span>
                        <div className="text-gray-900 mt-1">{displayEmployee.first_name || 'Not provided'}</div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Last Name</span>
                        <div className="text-gray-900 mt-1">{displayEmployee.last_name || 'Not provided'}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Email Address</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-900">{displayEmployee.email}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Phone Number</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-900">{displayEmployee.phone_number || 'Not provided'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Date of Birth</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-900">
                            {displayEmployee.date_of_birth ? formatDate(displayEmployee.date_of_birth) : 'Not provided'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">Government & Tax Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <span className="text-sm font-medium text-gray-600">National Insurance Number</span>
                        <div className="text-gray-900 mt-1">{displayEmployee.national_insurance_number || 'Not provided'}</div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Tax Code</span>
                        <div className="text-gray-900 mt-1">{displayEmployee.tax_code || 'Not provided'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">Immigration & Work Authorization</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Passport Number</span>
                        <div className="text-gray-900 mt-1">{displayEmployee.passport_number || 'Not provided'}</div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Visa Expiry Date</span>
                        <div className="text-gray-900 mt-1">
                          {displayEmployee.visa_expiry ? formatDate(displayEmployee.visa_expiry) : 'Not applicable'}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Right to Work Status</span>
                        <div className="mt-1">
                          <Badge 
                            variant={
                              displayEmployee.right_to_work_status === 'verified' ? 'default' :
                              displayEmployee.right_to_work_status === 'pending' ? 'secondary' :
                              displayEmployee.right_to_work_status === 'expired' ? 'destructive' : 'outline'
                            }
                          >
                            {displayEmployee.right_to_work_status === 'verified' ? 'Verified' :
                             displayEmployee.right_to_work_status === 'pending' ? 'Pending Verification' :
                             displayEmployee.right_to_work_status === 'expired' ? 'Expired' :
                             displayEmployee.right_to_work_status === 'not_required' ? 'Not Required' :
                             'Not Set'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {displayEmployee?.emergency_contact && (
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {displayEmployee.emergency_contact.name && (
                  <div>
                    <span className="text-sm text-gray-600">Contact Name:</span>
                    <div>{displayEmployee.emergency_contact.name}</div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {displayEmployee.emergency_contact.phone && (
                    <div>
                      <span className="text-sm text-gray-600">Contact Phone:</span>
                      <div className="flex items-center space-x-3">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span>{displayEmployee.emergency_contact.phone}</span>
                      </div>
                    </div>
                  )}
                  {displayEmployee.emergency_contact.relationship && (
                    <div>
                      <span className="text-sm text-gray-600">Relationship:</span>
                      <div>{displayEmployee.emergency_contact.relationship}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="address" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Address History</h3>
            <Button onClick={() => setShowAddressDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Address
            </Button>
          </div>

          <div className="space-y-4">
            {addressHistory.map((address, index) => (
              <Card key={address.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {address.is_current ? 'Current Address' : 'Previous Address'}
                      </CardTitle>
                      <CardDescription>
                        {formatDate(address.start_date)} - {address.end_date ? formatDate(address.end_date) : 'Present'}
                      </CardDescription>
                    </div>
                    {address.is_current && (
                      <Badge variant="default">Current</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {address.line_1 && <div>{address.line_1}</div>}
                    {address.line_2 && <div>{address.line_2}</div>}
                    <div>{address.city}, {address.postcode}</div>
                    <div>{address.country}</div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {addressHistory.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No address history</h3>
                  <p className="text-gray-600 mb-4">Add the employee's address information</p>
                  <Button onClick={() => setShowAddressDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Address
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="career" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Career History</h3>
            <Button onClick={() => setShowCareerForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Position
            </Button>
          </div>

          <div className="space-y-4">
            {careerHistory.map((entry, index) => (
              <Card key={entry.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{entry.job_title}</CardTitle>
                      <CardDescription>{entry.location}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(entry.pay_rate, entry.pay_type)}
                      </div>
                      {!entry.end_date && (
                        <Badge variant="default" className="mt-1">Current</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Period:</span>
                      <div>
                        {formatDate(entry.start_date)} - {entry.end_date ? formatDate(entry.end_date) : 'Present'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Hours/Week:</span>
                      <div>{entry.hours_per_week}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Employment:</span>
                      <div className="capitalize">{entry.employment_type?.replace('_', ' ')}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Contract:</span>
                      <div className="capitalize">{entry.contract_type?.replace('_', ' ')}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {careerHistory.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No career history</h3>
                  <p className="text-gray-600">Add employment history for this employee</p>
                  <Button onClick={() => setShowCareerForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Position
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          {fullEmployee?.bank_details && Object.keys(fullEmployee.bank_details).some(key => fullEmployee.bank_details[key]) ? (
            <Card>
              <CardHeader>
                <CardTitle>Bank Details</CardTitle>
                <CardDescription>Secure banking information (masked for security)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {fullEmployee.bank_details.bank_name && (
                  <div>
                    <span className="text-sm text-gray-600">Bank Name:</span>
                    <div>{fullEmployee.bank_details.bank_name}</div>
                  </div>
                )}
                {fullEmployee.bank_details.account_holder_name && (
                  <div>
                    <span className="text-sm text-gray-600">Account Holder Name:</span>
                    <div>{fullEmployee.bank_details.account_holder_name}</div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {fullEmployee.bank_details.account_number && (
                    <div>
                      <span className="text-sm text-gray-600">Account Number:</span>
                      <div>****{fullEmployee.bank_details.account_number.slice(-4)}</div>
                    </div>
                  )}
                  {fullEmployee.bank_details.sort_code && (
                    <div>
                      <span className="text-sm text-gray-600">Sort Code:</span>
                      <div>**-**-{fullEmployee.bank_details.sort_code.slice(-2)}</div>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="text-sm">Bank details completed</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <PoundSterling className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bank details</h3>
                <p className="text-gray-600">Bank details have not been provided for this employee</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {showCareerForm && (
        <CareerHistoryForm
          employeeId={employeeId}
          onClose={() => setShowCareerForm(false)}
          onSuccess={() => {
            setShowCareerForm(false);
            refetchCareer();
            onUpdate();
          }}
        />
      )}

      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
          </DialogHeader>
          <AddressForm
            onClose={() => setShowAddressDialog(false)}
            onSave={handleAddAddress}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Simple address form component - now without Card wrapper since it's in a dialog
const AddressForm = ({ onClose, onSave }: { onClose: () => void; onSave: (data: any) => void }) => {
  const [addressData, setAddressData] = useState({
    line_1: '',
    line_2: '',
    city: '',
    postcode: '',
    country: 'United Kingdom',
    start_date: new Date().toISOString().split('T')[0]
  });

  const handleSave = () => {
    if (!addressData.line_1 || !addressData.city || !addressData.postcode || !addressData.start_date) {
      toast.error("Please fill in required fields (Address Line 1, City, Postcode, Start Date)");
      return;
    }
    onSave(addressData);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="line_1">Address Line 1 *</Label>
        <Input
          id="line_1"
          value={addressData.line_1}
          onChange={(e) => setAddressData({...addressData, line_1: e.target.value})}
        />
      </div>
      <div>
        <Label htmlFor="line_2">Address Line 2</Label>
        <Input
          id="line_2"
          value={addressData.line_2}
          onChange={(e) => setAddressData({...addressData, line_2: e.target.value})}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={addressData.city}
            onChange={(e) => setAddressData({...addressData, city: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="postcode">Postcode *</Label>
          <Input
            id="postcode"
            value={addressData.postcode}
            onChange={(e) => setAddressData({...addressData, postcode: e.target.value})}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={addressData.country}
            onChange={(e) => setAddressData({...addressData, country: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="start_date">Start Date *</Label>
          <Input
            id="start_date"
            type="date"
            value={addressData.start_date}
            onChange={(e) => setAddressData({...addressData, start_date: e.target.value})}
          />
        </div>
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Add Address
        </Button>
      </div>
    </div>
  );
};

export default EmployeeDetails;
