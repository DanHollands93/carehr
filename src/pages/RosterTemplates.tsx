import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Edit, Trash2, Calendar, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, startOfWeek } from "date-fns";

type RepeatType = 'weekly' | 'bi_weekly' | 'monthly' | 'custom';

interface RosterTemplate {
  id: string;
  name: string;
  description: string;
  repeat_type: RepeatType;
  repeat_interval: number;
  is_active: boolean;
  created_at: string;
}

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

interface TemplateAssignment {
  id: string;
  roster_template_id: string;
  employee_id: string;
  day_of_period: number;
  shift_template_id: string;
}

const RosterTemplates = () => {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RosterTemplate | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [viewingAssignments, setViewingAssignments] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    repeat_type: "weekly" as RepeatType,
    repeat_interval: 1
  });

  const { data: rosterTemplates, isLoading } = useQuery({
    queryKey: ['roster-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roster_templates')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as RosterTemplate[];
    }
  });

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

  const { data: templateAssignments } = useQuery({
    queryKey: ['template-assignments', selectedTemplateId],
    queryFn: async () => {
      if (!selectedTemplateId) return [];
      
      const { data, error } = await supabase
        .from('roster_template_assignments')
        .select('*')
        .eq('roster_template_id', selectedTemplateId);
      
      if (error) throw error;
      return data as TemplateAssignment[];
    },
    enabled: !!selectedTemplateId
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<RosterTemplate, 'id' | 'created_at'>) => {
      const { error } = await supabase
        .from('roster_templates')
        .insert([data]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-templates'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Roster template created successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error creating roster template", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<RosterTemplate> & { id: string }) => {
      const { error } = await supabase
        .from('roster_templates')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-templates'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Roster template updated successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error updating roster template", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('roster_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-templates'] });
      toast({ title: "Roster template deleted successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error deleting roster template", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const applyTemplateMutation = useMutation({
    mutationFn: async ({ templateId, startDate }: { templateId: string; startDate: string }) => {
      const template = rosterTemplates?.find(t => t.id === templateId);
      if (!template || !templateAssignments) return;

      // Calculate period length
      let periodDays = 7; // weekly
      if (template.repeat_type === 'bi_weekly') periodDays = 14;
      else if (template.repeat_type === 'monthly') periodDays = 30;
      else if (template.repeat_type === 'custom') periodDays = template.repeat_interval * 7;

      const endDate = format(addDays(new Date(startDate), periodDays - 1), 'yyyy-MM-dd');

      // Create shifts for the period
      const shiftsToCreate = templateAssignments.map(assignment => {
        const shiftDate = format(addDays(new Date(startDate), assignment.day_of_period), 'yyyy-MM-dd');
        const shiftTemplate = shiftTemplates?.find(st => st.id === assignment.shift_template_id);
        
        return {
          employee_id: assignment.employee_id,
          date: shiftDate,
          start_time: shiftTemplate?.start_time || '09:00',
          end_time: shiftTemplate?.end_time || '17:00',
          position: shiftTemplate?.position || 'General',
          job_role_id: '00000000-0000-0000-0000-000000000000'
        };
      });

      // Insert shifts
      const { error: shiftsError } = await supabase
        .from('shifts')
        .insert(shiftsToCreate);
      
      if (shiftsError) throw shiftsError;

      // Record the application
      const { error: recordError } = await supabase
        .from('applied_roster_templates')
        .insert([{
          roster_template_id: templateId,
          start_date: startDate,
          end_date: endDate
        }]);
      
      if (recordError) throw recordError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast({ title: "Template applied successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error applying template", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      repeat_type: "weekly",
      repeat_interval: 1
    });
    setEditingTemplate(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      is_active: true
    };
    
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, ...submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (template: RosterTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      repeat_type: template.repeat_type,
      repeat_interval: template.repeat_interval
    });
    setIsDialogOpen(true);
  };

  const handleApplyTemplate = (templateId: string) => {
    const startDate = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    applyTemplateMutation.mutate({ templateId, startDate });
  };

  const getRepeatTypeLabel = (type: RepeatType, interval: number) => {
    switch (type) {
      case 'weekly': return 'Weekly';
      case 'bi_weekly': return 'Bi-weekly';
      case 'monthly': return 'Monthly';
      case 'custom': return `Every ${interval} weeks`;
      default: return type;
    }
  };

  const getDayName = (dayIndex: number, repeatType: RepeatType) => {
    if (repeatType === 'weekly') {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      return days[dayIndex] || `Day ${dayIndex + 1}`;
    }
    return `Day ${dayIndex + 1}`;
  };

  const canManageRosters = userRole === 'admin';

  if (!canManageRosters) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-600">Access Denied</h2>
        <p className="text-gray-500 mt-2">You don't have permission to manage roster templates.</p>
      </div>
    );
  }

  if (viewingAssignments && selectedTemplateId) {
    const selectedTemplate = rosterTemplates?.find(t => t.id === selectedTemplateId);
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Button variant="outline" onClick={() => setViewingAssignments(false)}>
              ← Back to Templates
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              {selectedTemplate?.name} - Assignments
            </h1>
            <p className="text-gray-600">
              {getRepeatTypeLabel(selectedTemplate?.repeat_type || 'weekly', selectedTemplate?.repeat_interval || 1)}
            </p>
          </div>
          
          <Button
            onClick={() => handleApplyTemplate(selectedTemplateId)}
            disabled={applyTemplateMutation.isPending}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Apply to Current Week
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Template Assignments</CardTitle>
            <CardDescription>
              Shifts assigned in this template pattern
            </CardDescription>
          </CardHeader>
          <CardContent>
            {templateAssignments && templateAssignments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templateAssignments.map((assignment) => {
                    const employee = employees?.find(e => e.id === assignment.employee_id);
                    const shiftTemplate = shiftTemplates?.find(st => st.id === assignment.shift_template_id);
                    
                    return (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          {employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown Employee'}
                        </TableCell>
                        <TableCell>
                          {getDayName(assignment.day_of_period, selectedTemplate?.repeat_type || 'weekly')}
                        </TableCell>
                        <TableCell>{shiftTemplate?.name}</TableCell>
                        <TableCell>{shiftTemplate?.position}</TableCell>
                        <TableCell>
                          {shiftTemplate?.start_time} - {shiftTemplate?.end_time}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No assignments found for this template.
                <br />
                Use the regular roster builder to create assignments, then save as a template.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roster Templates</h1>
          <p className="text-gray-600">Create repeating roster patterns for easy scheduling</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTemplate ? 'Edit' : 'Create'} Roster Template</DialogTitle>
              <DialogDescription>
                {editingTemplate ? 'Update the roster template details.' : 'Create a new roster template pattern.'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Standard Week Pattern"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this roster pattern..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="repeat_type">Repeat Pattern</Label>
                  <Select 
                    value={formData.repeat_type} 
                    onValueChange={(value: RepeatType) => 
                      setFormData({ ...formData, repeat_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi_weekly">Bi-weekly (2 weeks)</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.repeat_type === 'custom' && (
                  <div>
                    <Label htmlFor="repeat_interval">Repeat Every (weeks)</Label>
                    <Input
                      id="repeat_interval"
                      type="number"
                      min="1"
                      value={formData.repeat_interval}
                      onChange={(e) => setFormData({ ...formData, repeat_interval: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingTemplate ? 'Update' : 'Create'} Template
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roster Templates</CardTitle>
          <CardDescription>
            Manage your repeating roster patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Pattern</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rosterTemplates?.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>{template.description || '-'}</TableCell>
                    <TableCell>
                      {getRepeatTypeLabel(template.repeat_type, template.repeat_interval)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.is_active ? "default" : "secondary"}>
                        {template.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTemplateId(template.id);
                            setViewingAssignments(true);
                          }}
                        >
                          <Calendar className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApplyTemplate(template.id)}
                          disabled={applyTemplateMutation.isPending}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMutation.mutate(template.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RosterTemplates;
