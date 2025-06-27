import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Save, Users, Trash2, ArrowUpDown } from "lucide-react";
import RosterCategoryManager from "@/components/RosterCategoryManager";
import StaffAssignmentManager from "@/components/StaffAssignmentManager";
import StaffSortingDialog from "@/components/StaffSortingDialog";
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
  const [draggedShift, setDraggedShift] = useState<TemplateShift | null>(null);
  const [templateShifts, setTemplateShifts] = useState<TemplateShift[]>([]);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showDeleteBin, setShowDeleteBin] = useState(false);
  const [sortBy, setSortBy] = useState<'first_name' | 'last_name' | 'department' | 'custom'>('first_name');
  const [customOrder, setCustomOrder] = useState<string[]>([]);
  const [showSortDialog, setShowSortDialog] = useState(false);
  
  const { categories, getAssignedEmployees } = useRosterCategories();

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
  const totalWeeks = Math.ceil(periodDays / 7);
  
  // Calculate days for current week view
  const currentWeekStartDay = currentWeek * 7;
  const currentWeekDays = Math.min(7, periodDays - currentWeekStartDay);
  const weekDays = Array.from({ length: currentWeekDays }, (_, i) => currentWeekStartDay + i);

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

      // Update template with category
      if (selectedCategoryId) {
        const { error: updateError } = await supabase
          .from('roster_templates')
          .update({ category_id: selectedCategoryId })
          .eq('id', templateId);
        
        if (updateError) throw updateError;
      }

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
    setDraggedShift(null);
    setShowDeleteBin(false);
  };

  const handleShiftDragStart = (shift: TemplateShift) => {
    setDraggedShift(shift);
    setDraggedTemplate(null);
    setShowDeleteBin(true);
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
    } else if (draggedShift) {
      setTemplateShifts(prev => 
        prev.map(shift => 
          shift === draggedShift 
            ? { ...shift, employee_id: employeeId, day_index: dayIndex }
            : shift
        )
      );
      setDraggedShift(null);
    }
    setShowDeleteBin(false);
  };

  const handleDeleteDrop = () => {
    if (draggedShift) {
      removeShift(draggedShift);
    }
    setShowDeleteBin(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnd = () => {
    setShowDeleteBin(false);
  };

  const removeShift = (shiftToRemove: TemplateShift) => {
    setTemplateShifts(prev => prev.filter(shift => shift !== shiftToRemove));
  };

  const getShiftForEmployeeAndDay = (employeeId: string, dayIndex: number) => {
    return templateShifts.find(shift => 
      shift.employee_id === employeeId && shift.day_index === dayIndex
    );
  };

  const getStaffCountForDay = (dayIndex: number) => {
    return templateShifts.filter(shift => shift.day_index === dayIndex).length;
  };

  const getDayLabel = (dayIndex: number) => {
    const dayOfWeek = dayIndex % 7;
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return dayNames[dayOfWeek];
  };

  // Group shift templates by position
  const groupedTemplates = shiftTemplates?.reduce((acc, template) => {
    if (!acc[template.position]) {
      acc[template.position] = [];
    }
    acc[template.position].push(template);
    return acc;
  }, {} as Record<string, ShiftTemplate[]>) || {};

  const selectedCategory = categories?.find(cat => cat.id === selectedCategoryId);

  const handleCustomSort = (newOrder: string[]) => {
    setCustomOrder(newOrder);
    setSortBy('custom');
    setShowSortDialog(false);
  };

  return (
    <div className="space-y-6">
      {/* Delete Bin - appears when dragging a shift */}
      {showDeleteBin && (
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

      {/* Staff Sorting Dialog */}
      <StaffSortingDialog
        isOpen={showSortDialog}
        onClose={() => setShowSortDialog(false)}
        employees={employees}
        onSave={handleCustomSort}
      />

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{templateName}</h2>
          <p className="text-gray-600">
            Template Period: {periodDays} days ({repeatType.replace('_', ' ')}) - Drag shifts to move between staff and days
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

      {/* Week Navigation - only show if more than one week */}
      {totalWeeks > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(Math.max(0, currentWeek - 1))}
                disabled={currentWeek === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex space-x-2">
                {Array.from({ length: totalWeeks }, (_, weekIndex) => (
                  <Button
                    key={weekIndex}
                    variant={currentWeek === weekIndex ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentWeek(weekIndex)}
                  >
                    Week {weekIndex + 1}
                  </Button>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(Math.min(totalWeeks - 1, currentWeek + 1))}
                disabled={currentWeek === totalWeeks - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedCategoryId && (
        <div className="space-y-6">
          {/* Shift Templates Panel */}
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
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Current Week Roster Grid */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {totalWeeks > 1 ? `Week ${currentWeek + 1} - ${selectedCategory?.name} Template` : `${selectedCategory?.name} Template`}
                </CardTitle>
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
              </div>
            </CardHeader>
            <CardContent>
              {employees && employees.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="p-3 text-left font-medium border-b">Staff</th>
                        {weekDays.map((dayIndex) => (
                          <th key={dayIndex} className="p-3 text-center font-medium border-b min-w-24">
                            <div className="text-sm">{getDayLabel(dayIndex)}</div>
                            <div className="text-xs text-gray-500">Day {dayIndex + 1}</div>
                            <div className="flex items-center justify-center mt-1 text-xs text-blue-600">
                              <Users className="w-3 h-3 mr-1" />
                              {getStaffCountForDay(dayIndex)}
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
                                    backgroundColor: (draggedTemplate || draggedShift) ? '#f0f9ff' : 'transparent'
                                  }}
                                >
                                  {shift && template && (
                                    <div 
                                      draggable
                                      onDragStart={() => handleShiftDragStart(shift)}
                                      onDragEnd={handleDragEnd}
                                      className="p-2 rounded text-xs cursor-move hover:shadow-md transition-shadow"
                                      style={{ 
                                        backgroundColor: template.color + '20',
                                        borderColor: template.color
                                      }}
                                      onDoubleClick={() => removeShift(shift)}
                                      title="Drag to move or delete, double-click to remove"
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
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {selectedCategory ? 
                      `No staff assigned to ${selectedCategory.name}. Add staff using the button above.` :
                      'Select a category to build roster templates.'
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
            <p className="text-gray-500">Select a roster category above to begin building your template.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TemplateRosterBuilder;
