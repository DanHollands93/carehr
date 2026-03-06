import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Clock, Check, X, AlertTriangle } from 'lucide-react';
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
}

export interface DiscrepancySegment {
  type: 'early_start' | 'late_start' | 'early_end' | 'late_end';
  label: string;
  description: string;
  timeRange: string;
  durationMinutes: number;
  paid: boolean;
}

export interface DiscrepancyReviewResult {
  recordId: string;
  segments: DiscrepancySegment[];
  notes: string;
}

interface DiscrepancyReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shift: ShiftWithTimeRecord;
  employeeName: string;
  onSubmitReview: (result: DiscrepancyReviewResult) => void;
}

const DiscrepancyReviewDialog: React.FC<DiscrepancyReviewDialogProps> = ({
  isOpen,
  onClose,
  shift,
  employeeName,
  onSubmitReview,
}) => {
  const [notes, setNotes] = useState('');

  const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const isoToMinutes = (iso: string): number => {
    const d = new Date(iso);
    return d.getHours() * 60 + d.getMinutes();
  };

  const minutesToTime = (mins: number): string => {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const formatDuration = (mins: number): string => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const tr = shift.time_record;

  // Build discrepancy segments
  const initialSegments = useMemo(() => {
    const scheduledStart = timeToMinutes(shift.start_time);
    const scheduledEnd = timeToMinutes(shift.end_time);
    const isReviewed = tr?.approval_status === 'reviewed';
    const earlyPaid = tr?.early_minutes_paid || 0;
    const latePaid = tr?.late_minutes_paid || 0;
    const isNoShow = tr?.discrepancy_type === 'did_not_clock_in' && !tr?.clock_in_time;

    const segments: DiscrepancySegment[] = [];

    // No-show: entire shift is missing
    if (isNoShow) {
      const duration = scheduledEnd - scheduledStart;
      segments.push({
        type: 'late_start', // treat as missing time
        label: 'Did Not Clock In',
        description: `Employee did not clock in for the entire shift`,
        timeRange: `${minutesToTime(scheduledStart)} → ${minutesToTime(scheduledEnd)}`,
        durationMinutes: duration,
        paid: false,
      });
      return segments;
    }

    if (!tr?.clock_in_time) return [];
    
    const actualStart = isoToMinutes(tr.clock_in_time);
    const actualEnd = tr.clock_out_time ? isoToMinutes(tr.clock_out_time) : scheduledEnd;

    // Track consumed paid minutes to handle multi-segment scenarios
    let earlyPaidRemaining = earlyPaid;
    let latePaidRemaining = latePaid;

    // Clocked in early (before scheduled start) → uses earlyPaid bucket
    if (actualStart < scheduledStart) {
      const duration = scheduledStart - actualStart;
      const segPaid = isReviewed && earlyPaidRemaining >= duration;
      if (segPaid) earlyPaidRemaining -= duration;
      segments.push({
        type: 'early_start',
        label: 'Early Clock In',
        description: `Clocked in ${formatDuration(duration)} before shift started`,
        timeRange: `${minutesToTime(actualStart)} → ${minutesToTime(scheduledStart)}`,
        durationMinutes: duration,
        paid: segPaid,
      });
    }

    // Clocked in late (after scheduled start) → uses latePaid bucket
    if (actualStart > scheduledStart + 5) {
      const duration = actualStart - scheduledStart;
      const segPaid = isReviewed && latePaidRemaining >= duration;
      if (segPaid) latePaidRemaining -= duration;
      segments.push({
        type: 'late_start',
        label: 'Late Clock In',
        description: `Clocked in ${formatDuration(duration)} after shift started`,
        timeRange: `${minutesToTime(scheduledStart)} → ${minutesToTime(actualStart)}`,
        durationMinutes: duration,
        paid: segPaid,
      });
    }

    // Clocked out early (before scheduled end) → uses latePaid bucket
    if (actualEnd < scheduledEnd - 5) {
      const duration = scheduledEnd - actualEnd;
      const segPaid = isReviewed && latePaidRemaining >= duration;
      if (segPaid) latePaidRemaining -= duration;
      segments.push({
        type: 'early_end',
        label: 'Early Clock Out',
        description: `Clocked out ${formatDuration(duration)} before shift ended`,
        timeRange: `${minutesToTime(actualEnd)} → ${minutesToTime(scheduledEnd)}`,
        durationMinutes: duration,
        paid: segPaid,
      });
    }

    // Clocked out late (after scheduled end) → uses earlyPaid bucket
    if (actualEnd > scheduledEnd) {
      const duration = actualEnd - scheduledEnd;
      const segPaid = isReviewed && earlyPaidRemaining >= duration;
      if (segPaid) earlyPaidRemaining -= duration;
      segments.push({
        type: 'late_end',
        label: 'Late Clock Out',
        description: `Clocked out ${formatDuration(duration)} after shift ended`,
        timeRange: `${minutesToTime(scheduledEnd)} → ${minutesToTime(actualEnd)}`,
        durationMinutes: duration,
        paid: segPaid,
      });
    }

    return segments;
  }, [shift, tr]);

  const [segments, setSegments] = useState<DiscrepancySegment[]>(initialSegments);

  // Reset when dialog opens with new data
  React.useEffect(() => {
    setSegments(initialSegments);
    setNotes(tr?.notes || '');
  }, [initialSegments]);

  const togglePaid = (index: number) => {
    setSegments(prev => prev.map((seg, i) => 
      i === index ? { ...seg, paid: !seg.paid } : seg
    ));
  };

  const handleSubmit = () => {
    if (!tr) return;
    onSubmitReview({
      recordId: tr.id,
      segments,
      notes,
    });
  };

  if (!tr) return null;

  const scheduledStart = timeToMinutes(shift.start_time);
  const scheduledEnd = timeToMinutes(shift.end_time);
  const isNoShow = tr.discrepancy_type === 'did_not_clock_in' && !tr.clock_in_time;
  const hasClockedData = !!(tr.clock_in_time || tr.clock_out_time);
  const actualStart = tr.clock_in_time ? isoToMinutes(tr.clock_in_time) : scheduledStart;
  const actualEnd = tr.clock_out_time ? isoToMinutes(tr.clock_out_time) : scheduledEnd;

  // For visual bar
  const windowStart = Math.min(scheduledStart, actualStart);
  const windowEnd = Math.max(scheduledEnd, actualEnd);
  const windowDuration = windowEnd - windowStart || 1;

  const pct = (mins: number) => ((mins - windowStart) / windowDuration) * 100;

  const segmentTypeIcon = (type: DiscrepancySegment['type']) => {
    if (type === 'early_start' || type === 'late_end') return <Clock className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  const segmentTypeColor = (type: DiscrepancySegment['type']) => {
    if (type === 'early_start') return 'text-amber-600';
    if (type === 'late_start') return 'text-destructive';
    if (type === 'early_end') return 'text-destructive';
    if (type === 'late_end') return 'text-amber-600';
    return 'text-muted-foreground';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Review Time Discrepancy
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Employee & Shift Info */}
          <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
            <div>
              <p className="font-semibold text-sm text-foreground">{employeeName}</p>
              <p className="text-xs text-muted-foreground">{shift.position} · {shift.date}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Scheduled</p>
              <p className="text-sm font-mono font-medium text-foreground">
                {shift.start_time} – {shift.end_time}
              </p>
            </div>
          </div>

          {/* Visual Timeline */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Timeline</p>
            <div className="relative h-10 bg-muted rounded-lg overflow-hidden">
              {/* Scheduled block */}
              <div
                className="absolute top-1 h-3.5 bg-primary/25 rounded border border-primary/30"
                style={{ left: `${pct(scheduledStart)}%`, width: `${pct(scheduledEnd) - pct(scheduledStart)}%` }}
              />

              {isNoShow ? (
                /* No-show: entire shift missing */
                <div
                  className="absolute top-5.5 h-3.5 bg-destructive/50 rounded border border-dashed border-destructive/60"
                  style={{ left: `${pct(scheduledStart)}%`, width: `${pct(scheduledEnd) - pct(scheduledStart)}%` }}
                />
              ) : (
                <>
                  {/* Actual on-time block */}
                  <div
                    className="absolute top-5.5 h-3.5 bg-emerald-500/80 rounded"
                    style={{
                      left: `${pct(Math.max(actualStart, scheduledStart))}%`,
                      width: `${Math.max(pct(Math.min(actualEnd, scheduledEnd)) - pct(Math.max(actualStart, scheduledStart)), 0)}%`
                    }}
                  />

                  {/* Extra segments */}
                  {actualStart < scheduledStart && (
                    <div
                      className="absolute top-5.5 h-3.5 bg-amber-400/80 rounded-l"
                      style={{ left: `${pct(actualStart)}%`, width: `${pct(scheduledStart) - pct(actualStart)}%` }}
                    />
                  )}
                  {actualEnd > scheduledEnd && (
                    <div
                      className="absolute top-5.5 h-3.5 bg-amber-400/80 rounded-r"
                      style={{ left: `${pct(scheduledEnd)}%`, width: `${pct(actualEnd) - pct(scheduledEnd)}%` }}
                    />
                  )}
                  {actualStart > scheduledStart && (
                    <div
                      className="absolute top-5.5 h-3.5 bg-destructive/40 rounded-l border border-dashed border-destructive/60"
                      style={{ left: `${pct(scheduledStart)}%`, width: `${pct(actualStart) - pct(scheduledStart)}%` }}
                    />
                  )}
                  {actualEnd < scheduledEnd && (
                    <div
                      className="absolute top-5.5 h-3.5 bg-destructive/40 rounded-r border border-dashed border-destructive/60"
                      style={{ left: `${pct(actualEnd)}%`, width: `${pct(scheduledEnd) - pct(actualEnd)}%` }}
                    />
                  )}

                  {/* Time labels */}
                  <span className="absolute -bottom-4 text-[9px] text-muted-foreground" style={{ left: `${pct(actualStart)}%` }}>
                    {minutesToTime(actualStart)}
                  </span>
                  <span className="absolute -bottom-4 text-[9px] text-muted-foreground" style={{ left: `${pct(actualEnd)}%`, transform: 'translateX(-100%)' }}>
                    {minutesToTime(actualEnd)}
                  </span>
                </>
              )}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-5 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1"><div className="w-3 h-2 rounded bg-primary/25 border border-primary/30" /> Scheduled</div>
              <div className="flex items-center gap-1"><div className="w-3 h-2 rounded bg-emerald-500/80" /> On Time</div>
              <div className="flex items-center gap-1"><div className="w-3 h-2 rounded bg-amber-400/80" /> Extra Time</div>
              <div className="flex items-center gap-1"><div className="w-3 h-2 rounded bg-destructive/40 border border-dashed border-destructive/60" /> Missing</div>
            </div>
          </div>

          {/* Discrepancy Segments */}
          {segments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Discrepancy Segments</p>
              <div className="space-y-2">
                {segments.map((seg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-between rounded-lg border p-3 transition-colors",
                      seg.paid ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800" : "bg-card border-border"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("p-1.5 rounded-md bg-muted", segmentTypeColor(seg.type))}>
                        {segmentTypeIcon(seg.type)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{seg.label}</p>
                        <p className="text-xs text-muted-foreground">{seg.description}</p>
                        <p className="text-xs font-mono text-muted-foreground mt-0.5">
                          {seg.timeRange} ({formatDuration(seg.durationMinutes)})
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Label htmlFor={`pay-${i}`} className={cn(
                        "text-xs font-medium",
                        seg.paid ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"
                      )}>
                        {seg.paid ? 'Paid' : 'Unpaid'}
                      </Label>
                      <Switch
                        id={`pay-${i}`}
                        checked={seg.paid}
                        onCheckedChange={() => togglePaid(i)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {segments.length === 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No discrepancy segments found for this shift.
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="review-notes" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Notes (optional)
            </Label>
            <Textarea
              id="review-notes"
              placeholder="Add any notes about this approval..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-16 text-sm resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={segments.length === 0}>
            <Check className="w-4 h-4 mr-2" />
            {tr?.approval_status === 'reviewed' ? 'Update Review' : 'Approve & Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Helper used externally
const formatDurationExt = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

export default DiscrepancyReviewDialog;
