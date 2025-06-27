
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";

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

interface TemplateShift {
  id?: string;
  employee_id: string;
  day_index: number; // 0-based index within the template period
  shift_template_id: string;
}

interface TemplateRosterBuilderProps {
  templateId: string;
  templateName: string;
  repeatType: 'weekly' | 'bi_weekly' | 'monthly' | 'custom';
  repeatInterval: number;
  onSave: () => void;
  onCancel: () => void;
}

const TemplateRosterBuilder = ({ 
  templateId, 
  templateName, 
  repeatType, 
  repeatInterval,
  onSave, 
  onCancel 
}: TemplateRosterBuilderProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draggedTemplate, setDraggedTemplate] = useState<ShiftTemplate | null>(null);
  const [templateShifts, setTemplateShifts] = useState<TemplateShift[]>([]);

  // Calculate period length in days
  const getPeriodDays = () => {
    switch (repeatType) {
      case 'weekly': return 7;
      case 'bi_weekly': return 14;
      case 'monthly': return 28; // 4 weeks
      case 'custom': return repeatInterval * 7;
      default: return 7;
    }
  };

  const periodDays = getPeriodDays();
  const weekDays = Array.from({ length: periodDays }, (_, i) => i);

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

  // Load existing template assignments
  const { data: existingAssignments } = useQuery({
    queryKey: ['template-assignments', templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roster_template_assignments')
        .select('*')
        .eq('roster_template_id', templateId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!templateId
  });

  useEffect(() => {
    if (existingAssignments) {
      const shifts: TemplateShift[] = existingAssignments.map(assignment => ({
        id: assignment.id,
        employee_id: assignment.employee_id,
        day_index: assignment.day_of_period,
        shift_template_id: assignment.shift_template_id
      }));
      setTemplateShifts(shifts);
    }
  }, [existingAssignments]);

  const saveTemplateAssignmentsMutation = useMutation({
    mutationFn: async () => {
      // Delete existing assignments
      const { error: deleteError } = await supabase
        .from('roster_template_assignments')
        .delete()
        .eq('roster_template_id', templateId);
      
      if (deleteError) throw deleteError;

      // Insert new assignments
      if (templateShifts.length > 0) {
        const assignments = templateShifts.map(shift => ({
          roster_template_id: templateId,
          employee_id: shift.employee_id,
          day_of_period: shift.day_index,
          shift_template_id: shift.shift_template_id
        }));

        const { error: insertError } = await supabase
          .from('roster_template_assignments')
          .insert(assignments);
        
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-assignments'] });
      toast({ title: "Template saved successfully" });
      onSave();
    },
    onError: (error) => {
      toast({ 
        title: "Error saving template", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleDragStart = (template: ShiftTemplate) => {
    setDraggedTemplate(template);
  };

  const handleDrop = (employeeId: string, dayIndex: number) => {
    if (draggedTemplate) {
      const newShift: TemplateShift = {
        employee_id: employeeId,
        day_index: dayIndex,
        shift_template_id: draggedTemplate.id
      };
      
      setTemplateShifts(prev => [...prev, newShift]);
      setDraggedTemplate(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeShift = (employeeId: string, dayIndex: number) => {
    setTemplateShifts(prev => 
      prev.filter(shift => 
        !(shift.employee_id === employeeId && shift.day_index === dayIndex)
      )
    );
  };

  const getShiftForEmployeeAndDay = (employeeId: string, dayIndex: number) => {
    return templateShifts.find(shift => 
      shift.employee_id === employeeId && shift.day_index === dayIndex
    );
  };

  const getDayLabel = (dayIndex: number) => {
    const weekIndex = Math.floor(dayIndex / 7);
    const dayOfWeek = dayIndex % 7;
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    if (periodDays <= 7) {
      return dayNames[dayOfWeek];
    } else {
      return `W${weekIndex + 1} ${dayNames[dayOfWeek]}`;
    }
  };

  // Group shift templates by position
  const groupedTemplates = shiftTemplates?.reduce((acc, template) => {
    if (!acc[template.position]) {
      acc[template.position] = [];
    }
    acc[template.position].push(template);
    return acc;
  }, {} as Record<string, ShiftTemplate[]>) || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{templateName}</h2>
          <p className="text-gray-600">
            Template Period: {periodDays} days ({repeatType.replace('_', ' ')})
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => saveTemplateAssignmentsMutation.mutate()}>
            <Save className="w-4 h-4 mr-2" />
            Save Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Shift Templates Panel */}
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
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Template Roster Grid */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Template Roster</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-left font-medium border-b">Staff</th>
                    {weekDays.map((dayIndex) => (
                      <th key={dayIndex} className="p-3 text-center font-medium border-b min-w-24">
                        <div className="text-sm">{getDayLabel(dayIndex)}</div>
                        <div className="text-xs text-gray-500">Day {dayIndex + 1}</div>
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
                      {weekDays.map((dayIndex) => {
                        const shift = getShiftForEmployeeAndDay(employee.id, dayIndex);
                        const template = shift ? shiftTemplates?.find(t => t.id === shift.shift_template_id) : null;
                        
                        return (
                          <td
                            key={dayIndex}
                            className="p-2 border-r border-l"
                            onDrop={() => handleDrop(employee.id, dayIndex)}
                            onDragOver={handleDragOver}
                          >
                            <div 
                              className="min-h-16 border-2 border-dashed border-gray-200 rounded p-2 hover:border-gray-300 transition-colors"
                              style={{
                                backgroundColor: draggedTemplate ? '#f0f9ff' : 'transparent'
                              }}
                            >
                              {shift && template && (
                                <div 
                                  className="p-2 rounded text-xs cursor-pointer"
                                  style={{ 
                                    backgroundColor: template.color + '20',
                                    borderColor: template.color
                                  }}
                                  onClick={() => removeShift(employee.id, dayIndex)}
                                >
                                  <div className="font-medium">{template.position}</div>
                                  <div>{template.start_time} - {template.end_time}</div>
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

export default TemplateRosterBuilder;
