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
import { ChevronLeft, ChevronRight, CalendarIcon, Users, Trash2, Plus, ArrowUpDown, UserPlus, UserMinus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, addDays, addWeeks, subWeeks } from "date-fns";
import { cn } from "@/lib/utils";
import StaffAssignmentManager from "@/components/StaffAssignmentManager";
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
  roster_name?: string;
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
}

const Roster = () => {
  const { userRole } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [draggedTemplate, setDraggedTemplate] = useState<ShiftTemplate | null>(null);
  const [draggedShift, setDraggedShift] = useState<Shift | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedRosterName, setSelectedRosterName] = useState<string | null>(null);
  const [showDeleteBin, setShowDeleteBin] = useState(false);
  const [sortBy, setSortBy] = useState<'first_name' | 'last_name' | 'department' | 'custom'>('first_name');
  const [customOrder, setCustomOrder] = useState<string[]>([]);
  const [showSortDialog, setShowSortDialog] = useState(false);
  const [showAddStaffDialog, setShowAddStaffDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [staffInRoster, setStaffInRoster] = useState<Set<string>>(new Set());
  const [removeStaffDialog, setRemoveStaffDialog] = useState<{
    isOpen: boolean;
    employeeId: string;
    employeeName: string;
  }>({
    isOpen: false,
    employeeId: '',
    employeeName: ''
  });
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

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)); // Mon-Sun (7 days)

  // Get all employees
  const { data: allEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, department')
        .order('first_name');
      
      if (error) throw error;
      return data as Employee[];
    }
  });

  // Get employees that have shifts in the selected roster
  const { data: rosterEmployees } = useQuery({
    queryKey: ['roster-employees', selectedRosterName],
    queryFn: async () => {
      if (!selectedRosterName) return [];
      
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          employee_id,
          employees!inner(id, first_name, last_name, department)
        `)
        .eq('roster_name', selectedRosterName);
      
      if (error) throw error;
      
      // Get unique employees
      const uniqueEmployees = new Map();
      data?.forEach(shift => {
        const emp = shift.employees;
        if (emp && !uniqueEmployees.has(emp.id)) {
          uniqueEmployees.set(emp.id, emp);
        }
      });
      
      return Array.from(uniqueEmployees.values()) as Employee[];
    },
    enabled: !!selectedRosterName
  });

  // Use roster employees if a roster is selected, otherwise use all employees
  const employees = selectedRosterName ? (rosterEmployees || []) : (allEmployees || []);

  // Get all shift templates
  const { data: shiftTemplates } = useQuery({
    queryKey: ['shift-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shift_templates')
        .select('*')
        .order('position, name');
      
      if (error) throw error;
      return data as ShiftTemplate[];
    }
  });

  // Update the shifts query to filter by roster name
  const { data: shifts } = useQuery({
    queryKey: ['shifts', format(weekStart, 'yyyy-MM-dd'), selectedRosterName],
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
      
      // Filter by roster name if selected
      if (selectedRosterName) {
        query = query.eq('roster_name', selectedRosterName);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform the data to include time records
      return (data || []).map(shift => ({
        ...shift,
        time_record: shift.time_clock_records?.[0] || null
      })) as ShiftWithTimeRecord[];
    }
  });

  // Permission checks
  const canViewRoster = hasPermission('view_roster') || hasPermission('edit_roster');
  const canEditRoster = hasPermission('edit_roster');

  // Deploy template mutation - copies template shifts to live roster
  const deployTemplateMutation = useMutation({
    mutationFn: async (template: RosterTemplate) => {
      console.log('Deploying template:', template);
      
      // Get template shifts
      const { data: templateShifts, error: templateError } = await supabase
        .from('template_shifts')
        .select('*')
        .eq('template_id', template.id);
      
      if (templateError) throw templateError;
      
      console.log('Template shifts found:', templateShifts);
      
      if (!templateShifts || templateShifts.length === 0) {
        throw new Error('No shifts found in this template');
      }
      
      // Calculate the start date for the current week
      const startDate = format(weekStart, 'yyyy-MM-dd');
      
      // Create shifts for the current week based on template
      const shiftsToCreate = templateShifts.map(templateShift => {
        // Calculate the actual date based on day_of_week
        const shiftDate = format(addDays(weekStart, templateShift.day_of_week), 'yyyy-MM-dd');
        
        return {
          employee_id: templateShift.employee_id,
          date: shiftDate,
          start_time: templateShift.start_time,
          end_time: templateShift.end_time,
          position: templateShift.position,
          job_role_id: templateShift.job_role_id,
          actual_job_role_id: templateShift.job_role_id,
          pay_rate: 0,
          roster_name: template.name
        };
      });
      
      console.log('Creating shifts:', shiftsToCreate);
      
      // Insert the shifts
      const { error: insertError } = await supabase
        .from('shifts')
        .insert(shiftsToCreate);
      
      if (insertError) throw insertError;
      
      return template.name;
    },
    onSuccess: (rosterName) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['roster-employees'] });
      toast({ title: `Template deployed successfully as "${rosterName}"` });
    },
    onError: (error) => {
      console.error('Template deployment error:', error);
      toast({ 
        title: "Error deploying template", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

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
          roster_name: selectedRosterName
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
      // Format the date properly - date is coming from day.toISOString()
      const formattedDate = format(new Date(date), 'yyyy-MM-dd');
      console.log('Dropping shift:', { employeeId, originalDate: date, formattedDate });
      
      if (draggedTemplate) {
        // When dropping a template, we need to open the shift creation popup
        // to select the job role since templates don't have job role info
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

  // Updated function to get ALL shifts for an employee on a specific date
  const getShiftsForEmployeeAndDate = (employeeId: string, date: string) => {
    return shifts?.filter(shift => 
      shift.employee_id === employeeId && 
      shift.date === format(new Date(date), 'yyyy-MM-dd')
    ) || [];
  };

  // Keep the old function for backward compatibility but mark it as deprecated
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

  // Group shift templates by position
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
    
    // Check for overlapping shifts (excluding the current shift being updated)
    const existingShifts = getShiftsForEmployeeAndDate(shiftPopup.employeeId, shiftPopup.date);
    if (hasTimeOverlap(shiftData.start_time, shiftData.end_time, existingShifts, shiftPopup.existingShift.id)) {
      toast({
        title: "Time Overlap Error",
        description: "This shift overlaps with another existing shift. Please choose different times.",
        variant: "destructive"
      });
      return;
    }
    
    // Delete the old shift and create a new one with updated data
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
    
    // Check if this template has already been deployed for this week
    const hasShiftsThisWeek = shifts && shifts.length > 0;
    
    if (!hasShiftsThisWeek) {
      // Deploy the template first
      deployTemplateMutation.mutate(template);
    }
    
    setSelectedRosterName(template.name);
  };

  const handleAddStaff = (employeeId: string) => {
    if (!selectedRosterName) return;
    setStaffInRoster(new Set(staffInRoster).add(employeeId));
    setShowAddStaffDialog(false);
    setSearchTerm("");
    toast({ title: "Staff member added to roster" });
  };

  const handleRemoveStaff = (employeeId: string) => {
    if (!selectedRosterName) return;
    
    // Remove all shifts for this employee in the current week
    const employeeShifts = shifts?.filter(shift => shift.employee_id === employeeId) || [];
    
    employeeShifts.forEach(shift => {
      deleteShiftMutation.mutate(shift.id);
    });
    
    // Remove from category assignment
    setStaffInRoster(new Set(staffInRoster).delete(employeeId));
    setRemoveStaffDialog({ isOpen: false, employeeId: '', employeeName: '' });
    toast({ title: "Staff member removed from roster" });
  };

  const openRemoveStaffDialog = (employeeId: string, employeeName: string) => {
    setRemoveStaffDialog({
      isOpen: true,
      employeeId,
      employeeName
    });
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
      {/* Remove Staff Confirmation Dialog */}
      <AlertDialog open={removeStaffDialog.isOpen} onOpenChange={(open) => !open && setRemoveStaffDialog({ isOpen: false, employeeId: '', employeeName: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{removeStaffDialog.employeeName}</strong> from this roster? 
              This will also remove all their assigned shifts for the current week.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleRemoveStaff(removeStaffDialog.employeeId)}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Staff Dialog */}
      <Dialog open={showAddStaffDialog} onOpenChange={setShowAddStaffDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Staff to {selectedRosterName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredEmployeesNotInRoster.map((employee) => (
                <div key={employee.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="font-medium">{employee.first_name} {employee.last_name}</div>
                    <div className="text-sm text-gray-500">{employee.department}</div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddStaff(employee.id)}
                  >
                    Add
                  </Button>
                </div>
              ))}
              {filteredEmployeesNotInRoster.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  {searchTerm ? 'No employees found matching search' : 'All employees are already in this roster'}
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
          onCreateShift={(shiftData) => {
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
      <ActiveRosterTemplates onDeployTemplate={handleRosterSelect} />

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

      {selectedRosterName && (
        <div className="space-y-6">
          {/* Roster Grid */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {selectedRosterName} Roster
                </CardTitle>
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
                              <div>{employee.first_name} {employee.last_name}</div>
                            </td>
                            {weekDays.map((day) => {
                              const dayShifts = getShiftsForEmployeeAndDate(employee.id, day.toISOString());
                              return (
                                <td
                                  key={day.toISOString()}
                                  className="p-2 border-r border-l min-w-32"
                                  onClick={() => handleCellClick(employee.id, `${employee.first_name} ${employee.last_name}`, format(day, 'yyyy-MM-dd'))}
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
                                              handleCellClick(employee.id, `${employee.first_name} ${employee.last_name}`, format(day, 'yyyy-MM-dd'), shift);
                                            }}
                                          >
                                            <div className="font-medium">{shift.position}</div>
                                            <div>{shift.start_time} - {shift.end_time}</div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center h-full">
                                        <Plus className="w-4 h-4 text-gray-400" />
                                      </div>
                                    )}
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
                  <p className="text-gray-500">No employees found for this roster.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!selectedRosterName && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Select an active roster above to begin {canEditRoster ? 'managing' : 'viewing'} shifts and staff assignments.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Roster;
