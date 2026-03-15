
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, User, MapPin, Plus, CalendarOff } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTimeClockRecords } from "@/hooks/useTimeClockRecords";
import { useTimeClockSettings } from "@/hooks/useTimeClockSettings";
import { useCompanyClockSettings } from "@/hooks/useCompanyClockSettings";
import StaffShiftCard from "@/components/StaffShiftCard";
import UpcomingShiftsCalendar from "@/components/UpcomingShiftsCalendar";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import ClockCaptureDialog, { type CaptureData } from "@/components/ClockCaptureDialog";
import RequestAbsenceDialog from "@/components/RequestAbsenceDialog";
import { useMyAbsences } from "@/hooks/useAbsences";

const StaffShifts = () => {
  const { user } = useAuth();
  const { 
    todayRecords, 
    upcomingShifts,
    isLoading, 
    clockIn, 
    clockOut, 
    adHocClockIn,
    isClockingIn, 
    isClockingOut,
    isAdHocClockingIn,
    validateClockTime 
  } = useTimeClockRecords();

  const {
    requireGeoClockIn,
    requirePhotoClockIn,
  } = useCompanyClockSettings();

  const [showAdHocCapture, setShowAdHocCapture] = useState(false);
  const [showAbsenceDialog, setShowAbsenceDialog] = useState(false);

  // Fetch employee profile to get employee_id
  const { data: employeeProfile } = useQuery({
    queryKey: ['employee-profile-for-allocation', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('employee_id')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch today's allocation for this employee
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const { data: todayAllocation } = useQuery({
    queryKey: ['employee-today-allocation', employeeProfile?.employee_id, todayStr],
    queryFn: async () => {
      if (!employeeProfile?.employee_id) return null;
      const { data, error } = await supabase
        .from('roster_daily_allocations')
        .select('*, roster_allocation_locations(name)')
        .eq('employee_id', employeeProfile.employee_id)
        .eq('date', todayStr)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!employeeProfile?.employee_id
  });
  
  const formattedDate = format(today, 'EEEE, MMMM dd, yyyy');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading your shifts...</p>
        </div>
      </div>
    );
  }

  const allocationLocationName = todayAllocation?.roster_allocation_locations?.name;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-3 md:p-4 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-foreground">My Shifts</h1>
          <div className="flex items-center justify-center space-x-2 text-xs md:text-sm lg:text-base text-muted-foreground">
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
            <div className="text-lg md:text-xl lg:text-2xl font-mono font-bold text-center text-primary">
              {format(today, 'HH:mm:ss')}
            </div>
          </CardContent>
        </Card>

        {/* Allocation Banner */}
        {allocationLocationName && (
          <Card className="shadow-sm border-primary/30 bg-primary/5">
            <CardContent className="py-3 md:py-4">
              <div className="flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                <span className="text-sm md:text-base font-medium text-foreground">
                  Today you are working at:
                </span>
                <Badge variant="default" className="text-sm md:text-base px-3 py-0.5">
                  {allocationLocationName}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Today's Shifts */}
        <div className="space-y-3 md:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-base md:text-lg lg:text-xl font-semibold flex items-center space-x-2">
              <User className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" />
              <span>Today's Shifts</span>
            </h2>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <Badge variant="outline" className="text-xs">
                {todayRecords?.length || 0} shifts
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAbsenceDialog(true)}
                className="text-xs"
              >
                <CalendarOff className="w-3 h-3 mr-1" />
                Request Absence
              </Button>
              {/* Only show ad-hoc button if not already clocked into an ad-hoc shift */}
              {!todayRecords?.some(r => !r.shift_id && r.clock_in_time && !r.clock_out_time) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const needsCapture = requireGeoClockIn || requirePhotoClockIn;
                    if (needsCapture) {
                      setShowAdHocCapture(true);
                    } else {
                      adHocClockIn({});
                    }
                  }}
                  disabled={isAdHocClockingIn}
                  className="text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {isAdHocClockingIn ? 'Clocking In...' : 'Ad-hoc Clock In'}
                </Button>
              )}
            </div>
          </div>

          {todayRecords && todayRecords.length > 0 ? (
            <div className="space-y-2 md:space-y-3">
              {todayRecords.map((record) => (
                <StaffShiftCard
                  key={record.id}
                  record={record}
                  onClockIn={(args) => clockIn(args)}
                  onClockOut={(args) => clockOut(args)}
                  isClockingIn={isClockingIn}
                  isClockingOut={isClockingOut}
                  validateClockTime={validateClockTime}
                  allocationLocation={allocationLocationName}
                />
              ))}
            </div>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="text-center py-6 md:py-8">
                <div className="space-y-2 md:space-y-3">
                  <Clock className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 mx-auto text-muted-foreground" />
                  <h3 className="text-sm md:text-base lg:text-lg font-medium text-foreground">No shifts today</h3>
                  <p className="text-xs md:text-sm lg:text-base text-muted-foreground px-2 md:px-4">
                    You don't have any shifts scheduled for today. Use the "Ad-hoc Clock In" button if you need to record unrostered work.
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
                  <Calendar className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 mx-auto text-muted-foreground" />
                  <h3 className="text-sm md:text-base lg:text-lg font-medium text-foreground">No upcoming shifts</h3>
                  <p className="text-xs md:text-sm lg:text-base text-muted-foreground px-2 md:px-4">
                    You don't have any shifts scheduled for the next 6 weeks.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Instructions */}
        <Card className="bg-primary/5 border-primary/20 shadow-sm">
          <CardContent className="pt-4 md:pt-6">
            <div className="space-y-2 md:space-y-3">
              <h3 className="font-medium text-foreground text-xs md:text-sm lg:text-base">How to use:</h3>
              <ul className="text-xs md:text-sm text-muted-foreground space-y-1 pl-2">
                <li>• Clock in at the start of your shift</li>
                <li>• Clock out when your shift ends</li>
                <li>• Use "Ad-hoc Clock In" for unrostered work like training</li>
                <li>• You'll get warnings if clocking in/out outside the allowed time window</li>
                <li>• Use the calendar above to see your upcoming shifts</li>
                <li>• Contact your manager if you have any issues</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ad-hoc capture dialog */}
      <ClockCaptureDialog
        isOpen={showAdHocCapture}
        onClose={() => setShowAdHocCapture(false)}
        onComplete={(captureData: CaptureData) => {
          setShowAdHocCapture(false);
          adHocClockIn({ captureData });
        }}
        requirePhoto={!!requirePhotoClockIn}
        requireGeo={!!requireGeoClockIn}
        isClockIn={true}
        employeeId={employeeProfile?.employee_id || ''}
        isLoading={isAdHocClockingIn}
      />

      {/* Request Absence Dialog */}
      {employeeProfile?.employee_id && (
        <RequestAbsenceDialog
          isOpen={showAbsenceDialog}
          onClose={() => setShowAbsenceDialog(false)}
          employeeId={employeeProfile.employee_id}
        />
      )}
    </div>
  );
};

export default StaffShifts;
