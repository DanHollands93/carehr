
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { approvalService } from "@/services/approvalService";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, TrendingDown, TrendingUp } from "lucide-react";

const HolidayBalanceWidget = () => {
  const { data: balanceData, isLoading } = useQuery({
    queryKey: ['holiday-balances'],
    queryFn: async () => {
      // Get all employees
      const { data: employees, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, department');

      if (error) throw error;

      // Get all holiday requests
      const requests = await approvalService.getHolidayRequests();
      const approvedRequests = requests.filter(r => r.status === 'approved');

      // Calculate holiday usage for each employee
      const employeeBalances = employees?.map(emp => {
        const empRequests = approvedRequests.filter(r => 
          r.employeeName === `${emp.first_name} ${emp.last_name}`
        );
        
        const usedDays = empRequests.reduce((total, req) => {
          const startDate = new Date(req.startDate);
          const endDate = new Date(req.endDate);
          const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          return total + days;
        }, 0);

        const totalAllowance = 25; // Assuming 25 days per year
        const remaining = Math.max(0, totalAllowance - usedDays);
        const usagePercentage = Math.round((usedDays / totalAllowance) * 100);

        return {
          id: emp.id,
          name: `${emp.first_name} ${emp.last_name}`,
          department: emp.department,
          used: usedDays,
          remaining,
          total: totalAllowance,
          usagePercentage
        };
      }) || [];

      // Calculate averages
      const avgUsed = employeeBalances.reduce((sum, emp) => sum + emp.used, 0) / employeeBalances.length;
      const avgRemaining = employeeBalances.reduce((sum, emp) => sum + emp.remaining, 0) / employeeBalances.length;
      
      // Find employees with low/high usage
      const lowUsage = employeeBalances.filter(emp => emp.usagePercentage < 20).length;
      const highUsage = employeeBalances.filter(emp => emp.usagePercentage > 80).length;

      return {
        employees: employeeBalances.slice(0, 5), // Show top 5
        avgUsed: Math.round(avgUsed),
        avgRemaining: Math.round(avgRemaining),
        lowUsage,
        highUsage,
        totalEmployees: employeeBalances.length
      };
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Holiday Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading holiday balances...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Holiday Balances
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <TrendingUp className="h-6 w-6 text-blue-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-blue-900">{balanceData?.avgUsed}</p>
            <p className="text-sm text-blue-700">Avg. Used</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <TrendingDown className="h-6 w-6 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-900">{balanceData?.avgRemaining}</p>
            <p className="text-sm text-green-700">Avg. Remaining</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Usage Distribution</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center p-2 bg-yellow-50 rounded">
              <p className="font-bold text-yellow-900">{balanceData?.lowUsage}</p>
              <p className="text-yellow-700">Low Usage (&lt;20%)</p>
            </div>
            <div className="text-center p-2 bg-red-50 rounded">
              <p className="font-bold text-red-900">{balanceData?.highUsage}</p>
              <p className="text-red-700">High Usage (&gt;80%)</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Individual Balances</h4>
          <div className="space-y-3">
            {balanceData?.employees.map((employee) => (
              <div key={employee.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{employee.name}</span>
                  <span className="text-xs text-gray-500">
                    {employee.used}/{employee.total} days
                  </span>
                </div>
                <Progress 
                  value={employee.usagePercentage} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HolidayBalanceWidget;
