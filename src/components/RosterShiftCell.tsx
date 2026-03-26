import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Check, Clock, AlertTriangle, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TimeRecord {
  id: string;
  status: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  discrepancy_type: string | null;
  approval_status: string | null;
  early_minutes_paid?: number | null;
  late_minutes_paid?: number | null;
  notes?: string | null;
  discrepancy_reason_id?: string | null;
  discrepancy_reasons?: { id: string; name: string; is_paid: boolean } | null;
}

interface ShiftWithTimeRecord {
  id: string;
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  position: string;
  job_role_id: string;
  roster_template_id?: string;
  time_record?: TimeRecord | null;
  absence_pay_override?: string | null;
}

interface AbsenceInfo {
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  status: string;
  absence_types: {
    id: string;
    name: string;
    color: string;
    is_payable: boolean;
  };
}

interface RosterShiftCellProps {
  shift: ShiftWithTimeRecord;
  onEdit: () => void;
  onReviewDiscrepancy?: (shift: ShiftWithTimeRecord) => void;
  canEdit: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  shiftTemplateName?: string;
  faded?: boolean;
  hasAbsence?: boolean;
  dayAbsence?: AbsenceInfo;
  absencePayOverride?: string | null;
}

const RosterShiftCell: React.FC<RosterShiftCellProps> = ({
  shift,
  onEdit,
  onReviewDiscrepancy,
  canEdit,
  onDragStart,
  shiftTemplateName,
  faded = false,
  hasAbsence = false,
  dayAbsence,
  absencePayOverride,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatDiscrepancyType = (type: string | null | undefined) => {
    if (!type) return 'Review';
    return type.split(',').map(t => t.trim().replace(/_/g, ' ')).join(', ');
  };


  // Parse time string "HH:mm" to minutes from midnight
  const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  // Parse ISO timestamp to minutes from midnight
  const isoToMinutes = (iso: string): number => {
    const d = new Date(iso);
    return d.getHours() * 60 + d.getMinutes();
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(':');
    return `${h}:${m}`;
  };

  const formatClockTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const scheduledStart = timeToMinutes(shift.start_time);
  const scheduledEnd = timeToMinutes(shift.end_time);
  const scheduledDuration = scheduledEnd - scheduledStart;

  const tr = shift.time_record;
  const hasClockedData = tr && (tr.clock_in_time || tr.clock_out_time);
  const hasTimeRecord = !!tr; // time_clock_record exists (even if no clock times)
  const isDiscrepancy = tr?.status === 'discrepancy';
  const hasDiscrepancyType = !!tr?.discrepancy_type;
  const needsReview = isDiscrepancy || (hasDiscrepancyType && tr?.approval_status !== 'reviewed');
  const isCompleted = tr?.status === 'completed';
  const isClockedIn = tr?.status === 'clocked_in';
  const isNoShow = tr?.discrepancy_type === 'did_not_clock_in' && !tr?.clock_in_time;

  // Calculate actual clock positions relative to shift window
  const actualStart = tr?.clock_in_time ? isoToMinutes(tr.clock_in_time) : null;
  const actualEnd = tr?.clock_out_time ? isoToMinutes(tr.clock_out_time) : null;

  // For the visual bar, we show a window from min(scheduled, actual) to max(scheduled, actual)
  const windowStart = Math.min(scheduledStart, actualStart ?? scheduledStart);
  const windowEnd = Math.max(scheduledEnd, actualEnd ?? scheduledEnd);
  const windowDuration = windowEnd - windowStart || 1;

  // Calculate percentages for the bars
  const schedBarLeft = ((scheduledStart - windowStart) / windowDuration) * 100;
  const schedBarWidth = (scheduledDuration / windowDuration) * 100;

  const shouldShowSegments = hasClockedData && (isDiscrepancy || hasDiscrepancyType || isClockedIn);

  // Determine early/late segments for the actual bar
  const getSegments = () => {
    if (actualStart === null) return [];
    
    const segments: { left: number; width: number; type: 'early' | 'on-time' | 'late' }[] = [];
    const aEnd = actualEnd ?? windowEnd;

    if (isCompleted && !isDiscrepancy && !tr?.discrepancy_type) {
      // For completed shifts without discrepancy, show entirely as on-time
      segments.push({
        left: ((Math.min(actualStart, scheduledStart) - windowStart) / windowDuration) * 100,
        width: ((Math.max(aEnd, scheduledEnd) - Math.min(actualStart, scheduledStart)) / windowDuration) * 100,
        type: 'on-time',
      });
      return segments;
    }

    // Early clock-in (before scheduled start)
    if (actualStart < scheduledStart) {
      const earlyEnd = Math.min(scheduledStart, aEnd);
      segments.push({
        left: ((actualStart - windowStart) / windowDuration) * 100,
        width: ((earlyEnd - actualStart) / windowDuration) * 100,
        type: 'early',
      });
    }

    // On-time portion
    const onTimeStart = Math.max(actualStart, scheduledStart);
    const onTimeEnd = Math.min(aEnd, scheduledEnd);
    if (onTimeStart < onTimeEnd) {
      segments.push({
        left: ((onTimeStart - windowStart) / windowDuration) * 100,
        width: ((onTimeEnd - onTimeStart) / windowDuration) * 100,
        type: 'on-time',
      });
    }

    // Late clock-in (started after scheduled start, mark gap as late)
    if (actualStart > scheduledStart) {
      segments.push({
        left: ((scheduledStart - windowStart) / windowDuration) * 100,
        width: ((Math.min(actualStart, scheduledEnd) - scheduledStart) / windowDuration) * 100,
        type: 'late',
      });
    }

    // Late clock-out (after scheduled end)
    if (aEnd > scheduledEnd) {
      segments.push({
        left: ((scheduledEnd - windowStart) / windowDuration) * 100,
        width: ((aEnd - scheduledEnd) / windowDuration) * 100,
        type: 'late',
      });
    }

    // Early clock-out (before scheduled end)
    if (aEnd < scheduledEnd && actualStart !== null) {
      segments.push({
        left: ((aEnd - windowStart) / windowDuration) * 100,
        width: ((scheduledEnd - aEnd) / windowDuration) * 100,
        type: 'early',
      });
    }

    return segments;
  };

  const statusIcon = () => {
    if (isDiscrepancy || needsReview) return <AlertTriangle className="w-3 h-3 text-destructive" />;
    if (isCompleted) return <Check className="w-3 h-3 text-emerald-600" />;
    if (isClockedIn) return <Clock className="w-3 h-3 text-amber-500" />;
    return null;
  };

  const statusBorderClass = () => {
    if (isDiscrepancy || needsReview) return 'border-l-destructive';
    if (isCompleted) return 'border-l-emerald-500';
    if (isClockedIn) return 'border-l-amber-400';
    return 'border-l-primary';
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "group relative rounded-md border border-border bg-card p-2 transition-all duration-150",
              "border-l-[3px]",
              statusBorderClass(),
              faded && "opacity-30 pointer-events-none select-none",
              !faded && isHovered && "shadow-md ring-1 ring-primary/20",
              !faded && canEdit && "cursor-pointer hover:shadow-md",
              !faded && (isDiscrepancy || needsReview) && "bg-destructive/5"
            )}
            onClick={(e) => {
              if (faded) return;
              e.stopPropagation();
              onEdit();
            }}
            onMouseEnter={() => !faded && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            draggable={canEdit && !faded}
            onDragStart={faded ? undefined : onDragStart}
          >
            {/* Drag handle */}
            {canEdit && (
              <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-60 transition-opacity">
                <GripVertical className="w-3 h-3 text-muted-foreground" />
              </div>
            )}

            {/* Header: position + status */}
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[11px] font-semibold text-foreground truncate leading-tight">
                {shift.position || shiftTemplateName || 'Shift'}
              </span>
              {statusIcon()}
            </div>

            {/* Time text */}
            <div className="text-[10px] text-muted-foreground leading-tight mb-1.5">
              {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
            </div>

            {/* Absence pay indicator */}
            {hasAbsence && (
              <div className={cn(
                "text-[9px] font-medium mb-1 px-1 py-0.5 rounded text-center",
                (absencePayOverride === 'paid' || (absencePayOverride === null && shift.absence_pay_override === 'paid'))
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                  : (absencePayOverride === 'unpaid' || (absencePayOverride === null && shift.absence_pay_override === 'unpaid'))
                    ? "bg-muted text-muted-foreground"
                    : "bg-muted text-muted-foreground"
              )}>
                {shift.absence_pay_override === 'paid' ? '💰 Paid' : shift.absence_pay_override === 'unpaid' ? 'Unpaid' : 'Default'}
              </div>
            )}

            {/* Visual timeline bar */}
            <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
              {/* Scheduled bar (background) */}
              <div
                className="absolute top-0 h-full bg-primary/20 rounded-full"
                style={{ left: `${schedBarLeft}%`, width: `${schedBarWidth}%` }}
              />

              {/* No-show: entire shift is missing */}
              {isNoShow && (
                <div
                  className="absolute top-0 h-full bg-destructive/50 rounded-full border border-dashed border-destructive/60"
                  style={{ left: `${schedBarLeft}%`, width: `${schedBarWidth}%` }}
                />
              )}

              {/* Actual time segments (only for shifts with clock data and discrepancies) */}
              {shouldShowSegments && getSegments().map((seg, i) => (
                <div
                  key={i}
                  className={cn(
                    "absolute top-0 h-full rounded-full",
                    seg.type === 'on-time' && "bg-emerald-500",
                    seg.type === 'early' && "bg-amber-400",
                    seg.type === 'late' && "bg-destructive/70"
                  )}
                  style={{ left: `${seg.left}%`, width: `${Math.max(seg.width, 1)}%` }}
                />
              ))}

              {/* Completed shifts without discrepancy — show as solid green */}
              {hasClockedData && isCompleted && !isDiscrepancy && !tr?.discrepancy_type && getSegments().map((seg, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full rounded-full bg-emerald-500"
                  style={{ left: `${seg.left}%`, width: `${Math.max(seg.width, 1)}%` }}
                />
              ))}


              {/* No clock data and not a no-show — just show scheduled placeholder */}
              {!hasClockedData && !isNoShow && (
                <div
                  className="absolute top-0 h-full bg-primary/40 rounded-full"
                  style={{ left: `${schedBarLeft}%`, width: `${schedBarWidth}%` }}
                />
              )}
            </div>

            {/* Clock times or no-show label */}
            {isNoShow && (
              <div className="text-[9px] text-destructive font-medium mt-1 text-center">
                No clock in
              </div>
            )}
            {hasClockedData && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-[9px] text-muted-foreground">
                  {tr?.clock_in_time ? `In: ${formatClockTime(tr.clock_in_time)}` : 'No clock in'}
                </span>
                <span className="text-[9px] text-muted-foreground">
                  {tr?.clock_out_time ? `Out: ${formatClockTime(tr.clock_out_time)}` : isClockedIn ? 'Active' : '—'}
                </span>
              </div>
            )}

            {/* Inline review button for discrepancies - show for pending AND reviewed */}
            {(isDiscrepancy || hasDiscrepancyType) && canEdit && onReviewDiscrepancy && (
              <Button
                size="sm"
                variant="outline"
                className={cn(
                  "w-full mt-1.5 h-auto min-h-5 text-[9px] py-0.5",
                  tr?.approval_status === 'reviewed'
                    ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                    : "border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onReviewDiscrepancy(shift);
                }}
              >
                <AlertTriangle className="w-2.5 h-2.5 mr-1 shrink-0" />
                <span className="truncate">
                  {tr?.approval_status === 'reviewed' 
                    ? (tr?.notes?.includes('Auto-approved') 
                        ? 'Auto ✓' 
                        : tr?.discrepancy_reasons?.name 
                          ? `${tr.discrepancy_reasons.name} ✓`
                          : 'Reviewed ✓')
                    : tr?.discrepancy_reasons?.name 
                      ? tr.discrepancy_reasons.name
                      : formatDiscrepancyType(tr?.discrepancy_type)}
                </span>
              </Button>
            )}
            {/* Show reviewed badge for completed discrepancies without edit permission */}
            {(isDiscrepancy || hasDiscrepancyType) && !canEdit && tr?.approval_status === 'reviewed' && (
              <div className="text-[9px] text-emerald-600 font-medium mt-1 text-center truncate">
                {tr?.notes?.includes('Auto-approved') 
                  ? 'Auto ✓' 
                  : tr?.discrepancy_reasons?.name 
                    ? `${tr.discrepancy_reasons.name} ✓`
                    : 'Reviewed ✓'}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <p className="font-semibold">{shift.position || 'Shift'}</p>
            <p>Scheduled: {formatTime(shift.start_time)} – {formatTime(shift.end_time)}</p>
            {tr?.clock_in_time && <p>Clock In: {formatClockTime(tr.clock_in_time)}</p>}
            {tr?.clock_out_time && <p>Clock Out: {formatClockTime(tr.clock_out_time)}</p>}
            {(isDiscrepancy || hasDiscrepancyType) && tr?.discrepancy_type && (
              <p className="text-destructive">
                {tr.discrepancy_reasons?.name 
                  ? `${tr.discrepancy_reasons.name} (${tr.discrepancy_reasons.is_paid ? 'Paid' : 'Unpaid'})`
                  : formatDiscrepancyType(tr.discrepancy_type)}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default RosterShiftCell;
