import { useState, useEffect } from "react";
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
import { useIsMobile } from "@/hooks/use-mobile";
import ActiveRosterTemplates from "@/components/ActiveRosterTemplates";

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
    status: 'scheduled' | 'clocked_in' | 'completed' | 'discrepancy';
    clock_in_time: string | null;
    clock_out_time: string | null;
  };
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
  const { userRole } = useAuth();
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
    existingShift?: Shift;
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
            clock_out_time
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
      
      const result = (data || []).map(shift => ({
        ...shift,
        time_record: shift.time_clock_records?.[0] || null
      })) as ShiftWithTimeRecord[];
      
      return result;
    },
    enabled: !!selectedRosterTemplate?.id
  });

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

  const updateShiftMutation = useMutation({
    mutationFn: async ({ shiftId, employeeId, date }: {
      shiftId: string;
      employeeId: string;
      date: string;
    }) => {
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

  const deleteShiftMutation = useMutation({
    mutationFn: async (shiftId: string) => {
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
        return '#9CA3AF'; // Gray
      case 'clocked_in':
        return '#F59E0B'; // Amber
      case 'completed':
        return '#10B981'; // Green
      case 'discrepancy':
        return '#EF4444'; // Red
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
    
    deleteShiftMutation.mutate(shiftPopup.existingShift.id);
    createShiftMutation.mutate({
      employeeId: shiftPopup.employeeId,
      date: format(new Date(shiftPopup.date), 'yyyy-MM-dd'),
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
        <h2 className="text-xl font-semibold text-gray-600">Access Denied</h2>
        <p className="text-gray-500 mt-2">You don't have permission to view rosters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ overscrollBehavior: 'none' }}>
      {/* Delete Bin - only show if user can edit and is dragging a shift on desktop */}
      {showDeleteBin && canEditRoster && !isMobile && (
        <div className="fixed top-20 right-8 z-50">
          <div
            className="p-4 bg-red-100 border-2 border-dashed border-red-400 rounded-lg hover:bg-red-200 transition-colors cursor-pointer"
            onDrop={handleDeleteDrop}
            onDragOver={handleDragOver}
          >
            <Trash2 className="w-8 h-8 text-red-600" />
            <p className="text-sm text-red-600 mt-2">Drop to delete</p>
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
            deleteShiftMutation.mutate(shiftPopup.existingShift!.id);
            createShiftMutation.mutate({
              employeeId: shiftPopup.employeeId,
              date: shiftPopup.date,
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
          <h1 className="text-2xl font-bold text-gray-900">Weekly Roster</h1>
          <p className="text-gray-600">Manage staff schedules and shift assignments</p>
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
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {selectedRosterTemplate.name} Roster
                </CardTitle>
                {canEditRoster && (
                  <Button variant="outline" size="sm" onClick={() => { setStaffSearchTerm(''); setShowAddStaffDialog(true); }}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Staff
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {employees && employees.length > 0 ? (
                <ScrollArea className="w-full">
                  <div className="min-w-full">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="p-3 text-left font-medium border-b min-w-[160px]">Staff</th>
                          {weekDays.map((day) => (
                            <th key={day.toISOString()} className="p-3 text-center font-medium border-b min-w-32">
                              <div>{format(day, 'EEE')}</div>
                              <div className="text-sm text-gray-500">{format(day, 'MMM dd')}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {employees.map((employee) => (
                          <tr key={employee.id} className="border-b">
                            <td className="p-3 font-medium min-w-[160px]">
                              <div className="flex items-center justify-between">
                                <span>{employee.first_name} {employee.last_name}</span>
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
                              const dayShifts = shifts?.filter(shift => 
                                shift.employee_id === employee.id && 
                                shift.date === format(day, 'yyyy-MM-dd')
                              ) || [];
                              return (
                                <td
                                  key={day.toISOString()}
                                  className="p-2 border-r border-l min-w-32"
                                  onClick={() => canEditRoster && setShiftPopup({
                                    isOpen: true,
                                    employeeId: employee.id,
                                    employeeName: `${employee.first_name} ${employee.last_name}`,
                                    date: format(day, 'yyyy-MM-dd'),
                                  })}
                                >
                                  <div className="min-h-16 border-2 border-dashed border-gray-200 rounded p-2 transition-colors cursor-pointer hover:border-gray-300">
                                    {dayShifts.length > 0 ? (
                                      <div className="space-y-1">
                                        {dayShifts.map((shift) => (
                                          <div
                                            key={shift.id}
                                            className="text-xs bg-blue-100 text-blue-800 p-1 rounded"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (canEditRoster) {
                                                setShiftPopup({
                                                  isOpen: true,
                                                  employeeId: employee.id,
                                                  employeeName: `${employee.first_name} ${employee.last_name}`,
                                                  date: format(day, 'yyyy-MM-dd'),
                                                  existingShift: shift
                                                });
                                              }
                                            }}
                                          >
                                            <div className="font-medium">{shift.position}</div>
                                            <div>{shift.start_time} - {shift.end_time}</div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : canEditRoster ? (
                                      <div className="opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center h-full">
                                        <Plus className="w-4 h-4 text-gray-400" />
                                      </div>
                                    ) : null}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No employees found for this roster template.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!selectedRosterTemplate && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Select an active roster above to begin {canEditRoster ? 'managing' : 'viewing'} shifts and staff assignments.</p>
          </CardContent>
        </Card>
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
