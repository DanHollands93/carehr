
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { useTimeClockRecords } from "@/hooks/useTimeClockRecords";
import { useTimeClockSettings } from "@/hooks/useTimeClockSettings";
import StaffShiftCard from "@/components/StaffShiftCard";
import UpcomingShiftsCalendar from "@/components/UpcomingShiftsCalendar";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

const StaffShifts = () => {
  const { user } = useAuth();
  const { 
    todayRecords, 
    upcomingShifts,
    isLoading, 
    clockIn, 
    clockOut, 
    isClockingIn, 
    isClockingOut,
    validateClockTime 
  } = useTimeClockRecords();
  
  const today = new Date();
  const formattedDate = format(today, 'EEEE, MMMM dd, yyyy');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading your shifts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-3 md:p-4 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">My Shifts</h1>
          <div className="flex items-center justify-center space-x-2 text-xs md:text-sm lg:text-base text-gray-600">
            <Calendar className="w-3 h-3 md:w-4 md:h-4" />
            <span className="truncate text-center">{formattedDate}</span>
          </div>
        </div>

        {/* Current Time Display */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="flex items-center justify-center space-x-2 text-sm md:text-base lg:text-lg">
              <Clock className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" />
              <span>Current Time</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg md:text-xl lg:text-2xl font-mono font-bold text-center text-blue-600">
              {format(today, 'HH:mm:ss')}
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Today's Shifts */}
        <div className="space-y-3 md:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-base md:text-lg lg:text-xl font-semibold flex items-center space-x-2">
              <User className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" />
              <span>Today's Shifts</span>
            </h2>
            <Badge variant="outline" className="self-start sm:self-center text-xs">
              {todayRecords?.length || 0} shifts
            </Badge>
          </div>

          {todayRecords && todayRecords.length > 0 ? (
            <div className="space-y-2 md:space-y-3">
              {todayRecords.map((record) => (
                <StaffShiftCard
                  key={record.id}
                  record={record}
                  onClockIn={clockIn}
                  onClockOut={clockOut}
                  isClockingIn={isClockingIn}
                  isClockingOut={isClockingOut}
                  validateClockTime={validateClockTime}
                />
              ))}
            </div>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="text-center py-6 md:py-8">
                <div className="space-y-2 md:space-y-3">
                  <Clock className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 mx-auto text-gray-400" />
                  <h3 className="text-sm md:text-base lg:text-lg font-medium text-gray-900">No shifts today</h3>
                  <p className="text-xs md:text-sm lg:text-base text-gray-500 px-2 md:px-4">
                    You don't have any shifts scheduled for today. Enjoy your day off!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator />

        {/* Upcoming Shifts Calendar */}
        <div className="space-y-3 md:space-y-4">
          <h2 className="text-base md:text-lg lg:text-xl font-semibold">Next 6 Weeks</h2>
          {upcomingShifts && upcomingShifts.length > 0 ? (
            <div className="w-full">
              <UpcomingShiftsCalendar shifts={upcomingShifts} />
            </div>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="text-center py-6 md:py-8">
                <div className="space-y-2 md:space-y-3">
                  <Calendar className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 mx-auto text-gray-400" />
                  <h3 className="text-sm md:text-base lg:text-lg font-medium text-gray-900">No upcoming shifts</h3>
                  <p className="text-xs md:text-sm lg:text-base text-gray-500 px-2 md:px-4">
                    You don't have any shifts scheduled for the next 6 weeks.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200 shadow-sm">
          <CardContent className="pt-4 md:pt-6">
            <div className="space-y-2 md:space-y-3">
              <h3 className="font-medium text-blue-900 text-xs md:text-sm lg:text-base">How to use:</h3>
              <ul className="text-xs md:text-sm text-blue-800 space-y-1 pl-2">
                <li>• Clock in at the start of your shift</li>
                <li>• Clock out when your shift ends</li>
                <li>• You'll get warnings if clocking in/out outside the allowed time window</li>
                <li>• Use the calendar above to see your upcoming shifts</li>
                <li>• Contact your manager if you have any issues</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StaffShifts;
