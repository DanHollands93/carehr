
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserCheck, UserX, Clock } from "lucide-react";

const StaffOverviewWidget = () => {
  const { data: staffData, isLoading } = useQuery({
    queryKey: ['staff-overview'],
    queryFn: async () => {
      const { data: employees, error } = await supabase
        .from('employees')
        .select(`
          id,
          first_name,
          last_name,
          email,
          department,
          hire_date,
          job_roles(title, department)
        `);

      if (error) throw error;

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, active');

      if (profilesError) throw profilesError;

      const activeEmployees = employees?.filter(emp => 
        profiles?.find(p => p.active)
      ) || [];

      const departmentCounts = employees?.reduce((acc, emp) => {
        const dept = emp.department || 'Unassigned';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalEmployees: employees?.length || 0,
        activeEmployees: activeEmployees.length,
        inactiveEmployees: (employees?.length || 0) - activeEmployees.length,
        departmentCounts,
        recentHires: employees?.filter(emp => {
          if (!emp.hire_date) return false;
          const hireDate = new Date(emp.hire_date);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return hireDate >= thirtyDaysAgo;
        }) || []
      };
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading staff data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Staff Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <UserCheck className="h-6 w-6 text-blue-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-blue-900">{staffData?.activeEmployees}</p>
            <p className="text-sm text-blue-700">Active</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <UserX className="h-6 w-6 text-gray-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{staffData?.inactiveEmployees}</p>
            <p className="text-sm text-gray-700">Inactive</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Departments</h4>
          <div className="space-y-2">
            {Object.entries(staffData?.departmentCounts || {}).map(([dept, count]) => (
              <div key={dept} className="flex items-center justify-between">
                <span className="text-sm">{dept}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        </div>

        {staffData?.recentHires && staffData.recentHires.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Hires (Last 30 days)
            </h4>
            <div className="space-y-2">
              {staffData.recentHires.slice(0, 3).map((employee) => (
                <div key={employee.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm font-medium">
                    {employee.first_name} {employee.last_name}
                  </span>
                  <span className="text-xs text-green-700">
                    {new Date(employee.hire_date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StaffOverviewWidget;
