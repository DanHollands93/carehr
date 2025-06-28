
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertTriangle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ClockWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isClockIn: boolean;
  minutesDiff: number;
  isLoading: boolean;
}

const ClockWarningDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isClockIn, 
  minutesDiff, 
  isLoading 
}: ClockWarningDialogProps) => {
  const isEarly = minutesDiff < 0;
  const absMinutes = Math.abs(minutesDiff);
  const action = isClockIn ? 'clock in' : 'clock out';
  const timing = isEarly ? 'early' : 'late';

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-amber-100 p-3">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <AlertDialogTitle className="text-lg">
            {timing === 'early' ? 'Early' : 'Late'} {isClockIn ? 'Clock In' : 'Clock Out'}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span>You are attempting to {action}</span>
            </div>
            
            <div className="flex justify-center">
              <Badge variant={timing === 'late' ? 'destructive' : 'secondary'} className="px-3 py-1">
                {absMinutes} minute{absMinutes !== 1 ? 's' : ''} {timing}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600">
              This will be recorded as a time discrepancy and may require manager approval.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700"
          >
            {isLoading ? 'Processing...' : `Confirm ${isClockIn ? 'Clock In' : 'Clock Out'}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ClockWarningDialog;
