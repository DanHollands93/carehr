
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Plus, MapPin, Phone, Mail, Calendar, Briefcase, PoundSterling } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

interface EmployeeDetailsProps {
  employee: Employee;
  onUpdate: () => void;
  onBack: () => void;
}

const EmployeeDetails = ({ employee, onUpdate, onBack }: EmployeeDetailsProps) => {
  const [showCareerForm, setShowCareerForm] = useState(false);

  const { data: fullEmployee } = useQuery({
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
        <Button variant="outline" size="sm">
          <Edit className="w-4 h-4 mr-2" />
          Edit Employee
        </Button>
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
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Basic personal details and identification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="address" className="space-y-4">
          {fullEmployee?.address && (
            <Card>
              <CardHeader>
                <CardTitle>Address Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fullEmployee.address.line_1 && (
                  <div>
                    <span className="text-sm text-gray-600">Address Line 1:</span>
                    <div>{fullEmployee.address.line_1}</div>
                  </div>
                )}
                {fullEmployee.address.line_2 && (
                  <div>
                    <span className="text-sm text-gray-600">Address Line 2:</span>
                    <div>{fullEmployee.address.line_2}</div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {fullEmployee.address.city && (
                    <div>
                      <span className="text-sm text-gray-600">City:</span>
                      <div>{fullEmployee.address.city}</div>
                    </div>
                  )}
                  {fullEmployee.address.postcode && (
                    <div>
                      <span className="text-sm text-gray-600">Postcode:</span>
                      <div>{fullEmployee.address.postcode}</div>
                    </div>
                  )}
                </div>
                {fullEmployee.address.country && (
                  <div>
                    <span className="text-sm text-gray-600">Country:</span>
                    <div>{fullEmployee.address.country}</div>
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
          {fullEmployee?.bank_details && (
            <Card>
              <CardHeader>
                <CardTitle>Bank Details</CardTitle>
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
                      <div>{fullEmployee.bank_details.account_number}</div>
                    </div>
                  )}
                  {fullEmployee.bank_details.sort_code && (
                    <div>
                      <span className="text-sm text-gray-600">Sort Code:</span>
                      <div>{fullEmployee.bank_details.sort_code}</div>
                    </div>
                  )}
                </div>
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

export default EmployeeDetails;
