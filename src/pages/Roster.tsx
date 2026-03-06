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
import { ChevronLeft, ChevronRight, CalendarIcon, Users, Trash2, Plus, ArrowUpDown, UserPlus, UserMinus, Search } from "lucide-react";
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
            notes
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

  // Auto-exception settings
  const {
    earlyClockInMinutes, lateClockInMinutes, earlyClockOutMinutes, lateClockOutMinutes,
    earlyClockInAutoAction, lateClockInAutoAction, earlyClockOutAutoAction, lateClockOutAutoAction,
  } = useTimeClockSettings();

  // Roster sections for grouping employees by shift job roles
  const { sections: rosterSections, groupEmployeesByShiftRoles } = useRosterSections(selectedRosterTemplate?.id);

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

        let allWithinThreshold = true;
        let earlyMinutesPaid = 0;
        let lateMinutesPaid = 0;

        // Check early clock-in
        if (actualStart < scheduledStart) {
          const diff = scheduledStart - actualStart;
          if (diff <= earlyClockInMinutes) {
            if (earlyClockInAutoAction === 'paid') earlyMinutesPaid += diff;
          } else {
            allWithinThreshold = false;
          }
        }

        // Check late clock-in
        if (actualStart > scheduledStart + 2) {
          const diff = actualStart - scheduledStart;
          if (diff <= lateClockInMinutes) {
            if (lateClockInAutoAction === 'paid') lateMinutesPaid += diff;
          } else {
            allWithinThreshold = false;
          }
        }

        // Check early clock-out
        if (actualEnd !== null && actualEnd < scheduledEnd - 2) {
          const diff = scheduledEnd - actualEnd;
          if (diff <= earlyClockOutMinutes) {
            if (earlyClockOutAutoAction === 'paid') lateMinutesPaid += diff;
          } else {
            allWithinThreshold = false;
          }
        }

        // Check late clock-out
        if (actualEnd !== null && actualEnd > scheduledEnd) {
          const diff = actualEnd - scheduledEnd;
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
      };
    }) => {
      const { error } = await supabase
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
          roster_template_id: selectedRosterTemplate?.id
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast({ title: "Shift added successfully" });
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast({ title: "Shift moved successfully" });
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
        if (recordId) {
          const { error } = await supabase
            .from('time_clock_records')
            .update({
              clock_in_time: isoDateTime,
              status: 'clocked_in',
              notes: `Manual clock in by manager (${new Date().toISOString()})`,
              updated_at: new Date().toISOString(),
            })
            .eq('id', recordId);
          if (error) throw error;
        } else {
          const { data: shift, error: shiftErr } = await supabase
            .from('shifts')
            .select('employee_id, date, start_time, end_time')
            .eq('id', shiftId)
            .single();
          if (shiftErr) throw shiftErr;

          const { error } = await supabase
            .from('time_clock_records')
            .insert({
              employee_id: shift.employee_id,
              shift_id: shiftId,
              shift_date: shift.date,
              shift_start_time: shift.start_time,
              shift_end_time: shift.end_time,
              clock_in_time: isoDateTime,
              status: 'clocked_in',
              notes: `Manual clock in by manager (${new Date().toISOString()})`,
            });
          if (error) throw error;
        }
      } else {
        if (!recordId) throw new Error('Cannot clock out without existing record');
        // Get existing notes to append
        const { data: existing } = await supabase
          .from('time_clock_records')
          .select('notes')
          .eq('id', recordId)
          .single();
        const existingNotes = existing?.notes || '';
        const newNote = `Manual clock out by manager (${new Date().toISOString()})`;
        const combinedNotes = existingNotes ? `${existingNotes}, ${newNote}` : newNote;

        const { error } = await supabase
          .from('time_clock_records')
          .update({
            clock_out_time: isoDateTime,
            status: 'completed',
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

      const { error } = await supabase
        .from('time_clock_records')
        .update({
          approval_status: 'reviewed',
          status: 'completed',
          approved_by: user?.id,
          early_minutes_paid: earlyMinutesPaid,
          late_minutes_paid: lateMinutesPaid,
          notes: result.notes || null,
          updated_at: new Date().toISOString()
        })
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
    return shifts?.filter(shift => 
      shift.employee_id === employeeId && 
      shift.date === format(new Date(date), 'yyyy-MM-dd')
    ) || [];
  };

  const getShiftForEmployeeAndDate = (employeeId: string, date: string) => {
    return shifts?.find(shift => 
      shift.employee_id === employeeId && 
      shift.date === format(new Date(date), 'yyyy-MM-dd')
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
    const formattedDate = format(new Date(shiftPopup.date), 'yyyy-MM-dd');
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
          <Button
            variant="outline"
            onClick={() => setShowTemplates(!showTemplates)}
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Shift Templates
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Shift
          </Button>
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
                                return (
                                  <td
                                    key={day.toISOString()}
                                    className={cn(
                                      "p-1.5 min-w-[140px] align-top",
                                      isToday && "bg-primary/5"
                                    )}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      handleDrop(employee.id, dateStr);
                                    }}
                                    onClick={() => canEditRoster && dayShifts.length === 0 && setShiftPopup({
                                      isOpen: true,
                                      employeeId: employee.id,
                                      employeeName: `${employee.first_name} ${employee.last_name}`,
                                      date: dateStr,
                                    })}
                                  >
                                    <div className={cn(
                                      "min-h-[60px] rounded-md p-0.5 transition-colors",
                                      dayShifts.length === 0 && canEditRoster && "border border-dashed border-border/50 hover:border-primary/30 hover:bg-primary/5 cursor-pointer",
                                      dayShifts.length === 0 && !canEditRoster && "border border-dashed border-border/30"
                                    )}>
                                      {dayShifts.length > 0 ? (
                                        <div className="space-y-1">
                                          {dayShifts.map((shift) => {
                                            // Determine if this shift belongs to the current section
                                            // Shifts with no job_role_id are never faded (they belong everywhere)
                                            const isFaded = sectionJobRoleIds && shift.job_role_id
                                              ? !sectionJobRoleIds.includes(shift.job_role_id)
                                              : false;
                                            return (
                                              <RosterShiftCell
                                                key={shift.id}
                                                shift={shift}
                                                canEdit={canEditRoster && !isFaded}
                                                faded={isFaded}
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
    </div>
  );
};

export default Roster;
