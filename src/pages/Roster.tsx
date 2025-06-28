import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { ChevronLeft, ChevronRight, CalendarIcon, Users, Trash2, Plus, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, addDays, addWeeks, subWeeks } from "date-fns";
import { cn } from "@/lib/utils";
import RosterCategoryManager from "@/components/RosterCategoryManager";
import StaffAssignmentManager from "@/components/StaffAssignmentManager";
import ShiftCreationPopup from "@/components/ShiftCreationPopup";
import StaffSortingDialog from "@/components/StaffSortingDialog";
import { useRosterCategories } from "@/hooks/useRosterCategories";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
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
  
  const { categories, getAssignedEmployees } = useRosterCategories();

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)); // Mon-Sun (7 days)

  // Get assigned employees for selected category
  const assignedEmployeeIds = selectedCategoryId ? getAssignedEmployees(selectedCategoryId) : [];

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

  // Filter and sort employees based on category selection and sorting preference
  const employees = (() => {
    let filteredEmployees = selectedCategoryId 
      ? allEmployees?.filter(emp => assignedEmployeeIds.includes(emp.id))
      : allEmployees;

    if (!filteredEmployees) return [];

    // Apply sorting
    switch (sortBy) {
      case 'first_name':
        return [...filteredEmployees].sort((a, b) => a.first_name.localeCompare(b.first_name));
      case 'last_name':
        return [...filteredEmployees].sort((a, b) => a.last_name.localeCompare(b.last_name));
      case 'department':
        return [...filteredEmployees].sort((a, b) => (a.department || '').localeCompare(b.department || ''));
      case 'custom':
        if (customOrder.length === 0) return filteredEmployees;
        return [...filteredEmployees].sort((a, b) => {
          const indexA = customOrder.indexOf(a.id);
          const indexB = customOrder.indexOf(b.id);
          if (indexA === -1 && indexB === -1) return 0;
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });
      default:
        return filteredEmployees;
    }
  })();

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

  // Update the shifts query to include weekends
  const { data: shifts } = useQuery({
    queryKey: ['shifts', format(weekStart, 'yyyy-MM-dd'), selectedCategoryId],
    queryFn: async () => {
      const startDate = format(weekStart, 'yyyy-MM-dd');
      const endDate = format(addDays(weekStart, 6), 'yyyy-MM-dd'); // Changed from 4 to 6 for full week
      
      let query = supabase
        .from('shifts')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      if (selectedCategoryId) {
        query = query.eq('category_id', selectedCategoryId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Shift[];
    }
  });

  // Permission checks
  const canViewRoster = hasPermission('view_roster') || hasPermission('edit_roster');
  const canEditRoster = hasPermission('edit_roster');

  const createShiftMutation = useMutation({
    mutationFn: async ({ employeeId, date, shiftData }: {
      employeeId: string;
      date: string;
      shiftData: {
        start_time: string;
        end_time: string;
        position: string;
        pay_value?: number;
        color?: string;
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
          job_role_id: '00000000-0000-0000-0000-000000000000',
          category_id: selectedCategoryId
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

  const handleDrop = (employeeId: string, date: string) => {
    if (!canEditRoster || isMobile) return;
    if (draggedTemplate) {
      createShiftMutation.mutate({
        employeeId,
        date: format(new Date(date), 'yyyy-MM-dd'),
        shiftData: {
          start_time: draggedTemplate.start_time,
          end_time: draggedTemplate.end_time,
          position: draggedTemplate.position,
          pay_value: draggedTemplate.pay_value,
          color: draggedTemplate.color
        }
      });
      setDraggedTemplate(null);
    } else if (draggedShift) {
      updateShiftMutation.mutate({
        shiftId: draggedShift.id,
        employeeId,
        date
      });
      setDraggedShift(null);
    }
    setShowDeleteBin(false);
  };

  const handleDeleteDrop = () => {
    if (!canEditRoster || isMobile) return;
    if (draggedShift) {
      deleteShiftMutation.mutate(draggedShift.id);
      setDraggedShift(null);
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
    pay_value?: number;
    color?: string;
  }) => {
    if (!canEditRoster) return;
    createShiftMutation.mutate({
      employeeId: shiftPopup.employeeId,
      date: format(new Date(shiftPopup.date), 'yyyy-MM-dd'),
      shiftData
    });
  };

  const handleUpdateShiftFromPopup = (shiftData: {
    start_time: string;
    end_time: string;
    position: string;
    pay_value?: number;
    color?: string;
  }) => {
    if (!canEditRoster || !shiftPopup.existingShift) return;
    
    // Delete the old shift and create a new one with updated data
    deleteShiftMutation.mutate(shiftPopup.existingShift.id);
    createShiftMutation.mutate({
      employeeId: shiftPopup.employeeId,
      date: format(new Date(shiftPopup.date), 'yyyy-MM-dd'),
      shiftData
    });
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

  const selectedCategory = categories?.find(cat => cat.id === selectedCategoryId);

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
      {canEditRoster && (
        <ShiftCreationPopup
          isOpen={shiftPopup.isOpen}
          onClose={() => setShiftPopup(prev => ({ ...prev, isOpen: false }))}
          onCreateShift={shiftPopup.existingShift ? handleUpdateShiftFromPopup : handleCreateShiftFromPopup}
          onDeleteShift={shiftPopup.existingShift ? handleDeleteShiftFromPopup : undefined}
          shiftTemplates={shiftTemplates || []}
          employeeName={shiftPopup.employeeName}
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

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Weekly Roster {!canEditRoster && <span className="text-sm font-normal text-gray-500">(View Only)</span>}
        </h1>
        <p className="text-gray-600">
          {canEditRoster 
            ? (isMobile 
                ? "Tap on shifts to edit or remove them, or tap empty cells to add shifts"
                : "Drag and drop shifts to assign staff or move shifts between staff and days, or click on empty cells to add shifts"
              )
            : "View-only access - shifts cannot be modified"
          }
        </p>
        
        {/* Date Navigation */}
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
                onSelect={handleDateSelect}
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
      </div>

      {/* Category Selection - only allow editing if user has edit permissions */}
      <RosterCategoryManager
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={setSelectedCategoryId}
      />

      {/* Staff Assignment for Selected Category - only show if user can edit */}
      {selectedCategory && canEditRoster && (
        <StaffAssignmentManager
          categoryId={selectedCategory.id}
          categoryName={selectedCategory.name}
        />
      )}

      {selectedCategoryId && (
        <div className="space-y-6">
          {/* Shift Templates Panel - only show if user can edit and not on mobile */}
          {canEditRoster && !isMobile && (
            <Card>
              <CardHeader>
                <CardTitle>Shift Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {Object.entries(groupedTemplates).map(([position, templates]) => (
                    <AccordionItem value={position} key={position}>
                      <AccordionTrigger className="text-sm font-medium">
                        {position}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-2 gap-2">
                          {templates.map((template) => (
                            <div
                              key={template.id}
                              draggable={canEditRoster}
                              onDragStart={() => handleDragStart(template)}
                              className={cn(
                                "p-2 rounded border text-xs transition-shadow",
                                canEditRoster ? "cursor-move hover:shadow-md" : "cursor-default"
                              )}
                              style={{ 
                                backgroundColor: template.color + '20',
                                borderColor: template.color 
                              }}
                            >
                              <div className="font-medium truncate">{template.name}</div>
                              <div className="text-xs text-gray-600 truncate">
                                {template.start_time} - {template.end_time}
                              </div>
                              <div className="text-xs text-gray-600 truncate">
                                {template.pay_value} hrs
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}

          {/* Roster Grid */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {selectedCategory?.name} Roster
                </CardTitle>
                {canEditRoster && !isMobile && (
                  <div className="flex items-center space-x-2">
                    <Select value={sortBy} onValueChange={(value: 'first_name' | 'last_name' | 'department' | 'custom') => setSortBy(value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="first_name">First Name</SelectItem>
                        <SelectItem value="last_name">Last Name</SelectItem>
                        <SelectItem value="department">Job Title</SelectItem>
                        <SelectItem value="custom">Custom Order</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSortDialog(true)}
                    >
                      <ArrowUpDown className="w-4 h-4 mr-2" />
                      Custom Sort
                    </Button>
                  </div>
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
                              <div className="flex items-center justify-center mt-1 text-xs text-blue-600">
                                <Users className="w-3 h-3 mr-1" />
                                {getStaffCountForDate(day.toISOString())}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {employees.map((employee) => (
                          <tr key={employee.id} className="border-b">
                            <td className="p-3 font-medium min-w-[160px]">
                              <div>{employee.first_name} {employee.last_name}</div>
                              <div className="text-sm text-gray-500">{employee.department}</div>
                            </td>
                            {weekDays.map((day) => {
                              const shift = getShiftForEmployeeAndDate(employee.id, day.toISOString());
                              const template = shiftTemplates?.find(t => 
                                shift && t.position === shift.position && 
                                t.start_time === shift.start_time && 
                                t.end_time === shift.end_time
                              );
                              return (
                                <td
                                  key={day.toISOString()}
                                  className="p-2 border-r border-l min-w-32"
                                  onDrop={canEditRoster && !isMobile ? () => handleDrop(employee.id, day.toISOString()) : undefined}
                                  onDragOver={canEditRoster && !isMobile ? handleDragOver : undefined}
                                >
                                  <div 
                                    className={cn(
                                      "min-h-16 border-2 border-dashed border-gray-200 rounded p-2 transition-colors relative group",
                                      canEditRoster && !shift && "cursor-pointer hover:border-gray-300",
                                      !canEditRoster && "cursor-default"
                                    )}
                                    style={{
                                      backgroundColor: (canEditRoster && !isMobile && (draggedTemplate || draggedShift)) ? '#f0f9ff' : 'transparent'
                                    }}
                                    onClick={canEditRoster ? () => handleCellClick(
                                      employee.id, 
                                      `${employee.first_name} ${employee.last_name}`, 
                                      day.toISOString(),
                                      shift
                                    ) : undefined}
                                  >
                                    {shift ? (
                                      <div 
                                        draggable={canEditRoster && !isMobile}
                                        onDragStart={canEditRoster && !isMobile ? () => handleShiftDragStart(shift) : undefined}
                                        onDragEnd={canEditRoster && !isMobile ? handleDragEnd : undefined}
                                        className={cn(
                                          "p-2 rounded text-xs transition-shadow",
                                          canEditRoster ? "cursor-pointer hover:shadow-md" : "cursor-default",
                                          !isMobile && canEditRoster && "hover:cursor-move"
                                        )}
                                        style={{ 
                                          backgroundColor: template?.color + '20' || '#3B82F6' + '20',
                                          borderColor: template?.color || '#3B82F6'
                                        }}
                                        onDoubleClick={canEditRoster && !isMobile ? () => deleteShiftMutation.mutate(shift.id) : undefined}
                                        title={canEditRoster ? (isMobile ? "Tap to edit or remove" : "Drag to move, click to edit, or double-click to delete") : "View only"}
                                      >
                                        <div className="font-medium">{shift.position}</div>
                                        <div>{shift.start_time} - {shift.end_time}</div>
                                      </div>
                                    ) : (
                                      canEditRoster && (
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center h-full">
                                          <Plus className="w-4 h-4 text-gray-400" />
                                        </div>
                                      )
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
                  <p className="text-gray-500">
                    {selectedCategory ? 
                      (canEditRoster 
                        ? `No staff assigned to ${selectedCategory.name}. Add staff using the button above.`
                        : `No staff assigned to ${selectedCategory.name}.`
                      ) :
                      'Select a category to view and manage rosters.'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!selectedCategoryId && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Select a roster category above to begin {canEditRoster ? 'managing' : 'viewing'} shifts and staff assignments.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Roster;
