
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Plus, MapPin, Phone, Mail, Calendar, Briefcase, Pound } from "lucide-react";
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

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="career">Career History</TabsTrigger>
          <TabsTrigger value="personal">Personal Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>{employee.email}</span>
                </div>
                {employee.phone_number && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{employee.phone_number}</span>
                  </div>
                )}
                {employee.location && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>{employee.location}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Employment Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Department</span>
                  {employee.department && (
                    <Badge variant="secondary">{employee.department}</Badge>
                  )}
                </div>
                {employee.employment_type && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Employment Type</span>
                    <Badge variant="outline">{employee.employment_type}</Badge>
                  </div>
                )}
                {employee.hire_date && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Joined {formatDate(employee.hire_date)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {employee.pay_rate && (
            <Card>
              <CardHeader>
                <CardTitle>Current Compensation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Pound className="w-4 h-4 text-gray-500" />
                  <span className="text-lg font-semibold">
                    {formatCurrency(employee.pay_rate, employee.pay_type || 'salary')}
                  </span>
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

        <TabsContent value="personal" className="space-y-6">
          {fullEmployee && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Government Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fullEmployee.national_insurance_number && (
                    <div>
                      <span className="text-sm text-gray-600">National Insurance:</span>
                      <div>{fullEmployee.national_insurance_number}</div>
                    </div>
                  )}
                  {fullEmployee.tax_code && (
                    <div>
                      <span className="text-sm text-gray-600">Tax Code:</span>
                      <div>{fullEmployee.tax_code}</div>
                    </div>
                  )}
                  {fullEmployee.passport_number && (
                    <div>
                      <span className="text-sm text-gray-600">Passport:</span>
                      <div>{fullEmployee.passport_number}</div>
                    </div>
                  )}
                  {fullEmployee.right_to_work_status && (
                    <div>
                      <span className="text-sm text-gray-600">Right to Work:</span>
                      <Badge variant="outline" className="ml-2">
                        {fullEmployee.right_to_work_status}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {fullEmployee.address && (
                <Card>
                  <CardHeader>
                    <CardTitle>Address</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {fullEmployee.address.line_1 && <div>{fullEmployee.address.line_1}</div>}
                      {fullEmployee.address.line_2 && <div>{fullEmployee.address.line_2}</div>}
                      {fullEmployee.address.city && <div>{fullEmployee.address.city}</div>}
                      {fullEmployee.address.postcode && <div>{fullEmployee.address.postcode}</div>}
                      {fullEmployee.address.country && <div>{fullEmployee.address.country}</div>}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
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
