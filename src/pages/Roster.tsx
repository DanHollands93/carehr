import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, addDays, addWeeks, subWeeks } from "date-fns";
import { cn } from "@/lib/utils";

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
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i)); // Mon-Fri

  const { data: employees } = useQuery({
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
    queryKey: ['shifts', format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const startDate = format(weekStart, 'yyyy-MM-dd');
      const endDate = format(addDays(weekStart, 4), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);
      
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
          job_role_id: '00000000-0000-0000-0000-000000000000' // Default job role
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
  };

  const handleDrop = (employeeId: string, date: string) => {
    if (draggedTemplate) {
      createShiftMutation.mutate({
        employeeId,
        date: format(new Date(date), 'yyyy-MM-dd'),
        template: draggedTemplate
      });
      setDraggedTemplate(null);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Weekly Roster</h1>
        <p className="text-gray-600">Drag and drop shifts to assign staff for this week</p>
        
        {/* Date Navigation - moved below the description */}
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Shift Templates Panel - Organized by Position */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Shift Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(groupedTemplates).map(([position, templates]) => (
                <div key={position} className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700 border-b pb-1">
                    {position}
                  </h4>
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        draggable
                        onDragStart={() => handleDragStart(template)}
                        className="p-3 rounded border cursor-move hover:shadow-md transition-shadow"
                        style={{ 
                          backgroundColor: template.color + '20',
                          borderColor: template.color 
                        }}
                      >
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-gray-600">
                          {template.start_time} - {template.end_time}
                        </div>
                        <div className="text-xs text-gray-600">
                          {template.pay_value} hrs
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Roster Grid */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Staff Roster</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-left font-medium border-b">Staff</th>
                    {weekDays.map((day) => (
                      <th key={day.toISOString()} className="p-3 text-center font-medium border-b min-w-32">
                        <div>{format(day, 'EEE')}</div>
                        <div className="text-sm text-gray-500">{format(day, 'MMM dd')}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees?.map((employee) => (
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
                                backgroundColor: draggedTemplate ? '#f0f9ff' : 'transparent'
                              }}
                            >
                              {shift && (
                                <div 
                                  className="p-2 rounded text-xs cursor-pointer"
                                  style={{ 
                                    backgroundColor: template?.color + '20' || '#3B82F6' + '20',
                                    borderColor: template?.color || '#3B82F6'
                                  }}
                                  onClick={() => deleteShiftMutation.mutate(shift.id)}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Roster;
