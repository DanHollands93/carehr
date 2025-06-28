
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
      <div className="space-y-6 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">My Shifts</h1>
          <p className="text-gray-600">Loading your shifts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">My Shifts</h1>
        <div className="flex items-center justify-center space-x-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* Current Time Display */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Clock className="w-5 h-5" />
            <span>Current Time</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-mono font-bold text-center">
            {format(today, 'HH:mm:ss')}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Today's Shifts */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center space-x-2">
          <User className="w-5 h-5" />
          <span>Today's Shifts</span>
          <Badge variant="outline" className="ml-2">
            {todayRecords?.length || 0} shifts
          </Badge>
        </h2>

        {todayRecords && todayRecords.length > 0 ? (
          <div className="space-y-4">
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
          <Card>
            <CardContent className="text-center py-8">
              <div className="space-y-2">
                <Clock className="w-12 h-12 mx-auto text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">No shifts today</h3>
                <p className="text-gray-500">
                  You don't have any shifts scheduled for today. Enjoy your day off!
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      {/* Upcoming Shifts Calendar */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Next 6 Weeks</h2>
        {upcomingShifts && upcomingShifts.length > 0 ? (
          <UpcomingShiftsCalendar shifts={upcomingShifts} />
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <div className="space-y-2">
                <Calendar className="w-12 h-12 mx-auto text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">No upcoming shifts</h3>
                <p className="text-gray-500">
                  You don't have any shifts scheduled for the next 6 weeks.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h3 className="font-medium text-blue-900">How to use:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
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
  );
};

export default StaffShifts;
