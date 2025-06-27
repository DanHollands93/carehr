
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { approvalService } from "@/services/approvalService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, Calendar, BarChart3 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";

const HolidayTrendsWidget = () => {
  const { data: trendsData, isLoading } = useQuery({
    queryKey: ['holiday-trends'],
    queryFn: async () => {
      const requests = await approvalService.getHolidayRequests();
      const approvedRequests = requests.filter(r => r.status === 'approved');
      
      // Get last 6 months
      const endDate = new Date();
      const startDate = subMonths(endDate, 5);
      const months = eachMonthOfInterval({ start: startDate, end: endDate });

      // Monthly holiday data
      const monthlyData = months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        
        const monthRequests = approvedRequests.filter(req => {
          const reqStart = new Date(req.startDate);
          return reqStart >= monthStart && reqStart <= monthEnd;
        });

        const totalDays = monthRequests.reduce((sum, req) => {
          const startDate = new Date(req.startDate);
          const endDate = new Date(req.endDate);
          const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          return sum + days;
        }, 0);

        return {
          month: format(month, 'MMM yyyy'),
          requests: monthRequests.length,
          totalDays,
          shortMonth: format(month, 'MMM')
        };
      });

      // Popular months for holidays
      const monthCounts = approvedRequests.reduce((acc, req) => {
        const month = format(new Date(req.startDate), 'MMMM');
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const popularMonths = Object.entries(monthCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([month, count]) => ({ month, count }));

      // Department breakdown
      const departmentRequests = approvedRequests.reduce((acc, req) => {
        // This is a simplified version - in a real app you'd get department from employee data
        const dept = 'General'; // Placeholder
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        monthlyData,
        popularMonths,
        totalRequests: approvedRequests.length,
        totalDays: approvedRequests.reduce((sum, req) => {
          const startDate = new Date(req.startDate);
          const endDate = new Date(req.endDate);
          const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          return sum + days;
        }, 0),
        avgDaysPerRequest: approvedRequests.length > 0 ? 
          Math.round((approvedRequests.reduce((sum, req) => {
            const startDate = new Date(req.startDate);
            const endDate = new Date(req.endDate);
            const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            return sum + days;
          }, 0) / approvedRequests.length) * 10) / 10 : 0
      };
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Holiday Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading trends data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{trendsData?.totalRequests}</p>
                <p className="text-sm text-muted-foreground">Total Requests</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{trendsData?.totalDays}</p>
                <p className="text-sm text-muted-foreground">Total Days</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{trendsData?.avgDaysPerRequest}</p>
                <p className="text-sm text-muted-foreground">Avg Days/Request</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Requests (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendsData?.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="shortMonth" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="requests" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Holiday Days Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendsData?.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="shortMonth" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="totalDays" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Most Popular Holiday Months</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trendsData?.popularMonths.map((item, index) => (
              <div key={item.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                  <span className="font-medium">{item.month}</span>
                </div>
                <span className="text-sm text-gray-600">{item.count} requests</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HolidayTrendsWidget;
