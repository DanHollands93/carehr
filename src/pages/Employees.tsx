import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Plus, Search, User, Briefcase, MapPin, PoundSterling, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import EmployeeForm from "@/components/EmployeeForm";
import EmployeeDetails from "@/components/EmployeeDetails";

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

const Employees = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState("list");

  const { data: employees = [], isLoading, refetch } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('current_employee_positions')
        .select('*')
        .order('first_name');
      
      if (error) throw error;
      return data as Employee[];
    }
  });

  const filteredEmployees = employees.filter(employee =>
    `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setActiveTab("details");
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    refetch();
  };

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

  if (isLoading) {
    return <div className="p-6">Loading employees...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600 mt-2">Manage employee records and career history</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Employee
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="list">Employee List</TabsTrigger>
          {selectedEmployee && (
            <TabsTrigger value="details">
              {selectedEmployee.first_name} {selectedEmployee.last_name}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
              <CardDescription>Find employees by name, email, or department</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                  <Label htmlFor="search">Search Employees</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="search"
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Label>Total Employees:</Label>
                  <Badge variant="outline" className="text-sm">
                    {filteredEmployees.length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map((employee) => (
              <Card 
                key={employee.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleEmployeeClick(employee)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-lg font-semibold">
                        {employee.first_name} {employee.last_name}
                      </div>
                      <CardDescription className="break-words text-sm">
                        {employee.email}
                      </CardDescription>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Position Details Section */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-700 border-b pb-1">
                      Position Details
                    </div>
                    {employee.job_title && (
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <Label className="text-gray-600">Job Title:</Label>
                        <div className="col-span-2 flex items-center">
                          <Briefcase className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="break-words">{employee.job_title}</span>
                        </div>
                      </div>
                    )}
                    {employee.department && (
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <Label className="text-gray-600">Department:</Label>
                        <div className="col-span-2">
                          <Badge variant="secondary" className="text-xs">
                            {employee.department}
                          </Badge>
                        </div>
                      </div>
                    )}
                    {employee.location && (
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <Label className="text-gray-600">Location:</Label>
                        <div className="col-span-2 flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="break-words">{employee.location}</span>
                        </div>
                      </div>
                    )}
                    {employee.employment_type && (
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <Label className="text-gray-600">Type:</Label>
                        <div className="col-span-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {employee.employment_type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Financial Details Section */}
                  {employee.pay_rate && (
                    <div className="space-y-3 pt-3 border-t">
                      <div className="text-sm font-medium text-gray-700 border-b pb-1">
                        Financial Details
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <Label className="text-gray-600">Pay Rate:</Label>
                        <div className="col-span-2 flex items-center">
                          <PoundSterling className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="font-semibold">
                            {formatCurrency(employee.pay_rate, employee.pay_type || 'salary')}
                          </span>
                        </div>
                      </div>
                      {employee.pay_type && (
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <Label className="text-gray-600">Pay Type:</Label>
                          <div className="col-span-2">
                            <Badge variant="outline" className="text-xs capitalize">
                              {employee.pay_type}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Employment Status */}
                  {employee.hire_date && (
                    <div className="pt-3 border-t">
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>Joined {formatDate(employee.hire_date)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredEmployees.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <CardTitle className="text-lg font-medium text-gray-900 mb-2">
                  No employees found
                </CardTitle>
                <CardDescription className="mb-4">
                  {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first employee"}
                </CardDescription>
                {!searchTerm && (
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Employee
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {selectedEmployee && (
          <TabsContent value="details">
            <EmployeeDetails 
              employee={selectedEmployee} 
              onUpdate={refetch}
              onBack={() => {
                setSelectedEmployee(null);
                setActiveTab("list");
              }}
            />
          </TabsContent>
        )}
      </Tabs>

      {showCreateForm && (
        <EmployeeForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
};

export default Employees;
