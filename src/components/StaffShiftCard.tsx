
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useTimeClockSettings } from "@/hooks/useTimeClockSettings";
import { useState } from "react";
import ClockWarningDialog from "./ClockWarningDialog";

interface TimeClockRecord {
  id: string;
  employee_id: string;
  shift_id: string | null;
  shift_date: string;
  shift_start_time: string;
  shift_end_time: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  status: 'scheduled' | 'clocked_in' | 'completed' | 'discrepancy';
  discrepancy_type: string | null;
  approved_by: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
}

interface StaffShiftCardProps {
  record: TimeClockRecord;
  onClockIn: (recordId: string) => void;
  onClockOut: (recordId: string) => void;
  isClockingIn: boolean;
  isClockingOut: boolean;
  validateClockTime: (record: TimeClockRecord, isClockIn: boolean, tolerances: any) => {
    isWithinTolerance: boolean;
    minutesDiff: number;
    warningMessage: string | null;
  };
}

const StaffShiftCard = ({ 
  record, 
  onClockIn, 
  onClockOut, 
  isClockingIn, 
  isClockingOut,
  validateClockTime 
}: StaffShiftCardProps) => {
  const { 
    earlyClockInMinutes, 
    lateClockInMinutes, 
    earlyClockOutMinutes, 
    lateClockOutMinutes 
  } = useTimeClockSettings();

  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'clock_in' | 'clock_out';
    minutesDiff: number;
  } | null>(null);

  const getStatusBadge = () => {
    switch (record.status) {
      case 'scheduled':
        return <Badge variant="secondary">Scheduled</Badge>;
      case 'clocked_in':
        return <Badge className="bg-amber-500">Clocked In</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'discrepancy':
        return <Badge variant="destructive">Discrepancy</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const canClockIn = record.status === 'scheduled' && !record.clock_in_time;
  const canClockOut = record.status === 'clocked_in' && record.clock_in_time && !record.clock_out_time;

  const handleClockIn = () => {
    const validation = validateClockTime(record, true, {
      earlyClockInMinutes,
      lateClockInMinutes,
      earlyClockOutMinutes,
      lateClockOutMinutes
    });

    if (validation.warningMessage) {
      setPendingAction({ type: 'clock_in', minutesDiff: validation.minutesDiff });
      setShowWarningDialog(true);
    } else {
      onClockIn(record.id);
    }
  };

  const handleClockOut = () => {
    const validation = validateClockTime(record, false, {
      earlyClockInMinutes,
      lateClockInMinutes,
      earlyClockOutMinutes,
      lateClockOutMinutes
    });

    if (validation.warningMessage) {
      setPendingAction({ type: 'clock_out', minutesDiff: validation.minutesDiff });
      setShowWarningDialog(true);
    } else {
      onClockOut(record.id);
    }
  };

  const handleConfirmAction = () => {
    if (pendingAction?.type === 'clock_in') {
      onClockIn(record.id);
    } else if (pendingAction?.type === 'clock_out') {
      onClockOut(record.id);
    }
    setShowWarningDialog(false);
    setPendingAction(null);
  };

  const handleCancelAction = () => {
    setShowWarningDialog(false);
    setPendingAction(null);
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">
              {record.shift_start_time} - {record.shift_end_time}
            </CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>
              Duration: {(() => {
                const [startHour, startMin] = record.shift_start_time.split(':').map(Number);
                const [endHour, endMin] = record.shift_end_time.split(':').map(Number);
                const startMinutes = startHour * 60 + startMin;
                const endMinutes = endHour * 60 + endMin;
                const duration = endMinutes - startMinutes;
                const hours = Math.floor(duration / 60);
                const minutes = duration % 60;
                return `${hours}h ${minutes}m`;
              })()}
            </span>
          </div>

          {record.clock_in_time && (
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <User className="w-4 h-4" />
              <span>
                Clocked in: {format(parseISO(record.clock_in_time), 'HH:mm')}
              </span>
            </div>
          )}

          {record.clock_out_time && (
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <MapPin className="w-4 h-4" />
              <span>
                Clocked out: {format(parseISO(record.clock_out_time), 'HH:mm')}
              </span>
            </div>
          )}

          {record.discrepancy_type && (
            <div className="flex items-center space-x-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>Discrepancy: {record.discrepancy_type.replace('_', ' ')}</span>
            </div>
          )}

          <div className="flex space-x-2 pt-2">
            {canClockIn && (
              <Button
                onClick={handleClockIn}
                disabled={isClockingIn}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isClockingIn ? 'Clocking In...' : 'Clock In'}
              </Button>
            )}

            {canClockOut && (
              <Button
                onClick={handleClockOut}
                disabled={isClockingOut}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isClockingOut ? 'Clocking Out...' : 'Clock Out'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <ClockWarningDialog
        isOpen={showWarningDialog}
        onClose={handleCancelAction}
        onConfirm={handleConfirmAction}
        isClockIn={pendingAction?.type === 'clock_in'}
        minutesDiff={pendingAction?.minutesDiff || 0}
        isLoading={isClockingIn || isClockingOut}
      />
    </>
  );
};

export default StaffShiftCard;
