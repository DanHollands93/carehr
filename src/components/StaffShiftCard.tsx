
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useTimeClockSettings } from "@/hooks/useTimeClockSettings";
import { useCompanyClockSettings } from "@/hooks/useCompanyClockSettings";
import { useState } from "react";
import ClockWarningDialog from "./ClockWarningDialog";
import ClockCaptureDialog, { type CaptureData } from "./ClockCaptureDialog";

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
  onClockIn: (args: { recordId: string; captureData?: CaptureData }) => void;
  onClockOut: (args: { recordId: string; captureData?: CaptureData }) => void;
  isClockingIn: boolean;
  isClockingOut: boolean;
  validateClockTime: (record: TimeClockRecord, isClockIn: boolean, tolerances: any) => {
    isWithinTolerance: boolean;
    minutesDiff: number;
    warningMessage: string | null;
  };
  allocationLocation?: string;
}

const StaffShiftCard = ({ 
  record, 
  onClockIn, 
  onClockOut, 
  isClockingIn, 
  isClockingOut,
  validateClockTime,
  allocationLocation
}: StaffShiftCardProps) => {
  const { 
    earlyClockInMinutes, 
    lateClockInMinutes, 
    earlyClockOutMinutes, 
    lateClockOutMinutes 
  } = useTimeClockSettings();

  const {
    requireGeoClockIn,
    requireGeoClockOut,
    requirePhotoClockIn,
    requirePhotoClockOut,
  } = useCompanyClockSettings();

  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [showCaptureDialog, setShowCaptureDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'clock_in' | 'clock_out';
    minutesDiff: number;
  } | null>(null);

  const formatDiscrepancyType = (type: string) => {
    if (!type) return '';
    return type
      .split(',')
      .map(t => t.trim())
      .map(t => {
        switch (t) {
          case 'early_clock_in': return 'Early clock in';
          case 'late_clock_in': return 'Late clock in';
          case 'early_clock_out': return 'Early clock out';
          case 'late_clock_out': return 'Late clock out';
          default: return t.replace(/_/g, ' ');
        }
      })
      .join(', ');
  };

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

  const isAdHoc = !record.shift_id;
  const canClockIn = !isAdHoc && record.status === 'scheduled' && !record.clock_in_time;
  const canClockOut = record.clock_in_time && !record.clock_out_time;

  const needsCaptureForClockIn = requireGeoClockIn || requirePhotoClockIn;
  const needsCaptureForClockOut = requireGeoClockOut || requirePhotoClockOut;

  const proceedWithAction = (actionType: 'clock_in' | 'clock_out') => {
    const needsCapture = actionType === 'clock_in' ? needsCaptureForClockIn : needsCaptureForClockOut;
    if (needsCapture) {
      setPendingAction({ type: actionType, minutesDiff: 0 });
      setShowCaptureDialog(true);
    } else {
      if (actionType === 'clock_in') {
        onClockIn({ recordId: record.id });
      } else {
        onClockOut({ recordId: record.id });
      }
    }
  };

  const handleClockIn = () => {
    if (isAdHoc) {
      proceedWithAction('clock_in');
      return;
    }
    const validation = validateClockTime(record, true, {
      earlyClockInMinutes, lateClockInMinutes, earlyClockOutMinutes, lateClockOutMinutes
    });
    if (validation.warningMessage) {
      setPendingAction({ type: 'clock_in', minutesDiff: validation.minutesDiff });
      setShowWarningDialog(true);
    } else {
      proceedWithAction('clock_in');
    }
  };

  const handleClockOut = () => {
    if (isAdHoc) {
      proceedWithAction('clock_out');
      return;
    }
    const validation = validateClockTime(record, false, {
      earlyClockInMinutes, lateClockInMinutes, earlyClockOutMinutes, lateClockOutMinutes
    });
    if (validation.warningMessage) {
      setPendingAction({ type: 'clock_out', minutesDiff: validation.minutesDiff });
      setShowWarningDialog(true);
    } else {
      proceedWithAction('clock_out');
    }
  };

  const handleWarningConfirm = () => {
    setShowWarningDialog(false);
    if (pendingAction) {
      proceedWithAction(pendingAction.type);
    }
  };

  const handleCaptureComplete = (captureData: CaptureData) => {
    setShowCaptureDialog(false);
    if (pendingAction?.type === 'clock_in') {
      onClockIn({ recordId: record.id, captureData });
    } else if (pendingAction?.type === 'clock_out') {
      onClockOut({ recordId: record.id, captureData });
    }
    setPendingAction(null);
  };

  const handleCancelAction = () => {
    setShowWarningDialog(false);
    setShowCaptureDialog(false);
    setPendingAction(null);
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">
              {isAdHoc ? (
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-normal">Ad-hoc</Badge>
                  Unrostered Shift
                </span>
              ) : (
                `${record.shift_start_time} - ${record.shift_end_time}`
              )}
            </CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isAdHoc && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
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
          )}

          {allocationLocation && (
            <div className="flex items-center space-x-2 text-sm text-primary font-medium">
              <MapPin className="w-4 h-4" />
              <span>Location: {allocationLocation}</span>
            </div>
          )}

          {record.clock_in_time && (
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <User className="w-4 h-4" />
              <span>
                Clocked in: {format(parseISO(record.clock_in_time), 'HH:mm')}
              </span>
            </div>
          )}

          {record.clock_out_time && (
            <div className="flex items-center space-x-2 text-sm text-primary">
              <MapPin className="w-4 h-4" />
              <span>
                Clocked out: {format(parseISO(record.clock_out_time), 'HH:mm')}
              </span>
            </div>
          )}

          {record.discrepancy_type && (
            <div className="flex items-center space-x-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>Discrepancy: {formatDiscrepancyType(record.discrepancy_type)}</span>
            </div>
          )}

          <div className="flex space-x-2 pt-2">
            {canClockIn && (
              <Button
                onClick={handleClockIn}
                disabled={isClockingIn}
                className="flex-1"
                variant="default"
              >
                {isClockingIn ? 'Clocking In...' : 'Clock In'}
              </Button>
            )}

            {canClockOut && (
              <Button
                onClick={handleClockOut}
                disabled={isClockingOut}
                className="flex-1"
                variant="secondary"
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
        onConfirm={handleWarningConfirm}
        isClockIn={pendingAction?.type === 'clock_in'}
        minutesDiff={pendingAction?.minutesDiff || 0}
        isLoading={isClockingIn || isClockingOut}
      />

      <ClockCaptureDialog
        isOpen={showCaptureDialog}
        onClose={handleCancelAction}
        onComplete={handleCaptureComplete}
        requirePhoto={pendingAction?.type === 'clock_in' ? !!requirePhotoClockIn : !!requirePhotoClockOut}
        requireGeo={pendingAction?.type === 'clock_in' ? !!requireGeoClockIn : !!requireGeoClockOut}
        isClockIn={pendingAction?.type === 'clock_in'}
        employeeId={record.employee_id}
        isLoading={isClockingIn || isClockingOut}
      />
    </>
  );
};

export default StaffShiftCard;
