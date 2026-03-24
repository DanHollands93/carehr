import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Plus, Search, User, Briefcase, MapPin, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import EmployeeForm from "@/components/EmployeeForm";
import EmployeeDetails from "@/components/EmployeeDetails";
import { useUserCompanyId } from "@/hooks/useUserCompanyId";
import { useUserLocationAccess } from "@/hooks/useUserLocationAccess";

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

interface EmployeePosition {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  phone_number?: string;
  hire_date?: string;
  job_title: string;
  location: string;
  employment_type?: string;
}

interface LocationData {
  location: string;
  job_titles: string[];
  employment_type?: string;
}

interface GroupedEmployee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  phone_number?: string;
  hire_date?: string;
  locations: Record<string, LocationData>;
}

const Employees = () => {
  const { companyId } = useUserCompanyId();
  const { filterByLocation, shouldFilterByLocation, locationPermissions } = useUserLocationAccess();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  const [urlInitialTab, setUrlInitialTab] = useState<string | undefined>();
  const [urlReviewId, setUrlReviewId] = useState<string | undefined>();

  // Fetch employee locations for filtering
  const { data: employeeLocationMap = {} } = useQuery({
    queryKey: ['employee-locations-map', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_locations')
        .select('employee_id, location')
        .eq('company_id', companyId!);
      if (error) throw error;
      const map: Record<string, string[]> = {};
      (data || []).forEach(el => {
        if (!map[el.employee_id]) map[el.employee_id] = [];
        map[el.employee_id].push(el.location);
      });
      return map;
    },
    enabled: !!companyId && shouldFilterByLocation,
  });

  const { data: employeePositions = [], isLoading, refetch } = useQuery({
    queryKey: ['employee-positions', companyId],
    queryFn: async () => {
      let query = supabase
        .from('employees')
        .select('*')
        .order('first_name');
      
      if (companyId) {
        query = query.eq('company_id', companyId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      // Map employees to EmployeePosition format
      return (data || []).map((emp: any) => ({
        employee_id: emp.id,
        first_name: emp.first_name,
        last_name: emp.last_name,
        email: emp.email,
        department: emp.department || '',
        phone_number: emp.phone_number,
        hire_date: emp.hire_date,
        job_title: emp.job_title || '',
        location: emp.location || '',
        employment_type: emp.employment_type
      })) as EmployeePosition[];
    },
    enabled: !!companyId
  });

  // Filter employees by user's location access
  const filteredEmployeePositions = useMemo(() => {
    if (!shouldFilterByLocation) return employeePositions;
    return employeePositions.filter(emp => {
      // Check employee_locations table first
      const empLocations = employeeLocationMap[emp.employee_id];
      if (empLocations && empLocations.length > 0) {
        return empLocations.some(loc => locationPermissions.includes(loc));
      }
      // Fallback to employee.location field
      if (emp.location) {
        return locationPermissions.includes(emp.location);
      }
      return true; // No location = visible
    });
  }, [employeePositions, shouldFilterByLocation, locationPermissions, employeeLocationMap]);

  // Handle URL params to auto-open an employee and tab
  useEffect(() => {
    const urlId = searchParams.get('id');
    const urlTab = searchParams.get('tab');
    const urlReview = searchParams.get('reviewId');
    if (urlId && filteredEmployeePositions.length > 0 && !selectedEmployee) {
      const emp = filteredEmployeePositions.find(e => e.employee_id === urlId);
      if (emp) {
        setSelectedEmployee({
          id: emp.employee_id,
          first_name: emp.first_name,
          last_name: emp.last_name,
          email: emp.email,
          department: emp.department,
          phone_number: emp.phone_number,
          hire_date: emp.hire_date,
          job_title: emp.job_title,
          location: emp.location,
          employment_type: emp.employment_type,
          national_insurance_number: undefined,
          pay_rate: undefined,
          pay_type: undefined,
        });
        setActiveTab("details");
        if (urlTab) setUrlInitialTab(urlTab);
        if (urlReview) setUrlReviewId(urlReview);
        // Clean URL params
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, employeePositions, selectedEmployee]);


  const groupedEmployees = employeePositions.reduce((acc, position) => {
    const employeeKey = position.employee_id;
    
    if (!acc[employeeKey]) {
      acc[employeeKey] = {
        id: position.employee_id,
        first_name: position.first_name,
        last_name: position.last_name,
        email: position.email,
        department: position.department,
        phone_number: position.phone_number,
        hire_date: position.hire_date,
        locations: {} as Record<string, LocationData>
      };
    }
    
    const locationKey = position.location;
    if (!acc[employeeKey].locations[locationKey]) {
      acc[employeeKey].locations[locationKey] = {
        location: position.location,
        job_titles: [],
        employment_type: position.employment_type
      };
    }
    
    if (position.job_title && !acc[employeeKey].locations[locationKey].job_titles.includes(position.job_title)) {
      acc[employeeKey].locations[locationKey].job_titles.push(position.job_title);
    }
    
    return acc;
  }, {} as Record<string, GroupedEmployee>);

  const employees = Object.values(groupedEmployees);

  const filteredEmployees = employees.filter(employee =>
    `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEmployeeClick = (employee: GroupedEmployee) => {
    // Convert back to the expected format for EmployeeDetails
    const employeeForDetails: Employee = {
      id: employee.id,
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      department: employee.department,
      phone_number: employee.phone_number,
      hire_date: employee.hire_date,
      // Use the first location's first job title as the primary job title
      job_title: Object.values(employee.locations)[0]?.job_titles[0] || '',
      location: Object.keys(employee.locations)[0] || ''
    };
    setSelectedEmployee(employeeForDetails);
    setActiveTab("details");
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    refetch();
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
                  {/* Department */}
                  {employee.department && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700 border-b pb-1">
                        Department
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {employee.department}
                      </Badge>
                    </div>
                  )}

                  {/* Position Details by Location */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-700 border-b pb-1">
                      Current Positions
                    </div>
                    {Object.entries(employee.locations).map(([locationKey, locationData]) => (
                      <div key={locationKey} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-sm">{locationData.location}</span>
                        </div>
                        <div className="ml-6">
                          <div className="flex items-center space-x-2">
                            <Briefcase className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{locationData.job_titles.join(', ')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

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
              employeeId={selectedEmployee.id}
              initialTab={urlInitialTab}
              initialReviewId={urlReviewId}
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
