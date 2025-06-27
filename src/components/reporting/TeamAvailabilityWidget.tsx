
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { approvalService } from "@/services/approvalService";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserCheck, AlertCircle } from "lucide-react";
import { format, isToday, parseISO } from "date-fns";

const TeamAvailabilityWidget = () => {
  const { data: availabilityData, isLoading } = useQuery({
    queryKey: ['team-availability'],
    queryFn: async () => {
      // Get all employees
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, first_name, last_name, department');

      if (empError) throw empError;

      // Get approved holidays
      const holidays = await approvalService.getHolidayRequests();
      const approvedHolidays = holidays.filter(h => h.status === 'approved');

      const today = new Date().toISOString().split('T')[0];
      
      // Find who's off today
      const offToday = approvedHolidays.filter(holiday => {
        const startDate = holiday.startDate;
        const endDate = holiday.endDate;
        return today >= startDate && today <= endDate;
      });

      // Calculate availability by department
      const departmentAvailability = employees?.reduce((acc, emp) => {
        const dept = emp.department || 'Unassigned';
        if (!acc[dept]) {
          acc[dept] = { total: 0, available: 0, offToday: [] };
        }
        acc[dept].total++;
        
        const isOffToday = offToday.some(h => h.employeeName === `${emp.first_name} ${emp.last_name}`);
        if (!isOffToday) {
          acc[dept].available++;
        } else {
          acc[dept].offToday.push(`${emp.first_name} ${emp.last_name}`);
        }
        
        return acc;
      }, {} as Record<string, { total: number; available: number; offToday: string[] }>) || {};

      return {
        totalEmployees: employees?.length || 0,
        availableToday: Object.values(departmentAvailability).reduce((sum, dept) => sum + dept.available, 0),
        offToday: offToday.length,
        departmentAvailability
      };
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Availability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading availability data...</p>
        </CardContent>
      </Card>
    );
  }

  const availabilityPercentage = availabilityData?.totalEmployees 
    ? Math.round((availabilityData.availableToday / availabilityData.totalEmployees) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Availability - {format(new Date(), 'EEEE, MMM d')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <UserCheck className="h-6 w-6 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-900">{availabilityData?.availableToday}</p>
            <p className="text-sm text-green-700">Available</p>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <AlertCircle className="h-6 w-6 text-orange-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-orange-900">{availabilityData?.offToday}</p>
            <p className="text-sm text-orange-700">Off Today</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Availability</span>
            <Badge variant={availabilityPercentage >= 80 ? "default" : availabilityPercentage >= 60 ? "secondary" : "destructive"}>
              {availabilityPercentage}%
            </Badge>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                availabilityPercentage >= 80 ? 'bg-green-500' : 
                availabilityPercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${availabilityPercentage}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Department Availability</h4>
          <div className="space-y-2">
            {Object.entries(availabilityData?.departmentAvailability || {}).map(([dept, data]) => (
              <div key={dept} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">{dept}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {data.available}/{data.total}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round((data.available / data.total) * 100)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamAvailabilityWidget;
