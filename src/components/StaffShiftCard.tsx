
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, MapPin, User, AlertCircle, Camera, Navigation } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useTimeClockSettings } from "@/hooks/useTimeClockSettings";
import { useCompanyClockSettings } from "@/hooks/useCompanyClockSettings";
import { useState } from "react";
import ClockWarningDialog from "./ClockWarningDialog";
import ClockCaptureDialog, { type CaptureData } from "./ClockCaptureDialog";
import { type TimeClockRecord } from "@/hooks/useTimeClockRecords";
import { supabase } from "@/integrations/supabase/client";

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
  const [showPhotoDialog, setShowPhotoDialog] = useState<'clock_in' | 'clock_out' | null>(null);
  const [showGeoDialog, setShowGeoDialog] = useState<'clock_in' | 'clock_out' | null>(null);
  const [signedPhotoUrl, setSignedPhotoUrl] = useState<string | null>(null);
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

  const handleViewPhoto = async (type: 'clock_in' | 'clock_out') => {
    const photoPath = type === 'clock_in' ? record.clock_in_photo_url : record.clock_out_photo_url;
    if (!photoPath) return;

    // Get a signed URL for the private bucket
    const { data } = await supabase.storage
      .from('clock-photos')
      .createSignedUrl(photoPath, 300); // 5 min expiry

    setSignedPhotoUrl(data?.signedUrl || null);
    setShowPhotoDialog(type);
  };

  const geoDataForType = (type: 'clock_in' | 'clock_out') => {
    if (type === 'clock_in') {
      return record.clock_in_latitude != null && record.clock_in_longitude != null
        ? { lat: record.clock_in_latitude, lng: record.clock_in_longitude, accuracy: record.clock_in_accuracy }
        : null;
    }
    return record.clock_out_latitude != null && record.clock_out_longitude != null
      ? { lat: record.clock_out_latitude, lng: record.clock_out_longitude, accuracy: record.clock_out_accuracy }
      : null;
  };

  // Determine which verification buttons to show
  const showPhotoButtons = requirePhotoClockIn || requirePhotoClockOut;
  const showGeoButtons = requireGeoClockIn || requireGeoClockOut;

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
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <User className="w-4 h-4" />
                <span>Clocked in: {format(parseISO(record.clock_in_time), 'HH:mm')}</span>
              </div>
              <div className="flex gap-2 ml-6">
                {showPhotoButtons && record.clock_in_photo_url && (
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleViewPhoto('clock_in')}>
                    <Camera className="w-3 h-3 mr-1" /> View Photo
                  </Button>
                )}
                {showGeoButtons && record.clock_in_latitude != null && (
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowGeoDialog('clock_in')}>
                    <Navigation className="w-3 h-3 mr-1" /> View Location
                  </Button>
                )}
              </div>
            </div>
          )}

          {record.clock_out_time && (
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-sm text-primary">
                <MapPin className="w-4 h-4" />
                <span>Clocked out: {format(parseISO(record.clock_out_time), 'HH:mm')}</span>
              </div>
              <div className="flex gap-2 ml-6">
                {showPhotoButtons && record.clock_out_photo_url && (
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleViewPhoto('clock_out')}>
                    <Camera className="w-3 h-3 mr-1" /> View Photo
                  </Button>
                )}
                {showGeoButtons && record.clock_out_latitude != null && (
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowGeoDialog('clock_out')}>
                    <Navigation className="w-3 h-3 mr-1" /> View Location
                  </Button>
                )}
              </div>
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

      {/* Photo Viewer Dialog */}
      <Dialog open={showPhotoDialog !== null} onOpenChange={(open) => !open && setShowPhotoDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {showPhotoDialog === 'clock_in' ? 'Clock In' : 'Clock Out'} Photo
            </DialogTitle>
          </DialogHeader>
          {signedPhotoUrl ? (
            <img src={signedPhotoUrl} alt="Clock photo" className="w-full rounded-md" />
          ) : (
            <p className="text-sm text-muted-foreground">Unable to load photo.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Geo Viewer Dialog */}
      <Dialog open={showGeoDialog !== null} onOpenChange={(open) => !open && setShowGeoDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {showGeoDialog === 'clock_in' ? 'Clock In' : 'Clock Out'} Location
            </DialogTitle>
          </DialogHeader>
          {showGeoDialog && (() => {
            const geo = geoDataForType(showGeoDialog);
            if (!geo) return <p className="text-sm text-muted-foreground">No location data available.</p>;
            const mapsUrl = `https://www.google.com/maps?q=${geo.lat},${geo.lng}`;
            return (
              <div className="space-y-3">
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Navigation className="w-4 h-4 text-primary" />
                    <span className="font-medium">Coordinates</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {geo.lat.toFixed(6)}, {geo.lng.toFixed(6)}
                  </p>
                  {geo.accuracy != null && (
                    <p className="text-xs text-muted-foreground">
                      Accuracy: ±{Math.round(geo.accuracy)}m
                    </p>
                  )}
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                    <MapPin className="w-4 h-4 mr-2" /> Open in Google Maps
                  </a>
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StaffShiftCard;
