import React from 'react';
import { AlertTriangle, Clock, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface OrphanedRecord {
  id: string;
  employee_id: string;
  shift_date: string | null;
  shift_start_time: string | null;
  shift_end_time: string | null;
  clock_in_time: string | null;
  clock_out_time: string | null;
  status: string | null;
  discrepancy_type: string | null;
  approval_status: string | null;
  notes: string | null;
}

interface OrphanedClockRecordProps {
  record: OrphanedRecord;
  onReview: (record: OrphanedRecord) => void;
  canEdit: boolean;
}

const OrphanedClockRecord: React.FC<OrphanedClockRecordProps> = ({
  record,
  onReview,
  canEdit,
}) => {
  const formatClockTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(':');
    return `${h}:${m}`;
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "group relative rounded-md border border-dashed p-2 transition-all duration-150",
              "border-l-[3px] border-l-amber-500",
              "border-amber-300 bg-amber-50/50 dark:bg-amber-950/20",
              canEdit && "cursor-pointer hover:shadow-md hover:ring-1 hover:ring-amber-400/30"
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (canEdit) onReview(record);
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 truncate leading-tight flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Unlinked Clock Data
              </span>
              <AlertTriangle className="w-3 h-3 text-amber-600" />
            </div>

            {/* Original scheduled time if available */}
            {record.shift_start_time && record.shift_end_time && (
              <div className="text-[10px] text-muted-foreground leading-tight mb-1">
                Was: {formatTime(record.shift_start_time)} – {formatTime(record.shift_end_time)}
              </div>
            )}

            {/* Clock times */}
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] text-muted-foreground">
                {record.clock_in_time ? `In: ${formatClockTime(record.clock_in_time)}` : 'No clock in'}
              </span>
              <span className="text-[9px] text-muted-foreground">
                {record.clock_out_time ? `Out: ${formatClockTime(record.clock_out_time)}` : '—'}
              </span>
            </div>

            {/* Review button */}
            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-1.5 h-5 text-[9px] border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                onClick={(e) => {
                  e.stopPropagation();
                  onReview(record);
                }}
              >
                <Link2 className="w-2.5 h-2.5 mr-1" />
                Review / Attach Shift
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <p className="font-semibold text-amber-600">Orphaned Clock Record</p>
            <p>This clock data was detached when its shift was moved.</p>
            {record.shift_start_time && record.shift_end_time && (
              <p>Original shift: {formatTime(record.shift_start_time)} – {formatTime(record.shift_end_time)}</p>
            )}
            {record.clock_in_time && <p>Clock In: {formatClockTime(record.clock_in_time)}</p>}
            {record.clock_out_time && <p>Clock Out: {formatClockTime(record.clock_out_time)}</p>}
            <p className="text-amber-600">Click to review: attach a shift or confirm times manually.</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default OrphanedClockRecord;
