
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { approvalService } from "@/services/approvalService";
import { Calendar, Clock } from "lucide-react";
import { format, isAfter, isBefore, addDays } from "date-fns";

const UpcomingHolidaysWidget = () => {
  const { data: upcomingHolidays = [], isLoading } = useQuery({
    queryKey: ['upcoming-holidays'],
    queryFn: async () => {
      const requests = await approvalService.getHolidayRequests();
      const today = new Date();
      const nextMonth = addDays(today, 30);
      
      return requests
        .filter(req => req.status === 'approved')
        .filter(req => {
          const startDate = new Date(req.startDate);
          return isAfter(startDate, today) && isBefore(startDate, nextMonth);
        })
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, 5);
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Holidays
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading upcoming holidays...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Holidays (Next 30 days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingHolidays.length > 0 ? (
          <div className="space-y-3">
            {upcomingHolidays.map((holiday) => (
              <div key={holiday.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{holiday.employeeName}</p>
                  <p className="text-sm text-gray-600">{holiday.reason}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(holiday.startDate), 'MMM d')} - {format(new Date(holiday.endDate), 'MMM d')}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {Math.ceil((new Date(holiday.endDate).getTime() - new Date(holiday.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} day(s)
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No upcoming holidays in the next 30 days</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingHolidaysWidget;
