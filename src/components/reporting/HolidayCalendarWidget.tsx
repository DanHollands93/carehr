
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { approvalService } from "@/services/approvalService";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

interface HolidayCalendarWidgetProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
}

const HolidayCalendarWidget = ({ selectedMonth, onMonthChange }: HolidayCalendarWidgetProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ['holiday-calendar', format(selectedMonth, 'yyyy-MM')],
    queryFn: async () => {
      const requests = await approvalService.getHolidayRequests();
      return requests.filter(req => req.status === 'approved');
    }
  });

  const getHolidaysForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return holidays.filter(holiday => {
      const startDate = new Date(holiday.startDate);
      const endDate = new Date(holiday.endDate);
      const checkDate = new Date(dateStr);
      
      return checkDate >= startDate && checkDate <= endDate;
    });
  };

  const getHolidayDates = () => {
    const dates: Date[] = [];
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    
    holidays.forEach(holiday => {
      const startDate = new Date(holiday.startDate);
      const endDate = new Date(holiday.endDate);
      
      // Only include dates within the selected month
      const rangeStart = startDate > monthStart ? startDate : monthStart;
      const rangeEnd = endDate < monthEnd ? endDate : monthEnd;
      
      if (rangeStart <= rangeEnd) {
        const daysInRange = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
        dates.push(...daysInRange);
      }
    });
    return dates;
  };

  const holidayDates = getHolidayDates();
  const selectedDateHolidays = selectedDate ? getHolidaysForDate(selectedDate) : [];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(selectedMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    onMonthChange(newMonth);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Holiday Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading calendar...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Holiday Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[120px] text-center">
              {format(selectedMonth, 'MMMM yyyy')}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          month={selectedMonth}
          onMonthChange={onMonthChange}
          modifiers={{
            holiday: holidayDates
          }}
          modifiersStyles={{
            holiday: {
              backgroundColor: '#fef3c7',
              color: '#92400e',
              fontWeight: 'bold'
            }
          }}
          className="rounded-md border"
        />
        
        {selectedDate && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h4>
            
            {selectedDateHolidays.length > 0 ? (
              <div className="space-y-2">
                {selectedDateHolidays.map((holiday) => (
                  <div key={holiday.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <span className="font-medium">{holiday.employeeName}</span>
                      <p className="text-sm text-gray-600">{holiday.reason}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {holiday.startDate === holiday.endDate ? 'Single Day' : 
                       `${format(new Date(holiday.startDate), 'MMM d')} - ${format(new Date(holiday.endDate), 'MMM d')}`}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No one is off on this date
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HolidayCalendarWidget;
