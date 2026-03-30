import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useUserCompanyId } from "@/hooks/useUserCompanyId";
import { ChevronLeft, ChevronRight, CalendarIcon, Users, Trash2, Plus, ArrowUpDown, UserPlus, UserMinus, Search, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, addDays, addWeeks, subWeeks } from "date-fns";
import { cn } from "@/lib/utils";
import ShiftCreationPopup from "@/components/ShiftCreationPopup";
import StaffSortingDialog from "@/components/StaffSortingDialog";
import RosterShiftCell from "@/components/RosterShiftCell";
import OrphanedClockRecord, { OrphanedRecord } from "@/components/OrphanedClockRecord";
import DiscrepancyReviewDialog, { DiscrepancyReviewResult } from "@/components/DiscrepancyReviewDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import ActiveRosterTemplates from "@/components/ActiveRosterTemplates";
import { useTimeClockSettings } from "@/hooks/useTimeClockSettings";
import { useRosterSections } from "@/hooks/useRosterSections";
import { useAllocationLocations } from "@/hooks/useAllocationLocations";
import { useDailyAllocations } from "@/hooks/useDailyAllocations";
import AllocationAssignmentDialog from "@/components/AllocationAssignmentDialog";
import { useAbsencesForDateRange, getAbsenceForEmployeeDate, getEffectiveAbsenceTimes } from "@/hooks/useAbsences";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
}

interface ShiftTemplate {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  color: string;
  position: string;
  pay_value: number;
}

interface Shift {
  id: string;
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  position: string;
  job_role_id: string;
  roster_template_id?: string;
  absence_pay_override?: string | null;
}

interface ShiftWithTimeRecord extends Shift {
  time_record?: {
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
  } | null;
}

interface RosterTemplate {
  id: string;
  name: string;
  description: string;
  repeat_type: 'weekly' | 'bi_weekly' | 'monthly' | 'custom';
  repeat_interval: number;
  end_date: string | null;
  is_active: boolean;
  category_id?: string;
  allow_allocations?: boolean;
  location?: string | null;
}

const Roster = () => {
  const { userRole, user } = useAuth();
  const { hasPermission } = usePermissions();
  const { companyId } = useUserCompanyId();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [draggedTemplate, setDraggedTemplate] = useState<ShiftTemplate | null>(null);
  const [draggedShift, setDraggedShift] = useState<Shift | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedRosterTemplate, setSelectedRosterTemplate] = useState<RosterTemplate | null>(null);
  const [showDeleteBin, setShowDeleteBin] = useState(false);
  const [sortBy, setSortBy] = useState<'first_name' | 'last_name' | 'department' | 'custom'>('first_name');
  const [customOrder, setCustomOrder] = useState<string[]>([]);
  const [showSortDialog, setShowSortDialog] = useState(false);
  const [shiftPopup, setShiftPopup] = useState<{
    isOpen: boolean;
    employeeId: string;
    employeeName: string;
    date: string;
    existingShift?: ShiftWithTimeRecord;
  }>({
    isOpen: false,
    employeeId: '',
    employeeName: '',
    date: ''
  });
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddStaffDialog, setShowAddStaffDialog] = useState(false);
  const [staffSearchTerm, setStaffSearchTerm] = useState('');
  const [employeeToRemove, setEmployeeToRemove] = useState<Employee | null>(null);
  const [discrepancyReview, setDiscrepancyReview] = useState<{
    isOpen: boolean;
    shift: ShiftWithTimeRecord | null;
    employeeName: string;
  }>({ isOpen: false, shift: null, employeeName: '' });
  const [allocationDialog, setAllocationDialog] = useState<{
    isOpen: boolean;
    date: string;
    dateLabel: string;
  }>({ isOpen: false, date: '', dateLabel: '' });
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)); // Mon-Sun (7 days)

  // Get employees assigned to the selected roster template
  const { data: rosterEmployees } = useQuery({
    queryKey: ['roster-employees', selectedRosterTemplate?.id],
    queryFn: async () => {
      if (!selectedRosterTemplate?.id) return [];
      
      console.log('Fetching roster employees for template:', selectedRosterTemplate.id);
      
      // Get employees from roster template assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('roster_template_assignments')
        .select(`
          employee_id,
          employees!inner(id, first_name, last_name, department)
        `)
        .eq('roster_template_id', selectedRosterTemplate.id);
      
      if (assignmentsError) {
        console.error('Error fetching roster template assignments:', assignmentsError);
        throw assignmentsError;
      }
      
      console.log('Roster template assignments:', assignmentsData);
      
      if (!assignmentsData || assignmentsData.length === 0) {
        console.log('No employees found for this roster template');
        return [];
      }
      
      // Extract unique employees from assignments
      const uniqueEmployees = new Map<string, Employee>();
      assignmentsData.forEach(assignment => {
        const employeeData = assignment.employees;
        // Check if employeeData is an array or single object
        const employees = Array.isArray(employeeData) ? employeeData : [employeeData];
        
        employees.forEach(emp => {
          if (emp && !uniqueEmployees.has(emp.id)) {
            uniqueEmployees.set(emp.id, {
              id: emp.id,
              first_name: emp.first_name,
              last_name: emp.last_name,
              department: emp.department
            } as Employee);
          }
        });
      });
      
      const result = Array.from(uniqueEmployees.values());
      console.log('Processed roster employees:', result);
      return result;
    },
    enabled: !!selectedRosterTemplate?.id
  });

  // Fetch all employees for the "Add Staff" search
  const { data: allEmployees } = useQuery({
    queryKey: ['all-employees', companyId],
    queryFn: async () => {
      let query = supabase
        .from('employees')
        .select('id, first_name, last_name, department')
        .order('first_name');
      if (companyId) query = query.eq('company_id', companyId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Employee[];
    },
    enabled: showAddStaffDialog && !!companyId
  });

  // Get employee IDs from template assignments to identify "core" vs "ad-hoc"
  const templateEmployeeIds = new Set((rosterEmployees || []).map(e => e.id));

  // Query for ad-hoc employees: those with shifts for this week+template but NOT in template assignments
  const { data: adHocEmployees } = useQuery({
    queryKey: ['adhoc-roster-employees', selectedRosterTemplate?.id, format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!selectedRosterTemplate?.id) return [];
      const startDate = format(weekStart, 'yyyy-MM-dd');
      const endDate = format(addDays(weekStart, 6), 'yyyy-MM-dd');
      
      // Find employee IDs that have shifts for this template+week
      const { data: shiftEmployees, error } = await supabase
        .from('shifts')
        .select('employee_id, employees!inner(id, first_name, last_name, department)')
        .eq('roster_template_id', selectedRosterTemplate.id)
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (error) throw error;
      
      // Filter to only those NOT already in template assignments
      const uniqueAdHoc = new Map<string, Employee>();
      shiftEmployees?.forEach(s => {
        const emp = Array.isArray(s.employees) ? s.employees[0] : s.employees;
        if (emp && !templateEmployeeIds.has(emp.id) && !uniqueAdHoc.has(emp.id)) {
          uniqueAdHoc.set(emp.id, emp as Employee);
        }
      });
      
      return Array.from(uniqueAdHoc.values());
    },
    enabled: !!selectedRosterTemplate?.id
  });

  // Merge roster employees with ad-hoc employees
  const employees = (() => {
    const base = rosterEmployees || [];
    const merged = [...base];
    (adHocEmployees || []).forEach(emp => {
      if (!merged.find(e => e.id === emp.id)) {
        merged.push(emp);
      }
    });
    return merged;
  })();

  // Get all shift templates
  const { data: shiftTemplates } = useQuery({
    queryKey: ['shift-templates', companyId],
    queryFn: async () => {
      let query = supabase
        .from('shift_templates')
        .select('*')
        .order('position, name');
      if (companyId) query = query.eq('company_id', companyId);
      const { data, error } = await query;
      if (error) throw error;
      return data as ShiftTemplate[];
    },
    enabled: !!companyId
  });

  // Get shifts for the selected roster template
  const { data: shifts } = useQuery({
    queryKey: ['shifts', format(weekStart, 'yyyy-MM-dd'), selectedRosterTemplate?.id],
    queryFn: async () => {
      const startDate = format(weekStart, 'yyyy-MM-dd');
      const endDate = format(addDays(weekStart, 6), 'yyyy-MM-dd');
      
      let query = supabase
        .from('shifts')
        .select(`
          *,
          time_clock_records!left(
            id,
            status,
            clock_in_time,
            clock_out_time,
            discrepancy_type,
            approval_status,
            early_minutes_paid,
            late_minutes_paid,
            notes,
            clock_in_photo_url,
            clock_out_photo_url,
            clock_in_latitude,
            clock_in_longitude,
            clock_in_accuracy,
            clock_out_latitude,
            clock_out_longitude,
            clock_out_accuracy,
            discrepancy_reason_id,
            discrepancy_reasons(id, name, is_paid)
          )
        `)
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (selectedRosterTemplate?.id) {
        query = query.eq('roster_template_id', selectedRosterTemplate.id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching shifts:', error);
        throw error;
      }
      
      const result = (data || []).map((shift: any) => ({
        ...shift,
        time_record: shift.time_clock_records?.[0] || null
      })) as ShiftWithTimeRecord[];
      
      return result;
    },
    enabled: !!selectedRosterTemplate?.id
  });

  // Query orphaned time_clock_records (shift_id IS NULL, have clock data) for this week
  const { data: orphanedRecords } = useQuery({
    queryKey: ['orphaned-clock-records', format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const startDate = format(weekStart, 'yyyy-MM-dd');
      const endDate = format(addDays(weekStart, 6), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('time_clock_records')
        .select('*')
        .is('shift_id', null)
        .gte('shift_date', startDate)
        .lte('shift_date', endDate)
        .or('clock_in_time.not.is.null,clock_out_time.not.is.null');
      
      if (error) throw error;
      return (data || []) as OrphanedRecord[];
    },
    enabled: !!selectedRosterTemplate?.id
  });

  const getOrphanedRecordsForEmployeeAndDate = (employeeId: string, date: string) => {
    return orphanedRecords?.filter(r => 
      r.employee_id === employeeId && r.shift_date === date
    ) || [];
  };

  // Try to reattach orphaned clock records when a shift lands on the same employee+date
  const tryReattachOrphanedRecords = async (shiftId: string, employeeId: string, date: string) => {
    const orphaned = orphanedRecords?.filter(r => 
      r.employee_id === employeeId && r.shift_date === date
    ) || [];
    
    for (const record of orphaned) {
      await supabase
        .from('time_clock_records')
        .update({
          shift_id: shiftId,
          status: 'discrepancy',
          discrepancy_type: record.discrepancy_type || 'reattached',
          approval_status: 'pending',
          notes: `${record.notes ? record.notes + ', ' : ''}Reattached to shift after move`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', record.id);
    }
    
    if (orphaned.length > 0) {
      queryClient.invalidateQueries({ queryKey: ['orphaned-clock-records'] });
    }
    
    return orphaned.length;
  };

  // Auto-exception settings
  const {
    earlyClockInMinutes, lateClockInMinutes, earlyClockOutMinutes, lateClockOutMinutes,
    earlyClockInAutoAction, lateClockInAutoAction, earlyClockOutAutoAction, lateClockOutAutoAction,
  } = useTimeClockSettings();

  // Roster sections for grouping employees by shift job roles
  const { sections: rosterSections, roleRules: sectionRoleRules, groupEmployeesByShiftRoles } = useRosterSections(selectedRosterTemplate?.id);

  // Allocation locations & daily allocations
  const { locations: allocationLocations } = useAllocationLocations(selectedRosterTemplate?.id);
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(addDays(weekStart, 6), 'yyyy-MM-dd');
  const { bulkSetAllocations, getAllocationsForDate } = useDailyAllocations(
    selectedRosterTemplate?.id, weekStartStr, weekEndStr
  );

  // Absences for the current week
  const { data: weekAbsences = [] } = useAbsencesForDateRange(weekStartStr, weekEndStr, !!selectedRosterTemplate?.id);

  // Fetch job roles for allocation dialog
  const { data: jobRolesData } = useQuery({
    queryKey: ['job-roles-for-allocations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('job_roles').select('id, title');
      if (error) throw error;
      return data as { id: string; title: string }[];
    }
  });

  // Auto-apply exceptions for discrepancies within threshold
  const autoApplyProcessedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!shifts || !user?.id) return;

    const timeToMinutes = (time: string): number => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };
    const isoToMinutes = (iso: string): number => {
      const d = new Date(iso);
      return d.getHours() * 60 + d.getMinutes();
    };

    const eligibleRecords = shifts.filter(s => {
      const tr = s.time_record;
      if (!tr) return false;
      if (tr.approval_status === 'reviewed') return false;
      if (tr.discrepancy_type === 'did_not_clock_in') return false;
      if (!tr.clock_in_time) return false;
      if (autoApplyProcessedRef.current.has(tr.id)) return false;
      // Only process records with a discrepancy type or status
      return tr.status === 'discrepancy' || !!tr.discrepancy_type;
    });

    if (eligibleRecords.length === 0) return;

    const processAutoExceptions = async () => {
      for (const shift of eligibleRecords) {
        const tr = shift.time_record!;
        const scheduledStart = timeToMinutes(shift.start_time);
        const scheduledEnd = timeToMinutes(shift.end_time);
        const actualStart = isoToMinutes(tr.clock_in_time!);
        const actualEnd = tr.clock_out_time ? isoToMinutes(tr.clock_out_time) : null;

        // Adjust for absences
        const shiftAbsence = getAbsenceForEmployeeDate(weekAbsences, shift.employee_id, shift.date);
        
        // Full-day absence — skip discrepancy processing entirely
        if (shiftAbsence && !shiftAbsence.start_time && !shiftAbsence.end_time) {
          autoApplyProcessedRef.current.add(tr.id);
          continue;
        }
        
        // Get effective times for this specific date (start_time only on first day, end_time only on last day)
        const effectiveAbsTimes = shiftAbsence ? getEffectiveAbsenceTimes(shiftAbsence, shift.date) : null;
        
        // If effective times are both null on an intermediate day, it's a full-day absence
        if (shiftAbsence && !effectiveAbsTimes?.start_time && !effectiveAbsTimes?.end_time) {
          autoApplyProcessedRef.current.add(tr.id);
          continue;
        }
        
        const absEndMin = effectiveAbsTimes?.end_time ? timeToMinutes(effectiveAbsTimes.end_time) : null;
        const absStartMin = effectiveAbsTimes?.start_time ? timeToMinutes(effectiveAbsTimes.start_time) : null;
        const effectiveStart = (absEndMin !== null && absEndMin > scheduledStart && absEndMin < scheduledEnd) ? absEndMin : scheduledStart;
        const effectiveEnd = (absStartMin !== null && absStartMin > scheduledStart && absStartMin < scheduledEnd) ? absStartMin : scheduledEnd;

        let allWithinThreshold = true;
        let earlyMinutesPaid = 0;
        let lateMinutesPaid = 0;

        // Check early clock-in
        if (actualStart < effectiveStart) {
          const diff = effectiveStart - actualStart;
          if (diff <= earlyClockInMinutes) {
            if (earlyClockInAutoAction === 'paid') earlyMinutesPaid += diff;
          } else {
            allWithinThreshold = false;
          }
        }

        // Check late clock-in
        if (actualStart > effectiveStart + 2) {
          const diff = actualStart - effectiveStart;
          if (diff <= lateClockInMinutes) {
            if (lateClockInAutoAction === 'paid') lateMinutesPaid += diff;
          } else {
            allWithinThreshold = false;
          }
        }

        // Check early clock-out
        if (actualEnd !== null && actualEnd < effectiveEnd - 2) {
          const diff = effectiveEnd - actualEnd;
          if (diff <= earlyClockOutMinutes) {
            if (earlyClockOutAutoAction === 'paid') lateMinutesPaid += diff;
          } else {
            allWithinThreshold = false;
          }
        }

        // Check late clock-out
        if (actualEnd !== null && actualEnd > effectiveEnd) {
          const diff = actualEnd - effectiveEnd;
          if (diff <= lateClockOutMinutes) {
            if (lateClockOutAutoAction === 'paid') earlyMinutesPaid += diff;
          } else {
            allWithinThreshold = false;
          }
        }

        // If all discrepancies are within threshold, auto-apply
        if (allWithinThreshold) {
          autoApplyProcessedRef.current.add(tr.id);
          try {
            await supabase
              .from('time_clock_records')
              .update({
                approval_status: 'reviewed',
                status: 'completed',
                approved_by: user.id,
                early_minutes_paid: earlyMinutesPaid,
                late_minutes_paid: lateMinutesPaid,
                notes: 'Auto-approved: within exception threshold',
                updated_at: new Date().toISOString(),
              })
              .eq('id', tr.id);
          } catch (err) {
            console.error('Auto-exception failed for record:', tr.id, err);
          }
        }
      }

      // Refresh shifts after auto-processing
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    };

    processAutoExceptions();
  }, [shifts, user?.id, earlyClockInMinutes, lateClockInMinutes, earlyClockOutMinutes, lateClockOutMinutes,
      earlyClockInAutoAction, lateClockInAutoAction, earlyClockOutAutoAction, lateClockOutAutoAction]);

  // Permission checks
  const canViewRoster = userRole === 'super_admin' || hasPermission('view_roster') || hasPermission('edit_roster');
  const canEditRoster = userRole === 'super_admin' || hasPermission('edit_roster');

  // Helper function to check for time overlaps
  const hasTimeOverlap = (newStart: string, newEnd: string, existingShifts: Shift[], excludeShiftId?: string) => {
    const newStartTime = parseInt(newStart.replace(':', ''));
    const newEndTime = parseInt(newEnd.replace(':', ''));
    
    return existingShifts.some(shift => {
      if (excludeShiftId && shift.id === excludeShiftId) return false;
      
      const existingStartTime = parseInt(shift.start_time.replace(':', ''));
      const existingEndTime = parseInt(shift.end_time.replace(':', ''));
      
      // Check if times overlap
      return (newStartTime < existingEndTime && newEndTime > existingStartTime);
    });
  };

  const createShiftMutation = useMutation({
    mutationFn: async ({ employeeId, date, shiftData }: {
      employeeId: string;
      date: string;
      shiftData: {
        start_time: string;
        end_time: string;
        position: string;
        job_role_id: string;
        pay_rate: number;
        absence_pay_override?: string | null;
      };
    }) => {
      // Fresh DB check for overlapping shifts
      const { data: existingDbShifts, error: checkErr } = await supabase
        .from('shifts')
        .select('id, start_time, end_time')
        .eq('employee_id', employeeId)
        .eq('date', date);
      
      if (checkErr) throw checkErr;
      
      const newStart = parseInt(shiftData.start_time.replace(':', ''));
      const newEnd = parseInt(shiftData.end_time.replace(':', ''));
      const overlap = (existingDbShifts || []).some(s => {
        const sStart = parseInt(s.start_time.replace(':', ''));
        const sEnd = parseInt(s.end_time.replace(':', ''));
        return newStart < sEnd && newEnd > sStart;
      });
      
      if (overlap) {
        throw new Error('This shift overlaps with an existing shift. Please choose different times.');
      }

      const { data: newShift, error } = await supabase
        .from('shifts')
        .insert([{
          employee_id: employeeId,
          date,
          start_time: shiftData.start_time,
          end_time: shiftData.end_time,
          position: shiftData.position,
          job_role_id: shiftData.job_role_id,
          actual_job_role_id: shiftData.job_role_id,
          pay_rate: shiftData.pay_rate,
          roster_template_id: selectedRosterTemplate?.id,
          absence_pay_override: shiftData.absence_pay_override || null,
        }])
        .select()
        .single();
      
      if (error) throw error;

      // Try to reattach any orphaned clock records for this employee+date
      const reattachedCount = await tryReattachOrphanedRecords(newShift.id, employeeId, date);
      return { reattachedCount };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['orphaned-clock-records'] });
      if (result.reattachedCount > 0) {
        toast({ title: `Shift added — ${result.reattachedCount} clock record(s) reattached for review` });
      } else {
        toast({ title: "Shift added successfully" });
      }
    },
    onError: (error) => {
      toast({ 
        title: "Error adding shift", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Move a shift to a different employee/date (drag-drop)
  const updateShiftMutation = useMutation({
    mutationFn: async ({ shiftId, employeeId, date }: {
      shiftId: string;
      employeeId: string;
      date: string;
    }) => {
      // Check if this shift has any time_clock_records with actual clock data
      const { data: clockRecords, error: clockErr } = await supabase
        .from('time_clock_records')
        .select('id, clock_in_time, clock_out_time, shift_date, shift_start_time, shift_end_time')
        .eq('shift_id', shiftId);
      
      if (clockErr) throw clockErr;

      // Get the current shift details to preserve on the detached record
      const currentShift = shifts?.find(s => s.id === shiftId);

      // Detach any clock records that have actual clock data
      const recordsWithClockData = (clockRecords || []).filter(
        r => r.clock_in_time || r.clock_out_time
      );
      
      for (const record of recordsWithClockData) {
        const { error: detachErr } = await supabase
          .from('time_clock_records')
          .update({
            shift_id: null,
            // Preserve the original shift info on the record so it remains useful
            shift_date: record.shift_date || currentShift?.date || null,
            shift_start_time: record.shift_start_time || currentShift?.start_time || null,
            shift_end_time: record.shift_end_time || currentShift?.end_time || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', record.id);
        if (detachErr) throw detachErr;
      }

      // Now move the shift
      const { error } = await supabase
        .from('shifts')
        .update({
          employee_id: employeeId,
          date: format(new Date(date), 'yyyy-MM-dd')
        })
        .eq('id', shiftId);
      
      if (error) throw error;

      // Try to reattach any orphaned clock records at the destination
      const formattedDate = format(new Date(date), 'yyyy-MM-dd');
      const reattachedCount = await tryReattachOrphanedRecords(shiftId, employeeId, formattedDate);
      return { reattachedCount };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['orphaned-clock-records'] });
      if (result.reattachedCount > 0) {
        toast({ title: `Shift moved — ${result.reattachedCount} clock record(s) reattached for review` });
      } else {
        toast({ title: "Shift moved successfully" });
      }
    },
    onError: (error) => {
      toast({ 
        title: "Error moving shift", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Update shift details in-place (preserves time_clock_records)
  const updateShiftDetailsMutation = useMutation({
    mutationFn: async ({ shiftId, shiftData }: {
      shiftId: string;
      shiftData: {
        start_time: string;
        end_time: string;
        position: string;
        job_role_id: string;
        pay_rate: number;
      };
    }) => {
      const { error } = await supabase
        .from('shifts')
        .update({
          start_time: shiftData.start_time,
          end_time: shiftData.end_time,
          position: shiftData.position,
          job_role_id: shiftData.job_role_id,
          actual_job_role_id: shiftData.job_role_id,
          pay_rate: shiftData.pay_rate,
        })
        .eq('id', shiftId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast({ title: "Shift updated successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error updating shift", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async (shiftId: string) => {
      // Check if this shift has any time_clock_records with actual clock data
      const { data: clockRecords, error: clockErr } = await supabase
        .from('time_clock_records')
        .select('id, clock_in_time, clock_out_time')
        .eq('shift_id', shiftId);
      
      if (clockErr) throw clockErr;

      const hasClockData = (clockRecords || []).some(
        r => r.clock_in_time || r.clock_out_time
      );

      if (hasClockData) {
        throw new Error('This shift has clock-in/out records and cannot be deleted. Move it instead to detach the time records.');
      }

      // Safe to delete — also clean up any empty clock records (no clock data)
      if (clockRecords && clockRecords.length > 0) {
        const { error: delClockErr } = await supabase
          .from('time_clock_records')
          .delete()
          .eq('shift_id', shiftId);
        if (delClockErr) throw delClockErr;
      }

      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', shiftId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast({ title: "Shift removed successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error removing shift", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Manual clock in/out mutation
  const manualClockMutation = useMutation({
    mutationFn: async ({ shiftId, recordId, type, dateTime }: {
      shiftId: string;
      recordId: string | null;
      type: 'clock_in' | 'clock_out';
      dateTime: string;
    }) => {
      const isoDateTime = new Date(dateTime).toISOString();

      if (type === 'clock_in') {
        // Detect clock-in discrepancy
        const { data: shiftInfo } = await supabase
          .from('shifts')
          .select('employee_id, date, start_time, end_time')
          .eq('id', shiftId)
          .single();

        let clockInDiscrepancy: string | null = null;
        if (shiftInfo) {
          const clockInDate = new Date(isoDateTime);
          const clockInMinutes = clockInDate.getHours() * 60 + clockInDate.getMinutes();
          const [startH, startM] = shiftInfo.start_time.split(':').map(Number);
          let effectiveStartMinutes = startH * 60 + startM;

          // If there's an absence covering the start of the shift, adjust the effective start
          const dayAbsence = getAbsenceForEmployeeDate(weekAbsences, shiftInfo.employee_id, shiftInfo.date);
          if (dayAbsence) {
            // Full-day absence (no times) — employee not expected at all, skip discrepancy
            if (!dayAbsence.start_time && !dayAbsence.end_time) {
              // No clock-in discrepancy for full-day absence
              clockInDiscrepancy = null;
            } else if (dayAbsence.end_time) {
              const [absEndH, absEndM] = dayAbsence.end_time.split(':').map(Number);
              const absEndMinutes = absEndH * 60 + absEndM;
              // If absence ends after shift start but before shift end, the employee is expected at absence end time
              if (absEndMinutes > effectiveStartMinutes) {
                effectiveStartMinutes = absEndMinutes;
              }
            }
            // If absence starts during the shift (e.g. sick from 15:00), clock-in is still at shift start — no change needed
          }

          const diffMinutes = clockInMinutes - effectiveStartMinutes;

          if (diffMinutes < -5) {
            clockInDiscrepancy = 'early_clock_in';
          } else if (diffMinutes > 5) {
            clockInDiscrepancy = 'late_clock_in';
          }
        }

        const clockInStatus = clockInDiscrepancy ? 'discrepancy' : 'clocked_in';

        if (recordId) {
          const { error } = await supabase
            .from('time_clock_records')
            .update({
              clock_in_time: isoDateTime,
              status: clockInStatus,
              discrepancy_type: clockInDiscrepancy,
              notes: `Manual clock in by manager (${new Date().toISOString()})`,
              updated_at: new Date().toISOString(),
            })
            .eq('id', recordId);
          if (error) throw error;
        } else {
          // Check if there's an active absence for this employee/date
          const dayAbsence = shiftInfo ? getAbsenceForEmployeeDate(weekAbsences, shiftInfo.employee_id, shiftInfo.date) : null;

          const { error } = await supabase
            .from('time_clock_records')
            .insert({
              employee_id: shiftInfo!.employee_id,
              shift_id: shiftId,
              shift_date: shiftInfo!.date,
              shift_start_time: shiftInfo!.start_time,
              shift_end_time: shiftInfo!.end_time,
              clock_in_time: isoDateTime,
              status: clockInStatus,
              discrepancy_type: clockInDiscrepancy,
              notes: `Manual clock in by manager (${new Date().toISOString()})`,
              absence_id: dayAbsence?.id || null,
            });
          if (error) throw error;
        }
      } else {
        if (!recordId) throw new Error('Cannot clock out without existing record');
        // Get existing record to check for discrepancies
        const { data: existing } = await supabase
          .from('time_clock_records')
          .select('notes, clock_in_time, discrepancy_type, shift_start_time, shift_end_time')
          .eq('id', recordId)
          .single();
        const existingNotes = existing?.notes || '';
        const newNote = `Manual clock out by manager (${new Date().toISOString()})`;
        const combinedNotes = existingNotes ? `${existingNotes}, ${newNote}` : newNote;

        // Get shift times to detect discrepancies
        const { data: shiftData } = await supabase
          .from('shifts')
          .select('start_time, end_time')
          .eq('id', shiftId)
          .single();

        let newStatus: string = 'completed';
        let discrepancyType = existing?.discrepancy_type || null;
        const clockOutDate = new Date(isoDateTime);
        const clockOutMinutes = clockOutDate.getHours() * 60 + clockOutDate.getMinutes();

        if (shiftData) {
          const [endH, endM] = shiftData.end_time.split(':').map(Number);
          let effectiveEndMinutes = endH * 60 + endM;

          // If there's an absence covering the end of the shift, adjust the effective end
          const { data: shiftFullData } = await supabase
            .from('shifts')
            .select('employee_id, date')
            .eq('id', shiftId)
            .single();
          if (shiftFullData) {
            const dayAbsence = getAbsenceForEmployeeDate(weekAbsences, shiftFullData.employee_id, shiftFullData.date);
            if (dayAbsence) {
              // Full-day absence — no clock-out discrepancy
              if (!dayAbsence.start_time && !dayAbsence.end_time) {
                // Skip discrepancy detection entirely
                discrepancyType = existing?.discrepancy_type || null;
                newStatus = discrepancyType ? 'discrepancy' : 'completed';
              } else if (dayAbsence.start_time) {
                const [absStartH, absStartM] = dayAbsence.start_time.split(':').map(Number);
                const absStartMinutes = absStartH * 60 + absStartM;
                // If absence starts before shift end but after shift start, effective end is absence start
                if (absStartMinutes < effectiveEndMinutes) {
                  effectiveEndMinutes = absStartMinutes;
                }
              }
            }
          }

          const diffMinutes = clockOutMinutes - effectiveEndMinutes;

          // Check for early clock-out (more than 5 min early)
          if (diffMinutes < -5) {
            newStatus = 'discrepancy';
            discrepancyType = discrepancyType
              ? `${discrepancyType},early_clock_out`
              : 'early_clock_out';
          }
          // Check for late clock-out (more than 5 min late)
          else if (diffMinutes > 5) {
            newStatus = 'discrepancy';
            discrepancyType = discrepancyType
              ? `${discrepancyType},late_clock_out`
              : 'late_clock_out';
          }
        }

        const { error } = await supabase
          .from('time_clock_records')
          .update({
            clock_out_time: isoDateTime,
            status: newStatus,
            discrepancy_type: discrepancyType,
            notes: combinedNotes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', recordId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast({ title: "Manual clock entry recorded" });
      setShiftPopup(prev => ({ ...prev, isOpen: false }));
    },
    onError: (error) => {
      toast({ title: "Error recording manual clock", description: error.message, variant: "destructive" });
    }
  });

  // Add ad-hoc staff: create a roster_template_assignment so they persist
  const addAdHocStaffMutation = useMutation({
    mutationFn: async (employee: Employee) => {
      if (!selectedRosterTemplate?.id) throw new Error('No roster template selected');
      const { error } = await supabase
        .from('roster_template_assignments')
        .insert([{
          roster_template_id: selectedRosterTemplate.id,
          employee_id: employee.id,
          day_of_period: -1, // marker for ad-hoc assignment
        }]);
      if (error) throw error;
      return employee;
    },
    onSuccess: (employee) => {
      queryClient.invalidateQueries({ queryKey: ['roster-employees'] });
      queryClient.invalidateQueries({ queryKey: ['adhoc-roster-employees'] });
      toast({ title: `${employee.first_name} ${employee.last_name} added to roster` });
    },
    onError: (error) => {
      toast({ title: "Error adding staff", description: error.message, variant: "destructive" });
    }
  });

  // Remove ad-hoc staff: delete their shifts for this week and their ad-hoc assignment
  const removeAdHocStaffMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      if (!selectedRosterTemplate?.id) throw new Error('No roster template selected');
      const startDate = format(weekStart, 'yyyy-MM-dd');
      const endDate = format(addDays(weekStart, 6), 'yyyy-MM-dd');
      
      // Delete shifts for this employee in this week for this template
      await supabase
        .from('shifts')
        .delete()
        .eq('employee_id', employeeId)
        .eq('roster_template_id', selectedRosterTemplate.id)
        .gte('date', startDate)
        .lte('date', endDate);

      // Remove ad-hoc assignment (day_of_period = -1)
      await supabase
        .from('roster_template_assignments')
        .delete()
        .eq('roster_template_id', selectedRosterTemplate.id)
        .eq('employee_id', employeeId)
        .eq('day_of_period', -1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['roster-employees'] });
      queryClient.invalidateQueries({ queryKey: ['adhoc-roster-employees'] });
      toast({ title: 'Staff removed from roster' });
    },
    onError: (error) => {
      toast({ title: "Error removing staff", description: error.message, variant: "destructive" });
    }
  });

  // Update absence pay override on a shift
  const updateAbsencePayOverrideMutation = useMutation({
    mutationFn: async ({ shiftId, override }: { shiftId: string; override: string | null }) => {
      const { error } = await supabase
        .from('shifts')
        .update({ absence_pay_override: override })
        .eq('id', shiftId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast({ title: "Pay override updated" });
    },
    onError: (error) => {
      toast({ title: "Error updating pay override", description: error.message, variant: "destructive" });
    }
  });

  const getShiftStatusColor = (shift: ShiftWithTimeRecord) => {
    if (!shift.time_record) return null;
    
    switch (shift.time_record.status) {
      case 'scheduled':
        return '#9CA3AF';
      case 'clocked_in':
        return '#F59E0B';
      case 'completed':
        return '#10B981';
      case 'discrepancy':
        return '#EF4444';
      default:
        return null;
    }
  };

  const getShiftStatusText = (shift: ShiftWithTimeRecord) => {
    if (!shift.time_record) return '';
    
    switch (shift.time_record.status) {
      case 'scheduled':
        return 'Scheduled';
      case 'clocked_in':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'discrepancy':
        return 'Needs Review';
      default:
        return '';
    }
  };

  // Submit a full discrepancy review with per-segment paid/unpaid decisions
  const submitDiscrepancyReviewMutation = useMutation({
    mutationFn: async (result: DiscrepancyReviewResult) => {
      // Calculate paid/unpaid minutes from segments
      const earlyMinutesPaid = result.segments
        .filter(s => (s.type === 'early_start' || s.type === 'late_end') && s.paid)
        .reduce((sum, s) => sum + s.durationMinutes, 0);
      const lateMinutesPaid = result.segments
        .filter(s => (s.type === 'late_start' || s.type === 'early_end') && s.paid)
        .reduce((sum, s) => sum + s.durationMinutes, 0);

      const updateData: Record<string, any> = {
        approval_status: 'reviewed',
        status: 'completed',
        approved_by: user?.id,
        early_minutes_paid: earlyMinutesPaid,
        late_minutes_paid: lateMinutesPaid,
        notes: result.notes || null,
        updated_at: new Date().toISOString(),
      };

      // Save discrepancy reason if provided
      if (result.discrepancyReasonId) {
        updateData.discrepancy_reason_id = result.discrepancyReasonId;
      }

      const { error } = await supabase
        .from('time_clock_records')
        .update(updateData)
        .eq('id', result.recordId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setDiscrepancyReview({ isOpen: false, shift: null, employeeName: '' });
      toast({ title: "Discrepancy reviewed and approved" });
    },
    onError: (error) => {
      toast({ 
        title: "Error submitting review", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Remove a discrepancy review, resetting back to discrepancy/pending
  const removeReviewMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await supabase
        .from('time_clock_records')
        .update({
          approval_status: 'pending',
          status: 'discrepancy',
          approved_by: null,
          early_minutes_paid: 0,
          late_minutes_paid: 0,
          notes: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setShiftPopup(prev => ({ ...prev, isOpen: false }));
      toast({ title: "Review removed — discrepancy needs re-review" });
    },
    onError: (error) => {
      toast({ title: "Error removing review", description: error.message, variant: "destructive" });
    }
  });

  const handleDragStart = (template: ShiftTemplate) => {
    if (!canEditRoster || isMobile) return;
    setDraggedTemplate(template);
    setDraggedShift(null);
    setShowDeleteBin(false);
  };

  const handleShiftDragStart = (shift: Shift) => {
    if (!canEditRoster || isMobile) return;
    setDraggedShift(shift);
    setDraggedTemplate(null);
    setShowDeleteBin(true);
  };

  const handleDrop = async (employeeId: string, date: string) => {
    if (!canEditRoster || isMobile) return;
    
    try {
      const formattedDate = format(new Date(date), 'yyyy-MM-dd');
      console.log('Dropping shift:', { employeeId, originalDate: date, formattedDate });
      
      if (draggedTemplate) {
        const employee = employees?.find(e => e.id === employeeId);
        const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : '';
        
        setShiftPopup({
          isOpen: true,
          employeeId,
          employeeName,
          date: formattedDate
        });
        
        setDraggedTemplate(null);
      } else if (draggedShift) {
        await updateShiftMutation.mutateAsync({
          shiftId: draggedShift.id,
          employeeId,
          date: formattedDate
        });
        setDraggedShift(null);
      }
    } catch (error) {
      console.error('Drop operation failed:', error);
    }
    
    setShowDeleteBin(false);
  };

  const handleDeleteDrop = async () => {
    if (!canEditRoster || isMobile) return;
    
    try {
      if (draggedShift) {
        await deleteShiftMutation.mutateAsync(draggedShift.id);
        setDraggedShift(null);
      }
    } catch (error) {
      console.error('Delete operation failed:', error);
    }
    
    setShowDeleteBin(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isMobile) return;
    e.preventDefault();
  };

  const handleDragEnd = () => {
    if (isMobile) return;
    setShowDeleteBin(false);
  };

  const getShiftsForEmployeeAndDate = (employeeId: string, date: string) => {
    // date is already in 'yyyy-MM-dd' format — don't re-parse through new Date() to avoid timezone shifts
    const normalizedDate = date.length === 10 ? date : format(new Date(date), 'yyyy-MM-dd');
    return shifts?.filter(shift => 
      shift.employee_id === employeeId && 
      shift.date === normalizedDate
    ) || [];
  };

  const getShiftForEmployeeAndDate = (employeeId: string, date: string) => {
    const normalizedDate = date.length === 10 ? date : format(new Date(date), 'yyyy-MM-dd');
    return shifts?.find(shift => 
      shift.employee_id === employeeId && 
      shift.date === normalizedDate
    );
  };

  const getStaffCountForDate = (date: string) => {
    const dateStr = format(new Date(date), 'yyyy-MM-dd');
    return shifts?.filter(shift => shift.date === dateStr).length || 0;
  };

  const groupedTemplates = shiftTemplates?.reduce((acc, template) => {
    if (!acc[template.position]) {
      acc[template.position] = [];
    }
    acc[template.position].push(template);
    return acc;
  }, {} as Record<string, ShiftTemplate[]>) || {};

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setCurrentWeek(date);
      setIsCalendarOpen(false);
    }
  };

  const handleCellClick = (employeeId: string, employeeName: string, date: string, existingShift?: Shift) => {
    if (!canEditRoster) return;
    
    setShiftPopup({
      isOpen: true,
      employeeId,
      employeeName,
      date,
      existingShift
    });
  };

  const handleCreateShiftFromPopup = (shiftData: {
    start_time: string;
    end_time: string;
    position: string;
    job_role_id: string;
    pay_rate: number;
  }) => {
    if (!canEditRoster) return;
    const formattedDate = shiftPopup.date;
    const existingShifts = getShiftsForEmployeeAndDate(shiftPopup.employeeId, formattedDate);
    if (hasTimeOverlap(shiftData.start_time, shiftData.end_time, existingShifts)) {
      toast({
        title: "Time Overlap Error",
        description: "This shift overlaps with another existing shift. Please choose different times.",
        variant: "destructive"
      });
      return;
    }
    createShiftMutation.mutate({
      employeeId: shiftPopup.employeeId,
      date: formattedDate,
      shiftData
    });
    setShiftPopup(prev => ({ ...prev, isOpen: false }));
  };

  const handleUpdateShiftFromPopup = (shiftData: {
    start_time: string;
    end_time: string;
    position: string;
    job_role_id: string;
    pay_rate: number;
  }) => {
    if (!canEditRoster || !shiftPopup.existingShift) return;
    
    const existingShifts = getShiftsForEmployeeAndDate(shiftPopup.employeeId, shiftPopup.date);
    if (hasTimeOverlap(shiftData.start_time, shiftData.end_time, existingShifts, shiftPopup.existingShift.id)) {
      toast({
        title: "Time Overlap Error",
        description: "This shift overlaps with another existing shift. Please choose different times.",
        variant: "destructive"
      });
      return;
    }
    
    updateShiftDetailsMutation.mutate({
      shiftId: shiftPopup.existingShift.id,
      shiftData
    });
    setShiftPopup(prev => ({ ...prev, isOpen: false }));
  };

  const handleDeleteShiftFromPopup = () => {
    if (!canEditRoster || !shiftPopup.existingShift) return;
    deleteShiftMutation.mutate(shiftPopup.existingShift.id);
    setShiftPopup(prev => ({ ...prev, isOpen: false }));
  };

  const handleCustomSort = (newOrder: string[]) => {
    setCustomOrder(newOrder);
    setSortBy('custom');
    setShowSortDialog(false);
  };

  const handleRosterSelect = (template: RosterTemplate) => {
    console.log('handleRosterSelect called with:', template);
    setSelectedRosterTemplate(template);
  };

  useEffect(() => {
    const preventHorizontalNavigation = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
      }
    };

    const preventSwipeNavigation = (e: TouchEvent) => {
      if (e.touches.length > 1) return;
      
      const touch = e.touches[0];
      const startX = touch.clientX;
      
      const handleTouchMove = (moveEvent: TouchEvent) => {
        const moveTouch = moveEvent.touches[0];
        const deltaX = moveTouch.clientX - startX;
        
        if (Math.abs(deltaX) > 50) {
          moveEvent.preventDefault();
        }
      };
      
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      
      const cleanup = () => {
        document.removeEventListener('touchmove', handleTouchMove);
      };
      
      document.addEventListener('touchend', cleanup, { once: true });
    };

    document.addEventListener('wheel', preventHorizontalNavigation, { passive: false });
    document.addEventListener('touchstart', preventSwipeNavigation, { passive: false });

    return () => {
      document.removeEventListener('wheel', preventHorizontalNavigation);
      document.removeEventListener('touchstart', preventSwipeNavigation);
    };
  }, []);

  if (!canViewRoster) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-muted-foreground">Access Denied</h2>
        <p className="text-muted-foreground mt-2">You don't have permission to view rosters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ overscrollBehavior: 'none' }}>
      {/* Delete Bin - only show if user can edit and is dragging a shift on desktop */}
      {showDeleteBin && canEditRoster && !isMobile && (
        <div className="fixed top-20 right-8 z-50">
          <div
            className="p-4 bg-destructive/10 border-2 border-dashed border-destructive/40 rounded-lg hover:bg-destructive/20 transition-colors cursor-pointer"
            onDrop={handleDeleteDrop}
            onDragOver={handleDragOver}
          >
            <Trash2 className="w-8 h-8 text-destructive" />
            <p className="text-sm text-destructive mt-2">Drop to delete</p>
          </div>
        </div>
      )}

      {/* Shift Creation/Edit Popup - only show if user can edit */}
      {canEditRoster && shiftPopup.isOpen && (
        <ShiftCreationPopup
          isOpen={shiftPopup.isOpen}
          onClose={() => setShiftPopup(prev => ({ ...prev, isOpen: false }))}
          onCreateShift={shiftPopup.existingShift ? (shiftData) => {
            const existingShifts = getShiftsForEmployeeAndDate(shiftPopup.employeeId, shiftPopup.date);
            if (hasTimeOverlap(shiftData.start_time, shiftData.end_time, existingShifts, shiftPopup.existingShift!.id)) {
              toast({
                title: "Time Overlap Error",
                description: "This shift overlaps with another existing shift. Please choose different times.",
                variant: "destructive"
              });
              return;
            }
            updateShiftDetailsMutation.mutate({
              shiftId: shiftPopup.existingShift!.id,
              shiftData
            });
            setShiftPopup(prev => ({ ...prev, isOpen: false }));
          } : (shiftData) => {
            const existingShifts = getShiftsForEmployeeAndDate(shiftPopup.employeeId, shiftPopup.date);
            if (hasTimeOverlap(shiftData.start_time, shiftData.end_time, existingShifts)) {
              toast({
                title: "Time Overlap Error",
                description: "This shift overlaps with another existing shift. Please choose different times.",
                variant: "destructive"
              });
              return;
            }
            createShiftMutation.mutate({
              employeeId: shiftPopup.employeeId,
              date: shiftPopup.date,
              shiftData
            });
            setShiftPopup(prev => ({ ...prev, isOpen: false }));
          }}
          onDeleteShift={shiftPopup.existingShift ? () => {
            deleteShiftMutation.mutate(shiftPopup.existingShift!.id);
            setShiftPopup(prev => ({ ...prev, isOpen: false }));
          } : undefined}
          onReviewDiscrepancy={(shift) => {
            const emp = employees?.find(e => e.id === shift.employee_id);
            setShiftPopup(prev => ({ ...prev, isOpen: false }));
            setDiscrepancyReview({
              isOpen: true,
              shift: shift as ShiftWithTimeRecord,
              employeeName: emp ? `${emp.first_name} ${emp.last_name}` : shiftPopup.employeeName,
            });
          }}
          onRemoveReview={(recordId) => {
            removeReviewMutation.mutate(recordId);
          }}
          onManualClock={(shiftId, recordId, type, dateTime) => {
            manualClockMutation.mutate({ shiftId, recordId, type, dateTime });
          }}
          shiftTemplates={shiftTemplates || []}
          employeeName={shiftPopup.employeeName}
          employeeId={shiftPopup.employeeId}
          date={shiftPopup.date}
          existingShift={shiftPopup.existingShift}
          dayAbsence={getAbsenceForEmployeeDate(weekAbsences, shiftPopup.employeeId, shiftPopup.date) || null}
          onUpdateAbsencePayOverride={(shiftId, override) => {
            updateAbsencePayOverrideMutation.mutate({ shiftId, override });
          }}
        />
      )}

      {/* Staff Sorting Dialog - only show if user can edit */}
      {canEditRoster && (
        <StaffSortingDialog
          isOpen={showSortDialog}
          onClose={() => setShowSortDialog(false)}
          employees={employees}
          onSave={handleCustomSort}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Weekly Roster</h1>
          <p className="text-muted-foreground">Manage staff schedules and shift assignments</p>
        </div>
        
        <div className="flex space-x-2">
        </div>
      </div>

      {/* Active Rosters */}
      <ActiveRosterTemplates onSelectRoster={handleRosterSelect} />

      {/* Week Navigation */}
      <div className="flex items-center justify-center space-x-4 mt-4">
        <Button
          variant="outline"
          onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !currentWeek && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              Week of {format(weekStart, 'MMM dd, yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={currentWeek}
              onSelect={(date) => date && setCurrentWeek(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        
        <Button
          variant="outline"
          onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {selectedRosterTemplate && (
        <div className="space-y-6">
          {/* Roster Grid */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  {selectedRosterTemplate.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {canEditRoster && (
                    <Button variant="outline" size="sm" onClick={() => { setStaffSearchTerm(''); setShowAddStaffDialog(true); }}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Staff
                    </Button>
                  )}
                </div>
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-2 rounded-full bg-primary/40" />
                  <span>Scheduled</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-2 rounded-full bg-emerald-500" />
                  <span>On Time</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-2 rounded-full bg-amber-400" />
                  <span>Early</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-2 rounded-full bg-destructive/70" />
                  <span>Late</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-2 rounded-full border border-dashed border-amber-400 bg-amber-100" />
                  <span>Unlinked Clock</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {employees && employees.length > 0 ? (
                <ScrollArea className="w-full">
                  <div className="min-w-full">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-muted/20">
                          <th className="p-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider border-b border-r min-w-[160px] sticky left-0 bg-card z-10">
                            Staff Member
                          </th>
                          {weekDays.map((day) => {
                            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                            const staffCount = getStaffCountForDate(day.toISOString());
                            return (
                              <th key={day.toISOString()} className={cn(
                                "p-3 text-center font-medium border-b min-w-[140px]",
                                isToday && "bg-primary/5"
                              )}>
                                <div className={cn(
                                  "text-xs uppercase tracking-wider",
                                  isToday ? "text-primary font-bold" : "text-muted-foreground"
                                )}>
                                  {format(day, 'EEE')}
                                </div>
                                <div className={cn(
                                  "text-sm",
                                  isToday ? "text-primary font-semibold" : "text-foreground"
                                )}>
                                  {format(day, 'dd MMM')}
                                </div>
                                {staffCount > 0 && (
                                  <div className="text-[10px] text-muted-foreground mt-0.5">
                                    {staffCount} shift{staffCount !== 1 ? 's' : ''}
                                  </div>
                                )}
                                {selectedRosterTemplate?.allow_allocations && allocationLocations.length > 0 && canEditRoster && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 mt-1 text-[10px] px-1.5 py-0"
                                    onClick={() => setAllocationDialog({
                                      isOpen: true,
                                      date: format(day, 'yyyy-MM-dd'),
                                      dateLabel: format(day, 'EEE dd MMM')
                                    })}
                                  >
                                    <MapPin className="w-3 h-3 mr-0.5" />
                                    Allocate
                                  </Button>
                                )}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const renderEmployeeRow = (employee: Employee, idx: number, sectionJobRoleIds?: string[]) => (
                            <tr key={`${employee.id}-${sectionJobRoleIds?.join(',') || 'all'}`} className={cn(
                              "border-b transition-colors hover:bg-muted/30",
                              idx % 2 === 0 ? "bg-card" : "bg-muted/10"
                            )}>
                              <td className="p-3 font-medium min-w-[160px] sticky left-0 bg-inherit z-10 border-r">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="text-sm font-semibold text-foreground">
                                      {employee.first_name} {employee.last_name}
                                    </div>
                                    {employee.department && (
                                      <div className="text-[10px] text-muted-foreground">{employee.department}</div>
                                    )}
                                  </div>
                                  {canEditRoster && !templateEmployeeIds.has(employee.id) && (adHocEmployees || []).find(e => e.id === employee.id) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                      onClick={() => setEmployeeToRemove(employee)}
                                    >
                                      <UserMinus className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                               {weekDays.map((day) => {
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
                                const dayShifts = shifts?.filter(shift => 
                                  shift.employee_id === employee.id && 
                                  shift.date === dateStr
                                ) || [];
                                const dayOrphaned = getOrphanedRecordsForEmployeeAndDate(employee.id, dateStr);
                                const hasContent = dayShifts.length > 0 || dayOrphaned.length > 0;
                                const dayAbsence = getAbsenceForEmployeeDate(weekAbsences, employee.id, dateStr);
                                return (
                                  <td
                                    key={day.toISOString()}
                                    className={cn(
                                      "p-1.5 min-w-[140px] align-top group/cell",
                                      isToday && "bg-primary/5"
                                    )}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      handleDrop(employee.id, dateStr);
                                    }}
                                    onClick={() => canEditRoster && !hasContent && setShiftPopup({
                                      isOpen: true,
                                      employeeId: employee.id,
                                      employeeName: `${employee.first_name} ${employee.last_name}`,
                                      date: dateStr,
                                    })}
                                  >
                                    <div className={cn(
                                      "min-h-[60px] rounded-md p-0.5 transition-colors relative",
                                      !hasContent && !dayAbsence && canEditRoster && "border border-dashed border-border/50 hover:border-primary/30 hover:bg-primary/5 cursor-pointer",
                                      !hasContent && !dayAbsence && !canEditRoster && "border border-dashed border-border/30"
                                    )}>
                                      {/* Absence banner - spans across consecutive days */}
                                      {dayAbsence && (() => {
                                        // Determine position of this day within the absence span (within the visible week)
                                        const absStart = dayAbsence.start_date;
                                        const absEnd = dayAbsence.end_date;
                                        const weekDayStrs = weekDays.map(d => format(d, 'yyyy-MM-dd'));
                                        const dayIdx = weekDayStrs.indexOf(dateStr);
                                        const prevDate = dayIdx > 0 ? weekDayStrs[dayIdx - 1] : null;
                                        const nextDate = dayIdx < weekDayStrs.length - 1 ? weekDayStrs[dayIdx + 1] : null;
                                        const isFirst = dateStr === absStart || dayIdx === 0 || !prevDate || prevDate < absStart;
                                        const isLast = dateStr === absEnd || dayIdx === weekDayStrs.length - 1 || !nextDate || nextDate > absEnd;
                                        const color = dayAbsence.absence_types?.color || '#6366f1';
                                        
                                        return (
                                          <div
                                            className={cn(
                                              "px-1.5 py-1 mb-1 text-[10px] font-semibold text-white truncate",
                                              isFirst && isLast && "rounded",
                                              isFirst && !isLast && "rounded-l -mr-1.5",
                                              !isFirst && isLast && "rounded-r -ml-1.5",
                                              !isFirst && !isLast && "-mx-1.5"
                                            )}
                                            style={{ backgroundColor: color }}
                                            title={`${dayAbsence.absence_types?.name}${dayAbsence.status === 'pending' ? ' (Pending)' : ''} — ${absStart} to ${absEnd}`}
                                          >
                                            {isFirst ? (
                                              <>
                                                {dayAbsence.absence_types?.name}
                                                {(dayAbsence.start_time || dayAbsence.end_time) && (
                                                  <span className="ml-1 opacity-80 font-normal">
                                                    {dayAbsence.start_time || '—'}–{dayAbsence.end_time || '—'}
                                                  </span>
                                                )}
                                                {dayAbsence.status === 'pending' && (
                                                  <span className="ml-1 opacity-75">⏳</span>
                                                )}
                                              </>
                                            ) : (
                                              <span className="opacity-0">·</span>
                                            )}
                                          </div>
                                        );
                                      })()}
                                      {hasContent ? (
                                        <div className="space-y-1">
                                          {dayShifts.map((shift) => {
                                            const isFaded = sectionJobRoleIds && shift.job_role_id
                                              ? !sectionJobRoleIds.includes(shift.job_role_id)
                                              : false;
                                            return (
                                              <RosterShiftCell
                                                key={shift.id}
                                                shift={shift}
                                                canEdit={canEditRoster && !isFaded}
                                                faded={isFaded}
                                                hasAbsence={!!dayAbsence}
                                                dayAbsence={dayAbsence || undefined}
                                                absencePayOverride={shift.absence_pay_override}
                                                onEdit={() => {
                                                  if (isFaded) return;
                                                  setShiftPopup({
                                                    isOpen: true,
                                                    employeeId: employee.id,
                                                    employeeName: `${employee.first_name} ${employee.last_name}`,
                                                    date: dateStr,
                                                    existingShift: shift
                                                  });
                                                }}
                                                onReviewDiscrepancy={(s) => {
                                                  if (isFaded) return;
                                                  const emp = employees?.find(e => e.id === s.employee_id);
                                                  setDiscrepancyReview({
                                                    isOpen: true,
                                                    shift: s,
                                                    employeeName: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown',
                                                  });
                                                }}
                                                onDragStart={(e) => {
                                                  if (isFaded) return;
                                                  handleShiftDragStart(shift);
                                                }}
                                              />
                                            );
                                          })}
                                          {dayOrphaned.map((record) => (
                                            <OrphanedClockRecord
                                              key={`orphan-${record.id}`}
                                              record={record}
                                              canEdit={canEditRoster}
                                              onReview={(r) => {
                                                // Open shift creation popup so they can attach a shift
                                                setShiftPopup({
                                                  isOpen: true,
                                                  employeeId: employee.id,
                                                  employeeName: `${employee.first_name} ${employee.last_name}`,
                                                  date: dateStr,
                                                });
                                              }}
                                            />
                                          ))}
                                          {/* Add another shift button */}
                                          {canEditRoster && (
                                            <div
                                              className="flex items-center justify-center py-1 opacity-0 group-hover/cell:opacity-100 transition-opacity cursor-pointer rounded border border-dashed border-border/40 hover:border-primary/30 hover:bg-primary/5"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setShiftPopup({
                                                  isOpen: true,
                                                  employeeId: employee.id,
                                                  employeeName: `${employee.first_name} ${employee.last_name}`,
                                                  date: dateStr,
                                                });
                                              }}
                                            >
                                              <Plus className="w-3 h-3 text-muted-foreground" />
                                            </div>
                                          )}
                                        </div>
                                      ) : canEditRoster ? (
                                        <div className="flex items-center justify-center h-full min-h-[56px] opacity-0 hover:opacity-100 transition-opacity">
                                          <Plus className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                      ) : null}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );

                          if (rosterSections.length === 0) {
                            return employees.map((employee, idx) => renderEmployeeRow(employee, idx));
                          }

                          // Group employees by their shifts' job roles
                          const sectionGroups = groupEmployeesByShiftRoles(
                            employees,
                            (shifts || []).map(s => ({ employee_id: s.employee_id, job_role_id: s.job_role_id }))
                          );

                          let rowIdx = 0;
                          return sectionGroups.map((group) => (
                            <React.Fragment key={`section-${group.sectionId || 'other'}`}>
                              <tr className="bg-muted/50">
                                <td
                                  colSpan={weekDays.length + 1}
                                  className="px-3 py-2 font-semibold text-sm text-foreground border-b border-t sticky left-0"
                                >
                                  {group.sectionName}
                                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                                    ({group.employeeIds.length} staff)
                                  </span>
                                </td>
                              </tr>
                              {group.employeeIds.map((empId) => {
                                const employee = employees.find(e => e.id === empId);
                                if (!employee) return null;
                                return renderEmployeeRow(employee, rowIdx++, group.sectionJobRoleIds);
                              })}
                            </React.Fragment>
                          ));

                        })()}
                      </tbody>
                    </table>
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No employees found for this roster template.</p>
                  {canEditRoster && (
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => { setStaffSearchTerm(''); setShowAddStaffDialog(true); }}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Staff
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!selectedRosterTemplate && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Select an active roster above to begin {canEditRoster ? 'managing' : 'viewing'} shifts and staff assignments.</p>
          </CardContent>
        </Card>
      )}

      {/* Discrepancy Review Dialog */}
      {discrepancyReview.shift && (
        <DiscrepancyReviewDialog
          isOpen={discrepancyReview.isOpen}
          onClose={() => setDiscrepancyReview({ isOpen: false, shift: null, employeeName: '' })}
          shift={discrepancyReview.shift}
          employeeName={discrepancyReview.employeeName}
          onSubmitReview={(result) => submitDiscrepancyReviewMutation.mutate(result)}
        />
      )}

      {/* Add Staff Dialog */}
      <Dialog open={showAddStaffDialog} onOpenChange={setShowAddStaffDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff to Roster</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search employees..."
                value={staffSearchTerm}
                onChange={(e) => setStaffSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <ScrollArea className="h-[300px]">
              <div className="space-y-1">
                {allEmployees
                  ?.filter(emp => {
                    const name = `${emp.first_name} ${emp.last_name}`.toLowerCase();
                    return name.includes(staffSearchTerm.toLowerCase());
                  })
                  .filter(emp => !employees.find(e => e.id === emp.id))
                  .map(emp => (
                    <Button
                      key={emp.id}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        // Add a roster_template_assignment so they persist
                        addAdHocStaffMutation.mutate(emp);
                        setShowAddStaffDialog(false);
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      {emp.first_name} {emp.last_name}
                      {emp.department && <span className="ml-2 text-muted-foreground text-xs">({emp.department})</span>}
                    </Button>
                  ))}
                {allEmployees?.filter(emp => {
                  const name = `${emp.first_name} ${emp.last_name}`.toLowerCase();
                  return name.includes(staffSearchTerm.toLowerCase());
                }).filter(emp => !employees.find(e => e.id === emp.id)).length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No employees found</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Ad-Hoc Staff Confirmation */}
      <AlertDialog open={!!employeeToRemove} onOpenChange={(open) => !open && setEmployeeToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove staff from roster?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {employeeToRemove?.first_name} {employeeToRemove?.last_name} from this roster? This will also delete their shifts for this week.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (employeeToRemove) {
                removeAdHocStaffMutation.mutate(employeeToRemove.id);
                setEmployeeToRemove(null);
              }
            }}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Allocation Assignment Dialog */}
      {selectedRosterTemplate?.allow_allocations && (
        <AllocationAssignmentDialog
          isOpen={allocationDialog.isOpen}
          onClose={() => setAllocationDialog({ isOpen: false, date: '', dateLabel: '' })}
          date={allocationDialog.date}
          dateLabel={allocationDialog.dateLabel}
          locations={allocationLocations}
          employees={employees}
          shiftsForDay={
            (shifts || [])
              .filter(s => s.date === allocationDialog.date)
              .map(s => ({
                employee_id: s.employee_id,
                job_role_id: s.job_role_id,
                position: s.position,
                start_time: s.start_time,
                end_time: s.end_time
              }))
          }
          existingAllocations={getAllocationsForDate(allocationDialog.date)}
          jobRoles={jobRolesData || []}
          sections={rosterSections}
          sectionRoleRules={sectionRoleRules}
          onSave={(assignments) => {
            bulkSetAllocations.mutate(
              assignments.map(a => ({
                employeeId: a.employeeId,
                date: allocationDialog.date,
                locationId: a.locationId
              }))
            );
          }}
        />
      )}
    </div>
  );
};

export default Roster;
