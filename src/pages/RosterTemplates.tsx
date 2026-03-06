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
import { useUserCompanyId } from "@/hooks/useUserCompanyId";
import { Plus, Edit, Trash2, Calendar, Play, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TemplateRosterBuilder from "@/components/TemplateRosterBuilder";
import TemplateDeployment from "@/components/TemplateDeployment";
import AllocationLocationManager from "@/components/AllocationLocationManager";

type RepeatType = 'weekly' | 'bi_weekly' | 'monthly' | 'custom';

interface RosterTemplate {
  id: string;
  name: string;
  description: string;
  repeat_type: RepeatType;
  repeat_interval: number;
  is_active: boolean;
  created_at: string;
  end_date: string | null;
}

const RosterTemplates = () => {
  const { userRole } = useAuth();
  const { companyId } = useUserCompanyId();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RosterTemplate | null>(null);
  const [buildingTemplateId, setBuildingTemplateId] = useState<string>("");
  const [deployingTemplate, setDeployingTemplate] = useState<RosterTemplate | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    repeat_type: "weekly" as RepeatType,
    repeat_interval: 1,
    end_date: ""
  });

  const { data: rosterTemplates, isLoading } = useQuery({
    queryKey: ['roster-templates', companyId],
    queryFn: async () => {
      let query = supabase
        .from('roster_templates')
        .select('*')
        .order('name');
      if (companyId) query = query.eq('company_id', companyId);
      const { data, error } = await query;
      if (error) throw error;
      return data as RosterTemplate[];
    },
    enabled: !!companyId
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<RosterTemplate, 'id' | 'created_at'>) => {
      const templateData = {
        ...data,
        end_date: data.end_date || null
      };
      
      const { data: newTemplate, error } = await supabase
        .from('roster_templates')
        .insert([templateData])
        .select()
        .single();
      
      if (error) throw error;
      return newTemplate;
    },
    onSuccess: (newTemplate) => {
      queryClient.invalidateQueries({ queryKey: ['roster-templates'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Roster template created successfully" });
      
      // Automatically open the builder for the new template
      setBuildingTemplateId(newTemplate.id);
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
      const updateData = {
        ...data,
        end_date: data.end_date || null
      };
      
      const { error } = await supabase
        .from('roster_templates')
        .update(updateData)
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

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      repeat_type: "weekly",
      repeat_interval: 1,
      end_date: ""
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
      repeat_interval: template.repeat_interval,
      end_date: template.end_date || ""
    });
    setIsDialogOpen(true);
  };

  const getRepeatTypeLabel = (type: RepeatType, interval: number) => {
    switch (type) {
      case 'weekly': return 'Weekly (7 days)';
      case 'bi_weekly': return 'Bi-weekly (14 days)';
      case 'monthly': return 'Monthly (28 days)';
      case 'custom': return `Every ${interval} weeks (${interval * 7} days)`;
      default: return type;
    }
  };

  const canManageRosters = userRole === 'admin' || userRole === 'super_admin';

  if (!canManageRosters) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-600">Access Denied</h2>
        <p className="text-gray-500 mt-2">You don't have permission to manage roster templates.</p>
      </div>
    );
  }

  // Show template builder if building a template
  if (buildingTemplateId) {
    const template = rosterTemplates?.find(t => t.id === buildingTemplateId);
    if (!template) return null;

    return (
      <TemplateRosterBuilder
        templateId={buildingTemplateId}
        templateName={template.name}
        repeatType={template.repeat_type}
        repeatInterval={template.repeat_interval}
        onSave={() => {
          setBuildingTemplateId("");
          queryClient.invalidateQueries({ queryKey: ['roster-templates'] });
        }}
        onCancel={() => setBuildingTemplateId("")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roster Templates</h1>
          <p className="text-gray-600">Create reusable roster patterns that you can deploy to specific weeks</p>
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
                {editingTemplate ? 'Update the roster template details.' : 'Create a new roster template. After creating, you\'ll be able to build the roster pattern.'}
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
                  <Label htmlFor="repeat_type">Template Period</Label>
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
                      <SelectItem value="weekly">Weekly (7 days)</SelectItem>
                      <SelectItem value="bi_weekly">Bi-weekly (14 days)</SelectItem>
                      <SelectItem value="monthly">Monthly (28 days)</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.repeat_type === 'custom' && (
                  <div>
                    <Label htmlFor="repeat_interval">Period Length (weeks)</Label>
                    <Input
                      id="repeat_interval"
                      type="number"
                      min="1"
                      max="8"
                      value={formData.repeat_interval}
                      onChange={(e) => setFormData({ ...formData, repeat_interval: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="end_date">End Date (Optional)</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
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
            Create and manage your reusable roster patterns
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
                  <TableHead>Period</TableHead>
                  <TableHead>End Date</TableHead>
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
                      {template.end_date ? new Date(template.end_date).toLocaleDateString() : 'No end date'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.is_active && (!template.end_date || new Date(template.end_date) >= new Date()) ? "default" : "secondary"}>
                        {template.is_active && (!template.end_date || new Date(template.end_date) >= new Date()) ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBuildingTemplateId(template.id)}
                          title="Build/Edit Template"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeployingTemplate(template)}
                          title="Deploy Template"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(template)}
                          title="Edit Details"
                        >
                          <Calendar className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMutation.mutate(template.id)}
                          title="Delete Template"
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

      {deployingTemplate && (
        <TemplateDeployment
          templateId={deployingTemplate.id}
          templateName={deployingTemplate.name}
          repeatType={deployingTemplate.repeat_type}
          repeatInterval={deployingTemplate.repeat_interval}
          isOpen={!!deployingTemplate}
          onClose={() => setDeployingTemplate(null)}
        />
      )}
    </div>
  );
};

export default RosterTemplates;
