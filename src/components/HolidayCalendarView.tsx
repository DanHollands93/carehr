
import { Calendar } from "@/components/ui/calendar";
import { HolidayRequest } from "@/services/approvalService";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface HolidayCalendarViewProps {
  holidays: HolidayRequest[];
}

const HolidayCalendarView = ({ holidays }: HolidayCalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Get holidays for the selected date
  const getHolidaysForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return holidays.filter(holiday => {
      const startDate = new Date(holiday.startDate);
      const endDate = new Date(holiday.endDate);
      const checkDate = new Date(dateStr);
      
      return checkDate >= startDate && checkDate <= endDate;
    });
  };

  // Get all holiday dates for highlighting
  const getHolidayDates = () => {
    const dates: Date[] = [];
    holidays.forEach(holiday => {
      const startDate = new Date(holiday.startDate);
      const endDate = new Date(holiday.endDate);
      
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
    return dates;
  };

  const holidayDates = getHolidayDates();
  const selectedDateHolidays = selectedDate ? getHolidaysForDate(selectedDate) : [];

  return (
    <div className="space-y-4">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={setSelectedDate}
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
        <div className="space-y-2">
          <h4 className="font-semibold">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h4>
          
          {selectedDateHolidays.length > 0 ? (
            <div className="space-y-2">
              {selectedDateHolidays.map((holiday) => (
                <div key={holiday.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <span className="text-sm font-medium">{holiday.employeeName}</span>
                  <Badge variant="outline" className="text-xs">
                    {holiday.startDate === holiday.endDate ? 'Single Day' : 
                     `${holiday.startDate} - ${holiday.endDate}`}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No one is off on this date</p>
          )}
        </div>
      )}
    </div>
  );
};

export default HolidayCalendarView;
