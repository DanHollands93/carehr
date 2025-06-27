
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft, ChevronRight, CalendarIcon, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, addDays, addWeeks, subWeeks } from "date-fns";
import { cn } from "@/lib/utils";
import RosterCategoryManager from "@/components/RosterCategoryManager";
import StaffAssignmentManager from "@/components/StaffAssignmentManager";
import { useRosterCategories } from "@/hooks/useRosterCategories";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [draggedTemplate, setDraggedTemplate] = useState<ShiftTemplate | null>(null);
  const [draggedShift, setDraggedShift] = useState<Shift | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  const { categories, getAssignedEmployees } = useRosterCategories();

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i)); // Mon-Fri

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

  // Filter employees based on category selection
  const employees = selectedCategoryId 
    ? allEmployees?.filter(emp => assignedEmployeeIds.includes(emp.id))
    : allEmployees;

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

  const { data: shifts } = useQuery({
    queryKey: ['shifts', format(weekStart, 'yyyy-MM-dd'), selectedCategoryId],
    queryFn: async () => {
      const startDate = format(weekStart, 'yyyy-MM-dd');
      const endDate = format(addDays(weekStart, 4), 'yyyy-MM-dd');
      
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

  const createShiftMutation = useMutation({
    mutationFn: async ({ employeeId, date, template }: {
      employeeId: string;
      date: string;
      template: ShiftTemplate;
    }) => {
      const { error } = await supabase
        .from('shifts')
        .insert([{
          employee_id: employeeId,
          date,
          start_time: template.start_time,
          end_time: template.end_time,
          position: template.position,
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
    setDraggedTemplate(template);
    setDraggedShift(null);
  };

  const handleShiftDragStart = (shift: Shift) => {
    setDraggedShift(shift);
    setDraggedTemplate(null);
  };

  const handleDrop = (employeeId: string, date: string) => {
    if (draggedTemplate) {
      createShiftMutation.mutate({
        employeeId,
        date: format(new Date(date), 'yyyy-MM-dd'),
        template: draggedTemplate
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
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
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

  const canManageRoster = userRole === 'admin';

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setCurrentWeek(date);
      setIsCalendarOpen(false);
    }
  };

  if (!canManageRoster) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-600">Access Denied</h2>
        <p className="text-gray-500 mt-2">You don't have permission to manage rosters.</p>
      </div>
    );
  }

  const selectedCategory = categories?.find(cat => cat.id === selectedCategoryId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Weekly Roster</h1>
        <p className="text-gray-600">Drag and drop shifts to assign staff or move shifts between staff and days</p>
        
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

      {/* Category Selection */}
      <RosterCategoryManager
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={setSelectedCategoryId}
      />

      {/* Staff Assignment for Selected Category */}
      {selectedCategory && (
        <StaffAssignmentManager
          categoryId={selectedCategory.id}
          categoryName={selectedCategory.name}
        />
      )}

      {selectedCategoryId && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Shift Templates Panel */}
          <Card className="lg:col-span-1">
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
                            draggable
                            onDragStart={() => handleDragStart(template)}
                            className="p-2 rounded border cursor-move hover:shadow-md transition-shadow text-xs"
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

          {/* Roster Grid */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>
                {selectedCategory?.name} Roster
              </CardTitle>
            </CardHeader>
            <CardContent>
              {employees && employees.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="p-3 text-left font-medium border-b">Staff</th>
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
                          <td className="p-3 font-medium">
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
                                className="p-2 border-r border-l"
                                onDrop={() => handleDrop(employee.id, day.toISOString())}
                                onDragOver={handleDragOver}
                              >
                                <div 
                                  className="min-h-16 border-2 border-dashed border-gray-200 rounded p-2 hover:border-gray-300 transition-colors"
                                  style={{
                                    backgroundColor: (draggedTemplate || draggedShift) ? '#f0f9ff' : 'transparent'
                                  }}
                                >
                                  {shift && (
                                    <div 
                                      draggable
                                      onDragStart={() => handleShiftDragStart(shift)}
                                      className="p-2 rounded text-xs cursor-move hover:shadow-md transition-shadow"
                                      style={{ 
                                        backgroundColor: template?.color + '20' || '#3B82F6' + '20',
                                        borderColor: template?.color || '#3B82F6'
                                      }}
                                      onDoubleClick={() => deleteShiftMutation.mutate(shift.id)}
                                      title="Drag to move, double-click to delete"
                                    >
                                      <div className="font-medium">{shift.position}</div>
                                      <div>{shift.start_time} - {shift.end_time}</div>
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
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {selectedCategory ? 
                      `No staff assigned to ${selectedCategory.name}. Add staff using the button above.` :
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
            <p className="text-gray-500">Select a roster category above to begin managing shifts and staff assignments.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Roster;
