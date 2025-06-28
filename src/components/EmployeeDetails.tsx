import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Edit, Plus, MapPin, Phone, Mail, Calendar, Briefcase, PoundSterling, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CareerHistoryForm from "@/components/CareerHistoryForm";

interface Employee {
  id: string;
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
  const [showAddressForm, setShowAddressForm] = useState(false);
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

  const { data: fullEmployee, refetch: refetchEmployee } = useQuery({
    queryKey: ['employee', employee.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employee.id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: careerHistory = [], refetch: refetchCareer } = useQuery({
    queryKey: ['career-history', employee.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('career_history')
        .select('*')
        .eq('employee_id', employee.id)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      return data as CareerHistoryEntry[];
    }
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
    try {
      const { error } = await supabase
        .from('employees')
        .update(personalFormData)
        .eq('id', employee.id);

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
    // Mark current address as not current
    const updatedHistory = addressHistory.map(addr => ({
      ...addr,
      is_current: false,
      end_date: new Date().toISOString().split('T')[0]
    }));

    // Add new address
    const newAddress: AddressHistoryEntry = {
      id: Date.now().toString(),
      ...addressData,
      is_current: true,
      start_date: new Date().toISOString().split('T')[0]
    };

    setAddressHistory([newAddress, ...updatedHistory]);
    setShowAddressForm(false);
    toast.success("New address added successfully!");
  };

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
              {employee.first_name} {employee.last_name}
            </h2>
            <p className="text-gray-600">{employee.job_title}</p>
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
          {fullEmployee && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Basic personal details and identification</CardDescription>
                  </div>
                  {!editingPersonal && (
                    <Button variant="outline" size="sm" onClick={() => {
                      setEditingPersonal(true);
                      setPersonalFormData({
                        first_name: fullEmployee.first_name || '',
                        last_name: fullEmployee.last_name || '',
                        email: fullEmployee.email || '',
                        phone_number: fullEmployee.phone_number || '',
                        date_of_birth: fullEmployee.date_of_birth || '',
                        national_insurance_number: fullEmployee.national_insurance_number || '',
                        tax_code: fullEmployee.tax_code || '',
                        passport_number: fullEmployee.passport_number || '',
                        visa_expiry: fullEmployee.visa_expiry || '',
                        right_to_work_status: fullEmployee.right_to_work_status || 'verified'
                      });
                    }}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Details
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingPersonal ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          value={personalFormData.first_name}
                          onChange={(e) => setPersonalFormData({...personalFormData, first_name: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          value={personalFormData.last_name}
                          onChange={(e) => setPersonalFormData({...personalFormData, last_name: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={personalFormData.email}
                        onChange={(e) => setPersonalFormData({...personalFormData, email: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone_number">Phone Number</Label>
                        <Input
                          id="phone_number"
                          value={personalFormData.phone_number}
                          onChange={(e) => setPersonalFormData({...personalFormData, phone_number: e.target.value})}
                        />
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

                    <div className="grid grid-cols-2 gap-4">
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

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="passport_number">Passport Number</Label>
                        <Input
                          id="passport_number"
                          value={personalFormData.passport_number}
                          onChange={(e) => setPersonalFormData({...personalFormData, passport_number: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="visa_expiry">Visa Expiry</Label>
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
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setEditingPersonal(false)}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button onClick={handlePersonalSave}>
                        <Check className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">First Name:</span>
                        <div>{fullEmployee.first_name}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Last Name:</span>
                        <div>{fullEmployee.last_name}</div>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm text-gray-600">Email Address:</span>
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span>{fullEmployee.email}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {fullEmployee.phone_number && (
                        <div>
                          <span className="text-sm text-gray-600">Phone Number:</span>
                          <div className="flex items-center space-x-3">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span>{fullEmployee.phone_number}</span>
                          </div>
                        </div>
                      )}
                      {fullEmployee.date_of_birth && (
                        <div>
                          <span className="text-sm text-gray-600">Date of Birth:</span>
                          <div>{formatDate(fullEmployee.date_of_birth)}</div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {fullEmployee.national_insurance_number && (
                        <div>
                          <span className="text-sm text-gray-600">National Insurance Number:</span>
                          <div>{fullEmployee.national_insurance_number}</div>
                        </div>
                      )}
                      {fullEmployee.tax_code && (
                        <div>
                          <span className="text-sm text-gray-600">Tax Code:</span>
                          <div>{fullEmployee.tax_code}</div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {fullEmployee.passport_number && (
                        <div>
                          <span className="text-sm text-gray-600">Passport Number:</span>
                          <div>{fullEmployee.passport_number}</div>
                        </div>
                      )}
                      {fullEmployee.visa_expiry && (
                        <div>
                          <span className="text-sm text-gray-600">Visa Expiry:</span>
                          <div>{formatDate(fullEmployee.visa_expiry)}</div>
                        </div>
                      )}
                      {fullEmployee.right_to_work_status && (
                        <div>
                          <span className="text-sm text-gray-600">Right to Work Status:</span>
                          <Badge variant="outline" className="mt-1">
                            {fullEmployee.right_to_work_status}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {fullEmployee?.emergency_contact && (
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fullEmployee.emergency_contact.name && (
                  <div>
                    <span className="text-sm text-gray-600">Contact Name:</span>
                    <div>{fullEmployee.emergency_contact.name}</div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {fullEmployee.emergency_contact.phone && (
                    <div>
                      <span className="text-sm text-gray-600">Contact Phone:</span>
                      <div className="flex items-center space-x-3">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span>{fullEmployee.emergency_contact.phone}</span>
                      </div>
                    </div>
                  )}
                  {fullEmployee.emergency_contact.relationship && (
                    <div>
                      <span className="text-sm text-gray-600">Relationship:</span>
                      <div>{fullEmployee.emergency_contact.relationship}</div>
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
            <Button onClick={() => setShowAddressForm(true)}>
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
                  <Button onClick={() => setShowAddressForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Address
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {showAddressForm && (
            <AddressForm
              onClose={() => setShowAddressForm(false)}
              onSave={handleAddAddress}
            />
          )}
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
                  <p className="text-gray-600 mb-4">Add employment history for this employee</p>
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
          employeeId={employee.id}
          onClose={() => setShowCareerForm(false)}
          onSuccess={() => {
            setShowCareerForm(false);
            refetchCareer();
            onUpdate();
          }}
        />
      )}
    </div>
  );
};

// Simple address form component
const AddressForm = ({ onClose, onSave }: { onClose: () => void; onSave: (data: any) => void }) => {
  const [addressData, setAddressData] = useState({
    line_1: '',
    line_2: '',
    city: '',
    postcode: '',
    country: 'United Kingdom'
  });

  const handleSave = () => {
    if (!addressData.line_1 || !addressData.city || !addressData.postcode) {
      toast.error("Please fill in required fields (Address Line 1, City, Postcode)");
      return;
    }
    onSave(addressData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Address</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
        <div>
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={addressData.country}
            onChange={(e) => setAddressData({...addressData, country: e.target.value})}
          />
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Add Address
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeDetails;
