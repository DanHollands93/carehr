import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Save, Users, Trash2, ArrowUpDown, Plus } from "lucide-react";
import RosterCategoryManager from "@/components/RosterCategoryManager";
import StaffAssignmentManager from "@/components/StaffAssignmentManager";
import StaffSortingDialog from "@/components/StaffSortingDialog";
import ShiftCreationPopup from "@/components/ShiftCreationPopup";
import RoleSelectionDialog from "@/components/RoleSelectionDialog";
import { useRosterCategories } from "@/hooks/useRosterCategories";
import { useEmployeeJobRoles, useAllEmployeeJobRoles } from "@/hooks/useEmployeeJobRoles";
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

interface TemplateShift {
  id?: string;
  employee_id: string;
  day_index: number; // 0-based index within the template period
  shift_template_id: string;
  job_role_id?: string;
  pay_rate?: number;
}

interface LookupItem {
  id: string;
  category: string;
  value: string;
  is_active: boolean;
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
  const isMobile = useIsMobile();
  const [draggedTemplate, setDraggedTemplate] = useState<ShiftTemplate | null>(null);
  const [draggedShift, setDraggedShift] = useState<TemplateShift | null>(null);
  const [templateShifts, setTemplateShifts] = useState<TemplateShift[]>([]);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showDeleteBin, setShowDeleteBin] = useState(false);
  const [sortBy, setSortBy] = useState<'first_name' | 'last_name' | 'department' | 'custom'>('first_name');
  const [customOrder, setCustomOrder] = useState<string[]>([]);
  const [showSortDialog, setShowSortDialog] = useState(false);
  const [roleSelectionDialog, setRoleSelectionDialog] = useState<{
    isOpen: boolean;
    employeeId: string;
    employeeName: string;
    dayIndex: number;
    shiftTemplateId: string;
  }>({
    isOpen: false,
    employeeId: '',
    employeeName: '',
    dayIndex: 0,
    shiftTemplateId: ''
  });
  const [shiftPopup, setShiftPopup] = useState<{
    isOpen: boolean;
    employeeId: string;
    employeeName: string;
    dayIndex: number;
    existingShift?: TemplateShift;
  }>({
    isOpen: false,
    employeeId: '',
    employeeName: '',
    dayIndex: 0
  });
  
  const { categories, getAssignedEmployees } = useRosterCategories();
  const { data: allEmployeeJobRoles } = useAllEmployeeJobRoles();

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

  // Fetch positions from lookup_lists for grouping
  const { data: positions } = useQuery({
    queryKey: ['lookup-positions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lookup_lists')
        .select('*')
        .eq('category', 'positions')
        .eq('is_active', true)
        .order('value');
      
      if (error) throw error;
      return data as LookupItem[];
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

  // Get employee job roles for role selection
  const getEmployeeJobRoles = (employeeId: string) => {
    return allEmployeeJobRoles?.filter(ejr => ejr.employee_id === employeeId) || [];
  };

  const handleDragStart = (template: ShiftTemplate) => {
    if (isMobile) return;
    setDraggedTemplate(template);
    setDraggedShift(null);
    setShowDeleteBin(false);
  };

  const handleShiftDragStart = (shift: TemplateShift) => {
    if (isMobile) return;
    setDraggedShift(shift);
    setDraggedTemplate(null);
    setShowDeleteBin(true);
  };

  const handleDrop = (employeeId: string, dayIndex: number) => {
    if (isMobile) return;
    
    if (draggedTemplate) {
      const employee = employees.find(e => e.id === employeeId);
      const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : '';
      const employeeJobRoles = getEmployeeJobRoles(employeeId);
      
      // If employee has multiple job roles, show selection dialog
      if (employeeJobRoles.length > 1) {
        setRoleSelectionDialog({
          isOpen: true,
          employeeId,
          employeeName,
          dayIndex,
          shiftTemplateId: draggedTemplate.id
        });
      } else {
        // Use primary role or single role
        const jobRole = employeeJobRoles.find(r => r.is_primary) || employeeJobRoles[0];
        const newShift: TemplateShift = {
          employee_id: employeeId,
          day_index: dayIndex,
          shift_template_id: draggedTemplate.id,
          job_role_id: jobRole?.job_role_id,
          pay_rate: jobRole?.pay_rate || 0
        };
        
        setTemplateShifts(prev => [...prev, newShift]);
        setDraggedTemplate(null);
      }
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

  const handleRoleSelection = (roleId: string, payRate: number) => {
    if (draggedTemplate && roleSelectionDialog.employeeId) {
      const newShift: TemplateShift = {
        employee_id: roleSelectionDialog.employeeId,
        day_index: roleSelectionDialog.dayIndex,
        shift_template_id: roleSelectionDialog.shiftTemplateId,
        job_role_id: roleId,
        pay_rate: payRate
      };
      
      setTemplateShifts(prev => [...prev, newShift]);
      setDraggedTemplate(null);
    }
    
    setRoleSelectionDialog({
      isOpen: false,
      employeeId: '',
      employeeName: '',
      dayIndex: 0,
      shiftTemplateId: ''
    });
  };

  const handleDeleteDrop = () => {
    if (isMobile) return;
    if (draggedShift) {
      removeShift(draggedShift);
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

  const handleCellClick = (employeeId: string, employeeName: string, dayIndex: number) => {
    const existingShift = getShiftForEmployeeAndDay(employeeId, dayIndex);
    
    setShiftPopup({
      isOpen: true,
      employeeId,
      employeeName,
      dayIndex,
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
    // Find or create a shift template that matches this data
    const matchingTemplate = shiftTemplates?.find(t => 
      t.start_time === shiftData.start_time &&
      t.end_time === shiftData.end_time &&
      t.position === shiftData.position
    );

    const newShift: TemplateShift = {
      employee_id: shiftPopup.employeeId,
      day_index: shiftPopup.dayIndex,
      shift_template_id: matchingTemplate?.id || shiftTemplates?.[0]?.id || ''
    };
    
    setTemplateShifts(prev => [...prev, newShift]);
    setShiftPopup(prev => ({ ...prev, isOpen: false }));
  };

  const handleUpdateShiftFromPopup = (shiftData: {
    start_time: string;
    end_time: string;
    position: string;
    pay_value?: number;
    color?: string;
  }) => {
    if (!shiftPopup.existingShift) return;
    
    // Find a matching template
    const matchingTemplate = shiftTemplates?.find(t => 
      t.start_time === shiftData.start_time &&
      t.end_time === shiftData.end_time &&
      t.position === shiftData.position
    );

    setTemplateShifts(prev => 
      prev.map(shift => 
        shift === shiftPopup.existingShift 
          ? { ...shift, shift_template_id: matchingTemplate?.id || shift.shift_template_id }
          : shift
      )
    );
    setShiftPopup(prev => ({ ...prev, isOpen: false }));
  };

  const handleDeleteShiftFromPopup = () => {
    if (shiftPopup.existingShift) {
      removeShift(shiftPopup.existingShift);
    }
    setShiftPopup(prev => ({ ...prev, isOpen: false }));
  };

  // Convert TemplateShift to look like a regular Shift for the popup
  const convertTemplateShiftForPopup = (templateShift: TemplateShift) => {
    const template = shiftTemplates?.find(t => t.id === templateShift.shift_template_id);
    if (!template) return undefined;
    
    return {
      id: templateShift.id || '',
      employee_id: templateShift.employee_id,
      date: '',
      start_time: template.start_time,
      end_time: template.end_time,
      position: template.position,
      job_role_id: ''
    };
  };

  return (
    <div className="space-y-6">
      {/* Role Selection Dialog */}
      <RoleSelectionDialog
        isOpen={roleSelectionDialog.isOpen}
        onClose={() => setRoleSelectionDialog({ isOpen: false, employeeId: '', employeeName: '', dayIndex: 0, shiftTemplateId: '' })}
        onSelectRole={handleRoleSelection}
        employeeName={roleSelectionDialog.employeeName}
        jobRoles={getEmployeeJobRoles(roleSelectionDialog.employeeId).map(ejr => ({
          id: ejr.job_role_id,
          title: ejr.job_roles?.title || 'Unknown',
          department: ejr.job_roles?.department || 'Unknown',
          pay_rate: ejr.pay_rate,
          currency: ejr.currency
        }))}
      />

      {/* Delete Bin - appears when dragging a shift on desktop */}
      {showDeleteBin && !isMobile && (
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

      {/* Shift Creation/Edit Popup */}
      <ShiftCreationPopup
        isOpen={shiftPopup.isOpen}
        onClose={() => setShiftPopup(prev => ({ ...prev, isOpen: false }))}
        onCreateShift={shiftPopup.existingShift ? handleUpdateShiftFromPopup : handleCreateShiftFromPopup}
        onDeleteShift={shiftPopup.existingShift ? handleDeleteShiftFromPopup : undefined}
        shiftTemplates={shiftTemplates || []}
        employeeName={shiftPopup.employeeName}
        date={`Day ${shiftPopup.dayIndex + 1}`}
        existingShift={shiftPopup.existingShift ? convertTemplateShiftForPopup(shiftPopup.existingShift) : undefined}
      />

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{templateName}</h2>
          <p className="text-gray-600">
            Template Period: {periodDays} days ({repeatType.replace('_', ' ')}) - {isMobile ? 'Tap shifts to edit or remove them' : 'Drag shifts to move between staff and days'}
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
          {/* Shift Templates Panel - only show on desktop */}
          {!isMobile && (
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
                              draggable={!isMobile}
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
          )}

          {/* Current Week Roster Grid */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {totalWeeks > 1 ? `Week ${currentWeek + 1} - ${selectedCategory?.name} Template` : `${selectedCategory?.name} Template`}
                </CardTitle>
                {!isMobile && (
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
                                onDrop={!isMobile ? () => handleDrop(employee.id, dayIndex) : undefined}
                                onDragOver={!isMobile ? handleDragOver : undefined}
                              >
                                <div 
                                  className="min-h-16 border-2 border-dashed border-gray-200 rounded p-2 hover:border-gray-300 transition-colors cursor-pointer"
                                  style={{
                                    backgroundColor: (!isMobile && (draggedTemplate || draggedShift)) ? '#f0f9ff' : 'transparent'
                                  }}
                                  onClick={() => handleCellClick(employee.id, `${employee.first_name} ${employee.last_name}`, dayIndex)}
                                >
                                  {shift && template ? (
                                    <div 
                                      draggable={!isMobile}
                                      onDragStart={!isMobile ? () => handleShiftDragStart(shift) : undefined}
                                      onDragEnd={!isMobile ? handleDragEnd : undefined}
                                      className="p-2 rounded text-xs cursor-pointer hover:shadow-md transition-shadow"
                                      style={{ 
                                        backgroundColor: template.color + '20',
                                        borderColor: template.color
                                      }}
                                      onDoubleClick={!isMobile ? () => removeShift(shift) : undefined}
                                      title={isMobile ? "Tap to edit or remove" : "Drag to move or delete, double-click to remove"}
                                    >
                                      <div className="font-medium">{template.position}</div>
                                      <div>{template.start_time} - {template.end_time}</div>
                                      {shift.pay_rate && (
                                        <div className="text-xs text-gray-500">£{shift.pay_rate}/hr</div>
                                      )}
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
