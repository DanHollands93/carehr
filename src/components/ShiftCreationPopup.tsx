
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Clock, AlertTriangle, Check } from "lucide-react";
import { useCareerHistory } from "@/hooks/useCareerHistory";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  shiftTemplates,
  employeeName,
  employeeId,
  date,
  existingShift
}: ShiftCreationPopupProps) => {
  const { toast } = useToast();
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

  const handleSubmit = () => {
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

    // Find the best matching job role
    const matchingJobRole = findBestJobRoleMatch(selectedCareerEntry, jobRoles || []);
    
    if (!matchingJobRole) {
      console.log('No matching job role found for:', selectedCareerEntry.job_title, selectedCareerEntry.location);
      console.log('Available job roles:', jobRoles);
      
      toast({
        title: "Job Role Not Found",
        description: `No matching job role found for "${selectedCareerEntry.job_title}" at "${selectedCareerEntry.location}". Please ensure a job role exists with matching title.`,
        variant: "destructive"
      });
      return;
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingShift ? 'Edit Shift' : 'Create Shift'} - {employeeName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Date: {date}
          </div>

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

          {/* Loading State */}
          {isLoading && (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              Loading employee career history and job roles...
            </div>
          )}

          {/* Error State */}
          {careerError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              Error loading career history: {careerError.message}
            </div>
          )}

          {/* Career History Selection */}
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
                <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
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
                    <><br /><strong>Status:</strong> <span className="text-green-600">Linked to job role</span></>
                  ) : (
                    <><br /><strong>Status:</strong> <span className="text-orange-600">Will auto-match to job role by title</span></>
                  )}
                </div>
              )}
            </div>
          )}

          {/* No Career History Warning */}
          {!isLoading && (!careerHistory || careerHistory.length === 0) && employeeId && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              This employee has no active career history entries. Please add a career history entry for this employee before creating shifts.
            </div>
          )}

          {/* No Employee ID Warning */}
          {!employeeId && (
            <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded">
              Employee ID not provided. Career history selection unavailable.
            </div>
          )}

          {/* Time Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Time Clock Data */}
          {existingShift?.time_record && (existingShift.time_record.clock_in_time || existingShift.time_record.clock_out_time) && (() => {
            const tr = existingShift.time_record!;
            const isDiscrepancy = tr.status === 'discrepancy';
            const isCompleted = tr.status === 'completed';
            const isClockedIn = tr.status === 'clocked_in';
            const isReviewed = tr.approval_status === 'reviewed';
            
            const formatClockTime = (iso: string) => {
              const d = new Date(iso);
              return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
            };

            const formatDuration = (mins: number) => {
              const h = Math.floor(mins / 60);
              const m = mins % 60;
              if (h > 0 && m > 0) return `${h}h ${m}m`;
              if (h > 0) return `${h}h`;
              return `${m}m`;
            };
            
            return (
              <div className={cn(
                "rounded-lg border p-3 space-y-2",
                isDiscrepancy && !isReviewed && "border-amber-300 bg-amber-50/50 dark:bg-amber-950/10",
                isDiscrepancy && isReviewed && "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/10",
                isCompleted && "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/10",
                isClockedIn && "border-amber-300 bg-amber-50/50 dark:bg-amber-950/10"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Time Clock Data</span>
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-[10px]",
                    isDiscrepancy && !isReviewed && "border-amber-300 text-amber-700",
                    isDiscrepancy && isReviewed && "border-emerald-300 text-emerald-700",
                    isCompleted && "border-emerald-300 text-emerald-700",
                    isClockedIn && "border-amber-300 text-amber-700"
                  )}>
                    {isDiscrepancy && isReviewed ? 'Reviewed' : isDiscrepancy ? 'Discrepancy' : isCompleted ? 'Completed' : 'Clocked In'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Clock In</span>
                    <p className="font-mono font-medium text-foreground">
                      {tr.clock_in_time ? formatClockTime(tr.clock_in_time) : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Clock Out</span>
                    <p className="font-mono font-medium text-foreground">
                      {tr.clock_out_time ? formatClockTime(tr.clock_out_time) : isClockedIn ? 'Active' : '—'}
                    </p>
                  </div>
                </div>

                {/* Show reviewed discrepancy decisions */}
                {isDiscrepancy && isReviewed && (
                  <div className="space-y-1.5 pt-1 border-t border-border/50">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Review Decisions</span>
                    {(tr.early_minutes_paid != null && tr.early_minutes_paid > 0) && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground">Extra time (early/overtime) paid</span>
                        <Badge variant="outline" className="border-emerald-300 text-emerald-700 text-[10px]">
                          <Check className="w-3 h-3 mr-1" />
                          {formatDuration(tr.early_minutes_paid)}
                        </Badge>
                      </div>
                    )}
                    {(tr.early_minutes_paid != null && tr.early_minutes_paid === 0) && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground">Extra time (early/overtime)</span>
                        <Badge variant="outline" className="border-muted text-muted-foreground text-[10px]">Unpaid</Badge>
                      </div>
                    )}
                    {(tr.late_minutes_paid != null && tr.late_minutes_paid > 0) && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground">Missing time paid</span>
                        <Badge variant="outline" className="border-emerald-300 text-emerald-700 text-[10px]">
                          <Check className="w-3 h-3 mr-1" />
                          {formatDuration(tr.late_minutes_paid)}
                        </Badge>
                      </div>
                    )}
                    {(tr.late_minutes_paid != null && tr.late_minutes_paid === 0) && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground">Missing time</span>
                        <Badge variant="outline" className="border-muted text-muted-foreground text-[10px]">Unpaid</Badge>
                      </div>
                    )}
                    {tr.notes && (
                      <div className="text-xs text-muted-foreground italic mt-1">
                        Note: {tr.notes}
                      </div>
                    )}
                  </div>
                )}

                {/* Review/Amend button */}
                {isDiscrepancy && onReviewDiscrepancy && (
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-full mt-1",
                      isReviewed
                        ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        : "border-amber-300 text-amber-700 hover:bg-amber-50"
                    )}
                    onClick={() => onReviewDiscrepancy(existingShift)}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 mr-2" />
                    {isReviewed ? 'Amend Review' : 'Review Discrepancy'}
                  </Button>
                )}
              </div>
            );
          })()}

          <div className="flex justify-between pt-4">
            <div>
              {existingShift && onDeleteShift && (
                <Button
                  variant="destructive"
                  onClick={onDeleteShift}
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!startTime || !endTime || !selectedCareerHistoryId || isLoading}
              >
                {existingShift ? 'Update' : 'Create'} Shift
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShiftCreationPopup;
