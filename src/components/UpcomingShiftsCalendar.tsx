
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { format, parseISO, startOfWeek, addDays, addWeeks, isSameDay } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ShiftWithRecord {
  id: string;
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  position: string;
  time_record: {
    id: string;
    status: 'scheduled' | 'clocked_in' | 'completed' | 'discrepancy';
    clock_in_time: string | null;
    clock_out_time: string | null;
  } | null;
}

interface UpcomingShiftsCalendarProps {
  shifts: ShiftWithRecord[];
}

const UpcomingShiftsCalendar = ({ shifts }: UpcomingShiftsCalendarProps) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getShiftsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return shifts.filter(shift => shift.date === dateStr);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary" className="text-xs">Scheduled</Badge>;
      case 'clocked_in':
        return <Badge className="bg-amber-500 text-xs">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-500 text-xs">Completed</Badge>;
      case 'discrepancy':
        return <Badge variant="destructive" className="text-xs">Issue</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    }
  };

  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const prevWeek = () => setCurrentWeek(addWeeks(currentWeek, -1));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Upcoming Shifts</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={prevWeek}>
              Previous
            </Button>
            <span className="text-sm font-medium">
              Week of {format(weekStart, 'MMM dd, yyyy')}
            </span>
            <Button variant="outline" size="sm" onClick={nextWeek}>
              Next
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dayShifts = getShiftsForDate(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div
                key={day.toISOString()}
                className={`p-3 border rounded-lg min-h-24 ${
                  isToday ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                }`}
              >
                <div className="text-center mb-2">
                  <div className="text-xs font-medium text-gray-600">
                    {format(day, 'EEE')}
                  </div>
                  <div className={`text-sm font-semibold ${
                    isToday ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {format(day, 'dd')}
                  </div>
                </div>
                
                <div className="space-y-1">
                  {dayShifts.map((shift) => (
                    <div
                      key={shift.id}
                      className="p-1 bg-white rounded border text-xs"
                    >
                      <div className="font-medium truncate">{shift.position}</div>
                      <div className="flex items-center space-x-1 text-gray-600">
                        <Clock className="w-3 h-3" />
                        <span>
                          {shift.start_time} - {shift.end_time}
                        </span>
                      </div>
                      {shift.time_record && (
                        <div className="mt-1">
                          {getStatusBadge(shift.time_record.status)}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {dayShifts.length === 0 && (
                    <div className="text-xs text-gray-400 text-center pt-2">
                      No shifts
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingShiftsCalendar;
