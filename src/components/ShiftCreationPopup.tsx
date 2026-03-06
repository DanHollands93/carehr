
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Clock, AlertTriangle, Check, RotateCcw } from "lucide-react";
import { useCareerHistory } from "@/hooks/useCareerHistory";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserCompanyId } from "@/hooks/useUserCompanyId";
import { cn } from "@/lib/utils";

interface ShiftTemplate {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  color: string;
  position: string;
  pay_value?: number;
}

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

interface Shift {
  id: string;
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  position: string;
  job_role_id: string;
  time_record?: TimeRecord | null;
}

interface JobRole {
  id: string;
  title: string;
  department: string;
  location: string;
}

interface ShiftCreationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateShift: (shiftData: {
    start_time: string;
    end_time: string;
    position: string;
    job_role_id: string;
    pay_rate: number;
  }) => void;
  onDeleteShift?: () => void;
  onReviewDiscrepancy?: (shift: Shift) => void;
  onRemoveReview?: (recordId: string) => void;
  onManualClock?: (shiftId: string, recordId: string | null, type: 'clock_in' | 'clock_out', dateTime: string) => void;
  shiftTemplates: ShiftTemplate[];
  employeeName: string;
  employeeId?: string;
  date: string;
  existingShift?: Shift;
}

const ShiftCreationPopup = ({
  isOpen,
  onClose,
  onCreateShift,
  onDeleteShift,
  onReviewDiscrepancy,
  onRemoveReview,
  onManualClock,
  shiftTemplates,
  employeeName,
  employeeId,
  date,
  existingShift
}: ShiftCreationPopupProps) => {
  const { toast } = useToast();
  const { companyId } = useUserCompanyId();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [selectedCareerHistoryId, setSelectedCareerHistoryId] = useState<string>('');

  // Use career history hook
  const { data: careerHistory, isLoading: careerLoading, error: careerError } = useCareerHistory(employeeId);

  // Fetch all job roles to match against career history
  const { data: jobRoles, isLoading: jobRolesLoading } = useQuery({
    queryKey: ['job-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_roles')
        .select('*')
        .order('title');
      
      if (error) throw error;
      return data as JobRole[];
    }
  });

  console.log('ShiftCreationPopup - Employee ID:', employeeId);
  console.log('ShiftCreationPopup - Career History:', careerHistory);
  console.log('ShiftCreationPopup - Job Roles:', jobRoles);
  console.log('ShiftCreationPopup - Loading:', careerLoading);
  console.log('ShiftCreationPopup - Error:', careerError);

  useEffect(() => {
    if (existingShift) {
      setStartTime(existingShift.start_time);
      setEndTime(existingShift.end_time);
      
      // Find matching career history entry by job_role_id or position
      if (careerHistory && careerHistory.length > 0) {
        const matchByJobRoleId = careerHistory.find(entry => 
          entry.job_role_id === existingShift.job_role_id
        );
        const matchByTitle = careerHistory.find(entry => 
          entry.job_title === existingShift.position
        );
        const match = matchByJobRoleId || matchByTitle;
        if (match) {
          setSelectedCareerHistoryId(match.id);
        } else if (careerHistory.length === 1) {
          setSelectedCareerHistoryId(careerHistory[0].id);
        }
      }
      
      // Find matching template
      const matchingTemplate = shiftTemplates.find(t => 
        t.start_time === existingShift.start_time &&
        t.end_time === existingShift.end_time &&
        t.position === existingShift.position
      );
      if (matchingTemplate) {
        setSelectedTemplate(matchingTemplate.id);
      }
    } else {
      // Reset form for new shift
      setSelectedTemplate('');
      setStartTime('09:00');
      setEndTime('17:00');
      setSelectedCareerHistoryId('');
      
      // Auto-select career history if employee has only one active position
      if (careerHistory && careerHistory.length === 1) {
        setSelectedCareerHistoryId(careerHistory[0].id);
      }
    }
  }, [existingShift, shiftTemplates, isOpen, careerHistory]);

  const handleTemplateSelect = (templateId: string) => {
    const template = shiftTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setStartTime(template.start_time);
      setEndTime(template.end_time);
    }
  };

  const findBestJobRoleMatch = (careerEntry: any, jobRoles: JobRole[]) => {
    // First, try exact match by job_role_id if it exists
    if (careerEntry.job_role_id) {
      const exactMatch = jobRoles.find(role => role.id === careerEntry.job_role_id);
      if (exactMatch) {
        console.log('Found exact job_role_id match:', exactMatch);
        return exactMatch;
      }
    }

    // Try exact title and location match
    let match = jobRoles.find(role => 
      role.title === careerEntry.job_title && 
      role.location === careerEntry.location
    );
    
    if (match) {
      console.log('Found exact title + location match:', match);
      return match;
    }

    // Try just title match (most flexible)
    match = jobRoles.find(role => role.title === careerEntry.job_title);
    
    if (match) {
      console.log('Found title-only match:', match);
      return match;
    }

    console.log('No job role match found for:', careerEntry.job_title, careerEntry.location);
    return null;
  };

  const handleSubmit = async () => {
    console.log('Submit clicked');
    console.log('Selected career history ID:', selectedCareerHistoryId);
    
    if (!startTime || !endTime || !selectedCareerHistoryId) {
      console.log('Missing required fields:', { startTime, endTime, selectedCareerHistoryId });
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Find the selected career history entry
    const selectedCareerEntry = careerHistory?.find(entry => entry.id === selectedCareerHistoryId);
    console.log('Selected career entry:', selectedCareerEntry);
    
    if (!selectedCareerEntry) {
      console.log('No selected career entry found for ID:', selectedCareerHistoryId);
      toast({
        title: "Error",
        description: "Selected career history entry not found",
        variant: "destructive"
      });
      return;
    }

    // Find the best matching job role, or auto-create from career entry title
    let matchingJobRole = findBestJobRoleMatch(selectedCareerEntry, jobRoles || []);
    
    if (!matchingJobRole) {
      console.log('No matching job role found, auto-creating for:', selectedCareerEntry.job_title);
      try {
        const { data: newRole, error } = await supabase
          .from('job_roles')
          .insert([{ title: selectedCareerEntry.job_title, company_id: companyId || undefined }])
          .select()
          .single();
        
        if (error || !newRole) {
          console.error('Failed to auto-create job role:', error);
          toast({
            title: "Job Role Not Found",
            description: `Could not find or create job role for "${selectedCareerEntry.job_title}". Please check your lookup lists.`,
            variant: "destructive"
          });
          return;
        }
        matchingJobRole = newRole;
      } catch (err) {
        console.error('Error auto-creating job role:', err);
        toast({
          title: "Error",
          description: "Failed to create job role automatically.",
          variant: "destructive"
        });
        return;
      }
    }

    const shiftData = {
      start_time: startTime,
      end_time: endTime,
      position: selectedCareerEntry.job_title,
      job_role_id: matchingJobRole.id,
      pay_rate: selectedCareerEntry.pay_rate || 0
    };
    
    console.log('Creating shift with data:', shiftData);
    
    try {
      onCreateShift(shiftData);
      toast({
        title: "Success",
        description: "Shift created successfully"
      });
    } catch (error) {
      console.error('Error creating shift:', error);
      toast({
        title: "Error",
        description: "Failed to create shift. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    setSelectedTemplate('');
    setStartTime('09:00');
    setEndTime('17:00');
    setSelectedCareerHistoryId('');
    onClose();
  };

  const selectedCareerEntry = careerHistory?.find(entry => entry.id === selectedCareerHistoryId);
  const isLoading = careerLoading || jobRolesLoading;

  const hasTimeRecord = !!existingShift?.time_record; // Show tab if any time_clock_record exists (including no-shows)
  const [activeTab, setActiveTab] = useState<'shift' | 'timeclock'>('shift');
  const [manualClockMode, setManualClockMode] = useState<'clock_in' | 'clock_out' | null>(null);
  const [manualDate, setManualDate] = useState(date);
  const [manualTime, setManualTime] = useState('');

  // Reset tab when dialog opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('shift');
      setManualClockMode(null);
      setManualDate(date);
      setManualTime('');
    }
  }, [isOpen, date]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {existingShift ? 'Edit Shift' : 'Create Shift'} - {employeeName}
          </DialogTitle>
          <div className="text-sm text-muted-foreground">Date: {date}</div>
        </DialogHeader>

        {/* Tabs - show when there's time clock data OR manual clock is available */}
        {(hasTimeRecord || (existingShift && onManualClock)) && (
          <div className="flex border-b border-border">
            <button
              className={cn(
                "flex-1 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === 'shift'
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab('shift')}
            >
              Shift Details
            </button>
            <button
              className={cn(
                "flex-1 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === 'timeclock'
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab('timeclock')}
            >
              <span className="flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Time Clock
                {existingShift?.time_record?.status === 'discrepancy' && existingShift?.time_record?.approval_status !== 'reviewed' && (
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                )}
                {existingShift?.time_record?.approval_status === 'reviewed' && (
                  <Check className="w-3 h-3 text-emerald-600" />
                )}
              </span>
            </button>
          </div>
        )}
        
        <div className="overflow-y-auto flex-1">
          {/* SHIFT DETAILS TAB */}
          {(activeTab === 'shift' || (!hasTimeRecord && !(existingShift && onManualClock))) && (
            <div className="space-y-4 py-1">
              {/* Template Selection */}
              <div className="space-y-2">
                <Label>Shift Template (Optional)</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template or create custom" />
                  </SelectTrigger>
                  <SelectContent>
                    {shiftTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} ({template.start_time} - {template.end_time})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isLoading && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  Loading employee career history and job roles...
                </div>
              )}

              {careerError && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                  Error loading career history: {careerError.message}
                </div>
              )}

              {!isLoading && careerHistory && careerHistory.length > 0 && (
                <div className="space-y-2">
                  <Label>Job Position * (From Career History)</Label>
                  <Select value={selectedCareerHistoryId} onValueChange={setSelectedCareerHistoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job position" />
                    </SelectTrigger>
                    <SelectContent>
                      {careerHistory.map((entry) => (
                        <SelectItem key={entry.id} value={entry.id}>
                          {entry.job_title} - {entry.location} - £{entry.pay_rate.toFixed(2)}/hr
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCareerEntry && (
                    <div className="text-sm text-muted-foreground bg-accent/50 p-2 rounded">
                      <strong>Position:</strong> {selectedCareerEntry.job_title}
                      <br />
                      <strong>Location:</strong> {selectedCareerEntry.location}
                      <br />
                      <strong>Pay Rate:</strong> £{selectedCareerEntry.pay_rate.toFixed(2)}/hr ({selectedCareerEntry.currency})
                      <br />
                      <strong>Employment Type:</strong> {selectedCareerEntry.employment_type}
                      <br />
                      <strong>Contract Type:</strong> {selectedCareerEntry.contract_type}
                      {selectedCareerEntry.job_role_id ? (
                        <><br /><strong>Status:</strong> <span className="text-emerald-600">Linked to job role</span></>
                      ) : (
                        <><br /><strong>Status:</strong> <span className="text-amber-600">Will auto-match to job role by title</span></>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!isLoading && (!careerHistory || careerHistory.length === 0) && employeeId && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                  This employee has no active career history entries. Please add a career history entry before creating shifts.
                </div>
              )}

              {!employeeId && (
                <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded">
                  Employee ID not provided. Career history selection unavailable.
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <div>
                  {existingShift && onDeleteShift && (
                    <Button variant="destructive" onClick={onDeleteShift} size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleClose}>Cancel</Button>
                  <Button onClick={handleSubmit} disabled={!startTime || !endTime || !selectedCareerHistoryId || isLoading}>
                    {existingShift ? 'Update' : 'Create'} Shift
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TIME CLOCK TAB */}
          {activeTab === 'timeclock' && hasTimeRecord && (() => {
            const tr = existingShift!.time_record!;
            const isDiscrepancy = tr.status === 'discrepancy' || (tr.status === 'completed' && tr.discrepancy_type);
            const isCompleted = tr.status === 'completed' && !tr.discrepancy_type;
            const isClockedIn = tr.status === 'clocked_in';
            const isReviewed = tr.approval_status === 'reviewed';
            const isNoShow = tr.discrepancy_type === 'did_not_clock_in' && !tr.clock_in_time;
            const hasClockedData = !!(tr.clock_in_time || tr.clock_out_time);
            
            const fmtClock = (iso: string) => {
              const d = new Date(iso);
              return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
            };

            const toMins = (t: string): number => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
            const isoMins = (iso: string): number => { const d = new Date(iso); return d.getHours() * 60 + d.getMinutes(); };
            const mToTime = (mins: number): string => `${Math.floor(mins / 60).toString().padStart(2, '0')}:${(mins % 60).toString().padStart(2, '0')}`;
            const fmtDur = (mins: number) => { const h = Math.floor(mins / 60); const m = mins % 60; return h > 0 && m > 0 ? `${h}h ${m}m` : h > 0 ? `${h}h` : `${m}m`; };

            const sStart = toMins(existingShift!.start_time);
            const sEnd = toMins(existingShift!.end_time);
            const aStart = tr.clock_in_time ? isoMins(tr.clock_in_time) : sStart;
            const aEnd = tr.clock_out_time ? isoMins(tr.clock_out_time) : sEnd;
            const wStart = Math.min(sStart, aStart);
            const wEnd = Math.max(sEnd, aEnd);
            const wDur = wEnd - wStart || 1;
            const pct = (m: number) => ((m - wStart) / wDur) * 100;

            const earlyPaid = tr.early_minutes_paid || 0;
            const latePaid = tr.late_minutes_paid || 0;

            interface Seg { type: 'early_start' | 'late_start' | 'early_end' | 'late_end' | 'no_show'; label: string; desc: string; range: string; dur: number; paid: boolean; }
            const segs: Seg[] = [];

            if (isNoShow) {
              const d = sEnd - sStart;
              segs.push({ type: 'no_show', label: 'Did Not Clock In', desc: `Employee did not clock in for the entire shift`, range: `${mToTime(sStart)} → ${mToTime(sEnd)}`, dur: d, paid: false });
            } else if (hasClockedData) {
              // Track consumed paid minutes for multi-segment accuracy
              let earlyRemain = earlyPaid;
              let lateRemain = latePaid;

              if (tr.clock_in_time && aStart < sStart) {
                const d = sStart - aStart;
                const p = isReviewed && earlyRemain >= d;
                if (p) earlyRemain -= d;
                segs.push({ type: 'early_start', label: 'Early Clock In', desc: `Clocked in ${fmtDur(d)} before shift`, range: `${mToTime(aStart)} → ${mToTime(sStart)}`, dur: d, paid: p });
              }
              if (tr.clock_in_time && aStart > sStart + 5) {
                const d = aStart - sStart;
                const p = isReviewed && lateRemain >= d;
                if (p) lateRemain -= d;
                segs.push({ type: 'late_start', label: 'Late Clock In', desc: `Clocked in ${fmtDur(d)} after shift started`, range: `${mToTime(sStart)} → ${mToTime(aStart)}`, dur: d, paid: p });
              }
              if (tr.clock_out_time && aEnd < sEnd - 5) {
                const d = sEnd - aEnd;
                const p = isReviewed && lateRemain >= d;
                if (p) lateRemain -= d;
                segs.push({ type: 'early_end', label: 'Early Clock Out', desc: `Clocked out ${fmtDur(d)} before shift ended`, range: `${mToTime(aEnd)} → ${mToTime(sEnd)}`, dur: d, paid: p });
              }
              if (tr.clock_out_time && aEnd > sEnd) {
                const d = aEnd - sEnd;
                const p = isReviewed && earlyRemain >= d;
                if (p) earlyRemain -= d;
                segs.push({ type: 'late_end', label: 'Late Clock Out', desc: `Clocked out ${fmtDur(d)} after shift ended`, range: `${mToTime(sEnd)} → ${mToTime(aEnd)}`, dur: d, paid: p });
              }
            }

            const segIcon = (t: Seg['type']) => {
              if (t === 'no_show') return <AlertTriangle className="w-4 h-4" />;
              return (t === 'early_start' || t === 'late_end') ? <Clock className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />;
            };
            const segColor = (t: Seg['type']) => {
              if (t === 'no_show') return 'text-destructive';
              return (t === 'early_start' || t === 'late_end') ? 'text-amber-600' : 'text-destructive';
            };

            return (
              <div className="space-y-4 py-1">
                {/* Status badge */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Status</span>
                  <Badge variant="outline" className={cn(
                    "text-xs",
                    isNoShow && "border-destructive text-destructive",
                    isDiscrepancy && !isNoShow && !isReviewed && "border-amber-300 text-amber-700",
                    isDiscrepancy && isReviewed && "border-emerald-300 text-emerald-700",
                    isCompleted && "border-emerald-300 text-emerald-700",
                    isClockedIn && "border-amber-300 text-amber-700"
                  )}>
                    {isNoShow ? 'No Show' : isDiscrepancy && isReviewed ? (tr.notes?.includes('Auto-approved') ? 'Auto Reviewed' : 'Reviewed') : isDiscrepancy ? 'Discrepancy' : isCompleted ? 'Completed' : 'Clocked In'}
                  </Badge>
                </div>

                {/* Clock times */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={cn("rounded-lg p-3", isNoShow ? "bg-destructive/10" : "bg-muted/50")}>
                    <span className="text-muted-foreground text-xs">Clock In</span>
                    <p className={cn("font-mono text-lg font-semibold", isNoShow ? "text-destructive" : "text-foreground")}>
                      {tr.clock_in_time ? fmtClock(tr.clock_in_time) : isNoShow ? 'Missing' : '—'}
                    </p>
                    {tr.notes?.includes('Manual clock in') && (
                      <span className="text-[10px] text-amber-600 font-medium">✎ Manually entered</span>
                    )}
                  </div>
                  <div className={cn("rounded-lg p-3", isNoShow ? "bg-destructive/10" : "bg-muted/50")}>
                    <span className="text-muted-foreground text-xs">Clock Out</span>
                    <p className={cn("font-mono text-lg font-semibold", isNoShow ? "text-destructive" : "text-foreground")}>
                      {tr.clock_out_time ? fmtClock(tr.clock_out_time) : isNoShow ? 'Missing' : isClockedIn ? 'Active' : '—'}
                    </p>
                    {tr.notes?.includes('Manual clock out') && (
                      <span className="text-[10px] text-amber-600 font-medium">✎ Manually entered</span>
                    )}
                  </div>
                </div>

                {/* Manual Clock In/Out Buttons */}
                {onManualClock && (
                  <div className="space-y-3">
                    {!tr.clock_in_time && manualClockMode !== 'clock_in' && (
                      <Button variant="outline" size="sm" className="w-full border-amber-300 text-amber-700 hover:bg-amber-50" onClick={() => { setManualClockMode('clock_in'); setManualTime(existingShift!.start_time); setManualDate(existingShift!.date); }}>
                        <Clock className="w-3.5 h-3.5 mr-2" />
                        Manual Clock In
                      </Button>
                    )}
                    {tr.clock_in_time && !tr.clock_out_time && manualClockMode !== 'clock_out' && (
                      <Button variant="outline" size="sm" className="w-full border-amber-300 text-amber-700 hover:bg-amber-50" onClick={() => { setManualClockMode('clock_out'); setManualTime(existingShift!.end_time); setManualDate(existingShift!.date); }}>
                        <Clock className="w-3.5 h-3.5 mr-2" />
                        Manual Clock Out
                      </Button>
                    )}

                    {manualClockMode && (
                      <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                            Manual {manualClockMode === 'clock_in' ? 'Clock In' : 'Clock Out'}
                          </p>
                        </div>
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          This will be recorded as a manual entry in the audit log.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Date</Label>
                            <Input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} className="text-sm" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Time</Label>
                            <Input type="time" value={manualTime} onChange={(e) => setManualTime(e.target.value)} className="text-sm" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => setManualClockMode(null)}>
                            Cancel
                          </Button>
                          <Button size="sm" className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" disabled={!manualDate || !manualTime} onClick={() => {
                            const dateTime = `${manualDate}T${manualTime}:00`;
                            onManualClock(existingShift!.id, tr.id, manualClockMode, dateTime);
                            setManualClockMode(null);
                          }}>
                            Confirm {manualClockMode === 'clock_in' ? 'Clock In' : 'Clock Out'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Scheduled reference */}
                <div className="flex items-center justify-between text-sm bg-muted/30 rounded-lg p-2">
                  <span className="text-muted-foreground">Scheduled</span>
                  <span className="font-mono font-medium text-foreground">{existingShift!.start_time} – {existingShift!.end_time}</span>
                </div>

                {/* Visual Timeline */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Timeline</p>
                  <div className="relative h-10 bg-muted rounded-lg overflow-hidden">
                    {/* Scheduled block */}
                    <div className="absolute top-1 h-3.5 bg-primary/25 rounded border border-primary/30" style={{ left: `${pct(sStart)}%`, width: `${pct(sEnd) - pct(sStart)}%` }} />

                    {isNoShow ? (
                      /* No-show: entire shift is missing */
                      <div className="absolute top-5.5 h-3.5 bg-destructive/50 rounded border border-dashed border-destructive/60" style={{ left: `${pct(sStart)}%`, width: `${pct(sEnd) - pct(sStart)}%` }} />
                    ) : hasClockedData ? (
                      <>
                        {/* On-time portion */}
                        <div className="absolute top-5.5 h-3.5 bg-emerald-500/80 rounded" style={{ left: `${pct(Math.max(aStart, sStart))}%`, width: `${Math.max(pct(Math.min(aEnd, sEnd)) - pct(Math.max(aStart, sStart)), 0)}%` }} />
                        {/* Early start */}
                        {aStart < sStart && <div className="absolute top-5.5 h-3.5 bg-amber-400/80 rounded-l" style={{ left: `${pct(aStart)}%`, width: `${pct(sStart) - pct(aStart)}%` }} />}
                        {/* Late end (overtime) */}
                        {aEnd > sEnd && <div className="absolute top-5.5 h-3.5 bg-amber-400/80 rounded-r" style={{ left: `${pct(sEnd)}%`, width: `${pct(aEnd) - pct(sEnd)}%` }} />}
                        {/* Late start (missing) */}
                        {aStart > sStart && <div className="absolute top-5.5 h-3.5 bg-destructive/40 rounded-l border border-dashed border-destructive/60" style={{ left: `${pct(sStart)}%`, width: `${pct(aStart) - pct(sStart)}%` }} />}
                        {/* Early end (missing) */}
                        {aEnd < sEnd && <div className="absolute top-5.5 h-3.5 bg-destructive/40 rounded-r border border-dashed border-destructive/60" style={{ left: `${pct(aEnd)}%`, width: `${pct(sEnd) - pct(aEnd)}%` }} />}
                      </>
                    ) : (
                      /* Scheduled but no data yet */
                      <div className="absolute top-5.5 h-3.5 bg-primary/30 rounded" style={{ left: `${pct(sStart)}%`, width: `${pct(sEnd) - pct(sStart)}%` }} />
                    )}

                    {/* Time labels */}
                    {hasClockedData && (
                      <>
                        <span className="absolute -bottom-4 text-[9px] text-muted-foreground" style={{ left: `${pct(aStart)}%` }}>{mToTime(aStart)}</span>
                        <span className="absolute -bottom-4 text-[9px] text-muted-foreground" style={{ left: `${pct(aEnd)}%`, transform: 'translateX(-100%)' }}>{mToTime(aEnd)}</span>
                      </>
                    )}
                  </div>
                  <div className="flex gap-3 mt-5 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1"><div className="w-3 h-2 rounded bg-primary/25 border border-primary/30" /> Scheduled</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-2 rounded bg-emerald-500/80" /> On Time</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-2 rounded bg-amber-400/80" /> Extra</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-2 rounded bg-destructive/40 border border-dashed border-destructive/60" /> Missing</div>
                  </div>
                </div>

                {/* Discrepancy Segments */}
                {segs.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {isNoShow ? 'Issue' : 'Discrepancy Segments'}
                    </p>
                    <div className="space-y-2">
                      {segs.map((seg, i) => (
                        <div key={i} className={cn(
                          "flex items-center justify-between rounded-lg border p-3 transition-colors",
                          seg.paid ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800" : "bg-card border-border"
                        )}>
                          <div className="flex items-center gap-3">
                            <div className={cn("p-1.5 rounded-md bg-muted", segColor(seg.type))}>{segIcon(seg.type)}</div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{seg.label}</p>
                              <p className="text-xs text-muted-foreground">{seg.desc}</p>
                              <p className="text-xs font-mono text-muted-foreground mt-0.5">{seg.range} ({fmtDur(seg.dur)})</p>
                            </div>
                          </div>
                          <span className={cn("text-xs font-medium shrink-0", seg.paid ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground")}>
                            {seg.paid ? 'Paid' : 'Unpaid'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed without issues */}
                {isCompleted && segs.length === 0 && (
                  <div className="text-center py-3 text-sm text-emerald-600">
                    <Check className="w-5 h-5 mx-auto mb-1" />
                    Shift completed without issues
                  </div>
                )}

                {/* Review notes */}
                {isReviewed && tr.notes && (
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Review Notes</p>
                    <p className="text-sm text-foreground">{tr.notes}</p>
                  </div>
                )}

                {/* Action buttons */}
                {isDiscrepancy && (
                  <div className="flex gap-2 pt-2">
                    {onReviewDiscrepancy && (
                      <Button variant="outline" size="sm" className={cn("flex-1", isReviewed ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50" : "border-amber-300 text-amber-700 hover:bg-amber-50")} onClick={() => onReviewDiscrepancy(existingShift!)}>
                        <AlertTriangle className="w-3.5 h-3.5 mr-2" />
                        {isReviewed ? 'Amend Review' : 'Review Discrepancy'}
                      </Button>
                    )}
                    {isReviewed && onRemoveReview && (
                      <Button variant="outline" size="sm" className="border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => onRemoveReview(tr.id)}>
                        <RotateCcw className="w-3.5 h-3.5 mr-2" />
                        Remove Review
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TIME CLOCK TAB - No time record yet, manual clock available */}
          {activeTab === 'timeclock' && !hasTimeRecord && existingShift && onManualClock && (
            <div className="space-y-4 py-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Status</span>
                <Badge variant="outline" className="text-xs border-muted text-muted-foreground">No Clock Data</Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm bg-muted/30 rounded-lg p-2">
                <span className="text-muted-foreground">Scheduled</span>
                <span className="font-mono font-medium text-foreground">{existingShift.start_time} – {existingShift.end_time}</span>
              </div>

              <div className="space-y-3">
                {manualClockMode !== 'clock_in' && (
                  <Button variant="outline" size="sm" className="w-full border-amber-300 text-amber-700 hover:bg-amber-50" onClick={() => { setManualClockMode('clock_in'); setManualTime(existingShift.start_time); setManualDate(existingShift.date); }}>
                    <Clock className="w-3.5 h-3.5 mr-2" />
                    Manual Clock In
                  </Button>
                )}

                {manualClockMode && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                        Manual Clock In
                      </p>
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      This will be recorded as a manual entry in the audit log.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Date</Label>
                        <Input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} className="text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Time</Label>
                        <Input type="time" value={manualTime} onChange={(e) => setManualTime(e.target.value)} className="text-sm" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setManualClockMode(null)}>
                        Cancel
                      </Button>
                      <Button size="sm" className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" disabled={!manualDate || !manualTime} onClick={() => {
                        const dateTime = `${manualDate}T${manualTime}:00`;
                        onManualClock(existingShift.id, null, 'clock_in', dateTime);
                        setManualClockMode(null);
                      }}>
                        Confirm Clock In
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShiftCreationPopup;
