
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShiftTemplate {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  color: string;
  position: string;
  pay_value: number;
  created_at: string;
}

const ShiftTemplates = () => {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    start_time: "",
    end_time: "",
    color: "#3B82F6",
    position: "",
    pay_value: 0
  });

  const { data: shiftTemplates, isLoading } = useQuery({
    queryKey: ['shift-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shift_templates')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as ShiftTemplate[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<ShiftTemplate, 'id' | 'created_at'>) => {
      const { error } = await supabase
        .from('shift_templates')
        .insert([data]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-templates'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Shift template created successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error creating shift template", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<ShiftTemplate> & { id: string }) => {
      const { error } = await supabase
        .from('shift_templates')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-templates'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Shift template updated successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error updating shift template", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shift_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-templates'] });
      toast({ title: "Shift template deleted successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error deleting shift template", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      start_time: "",
      end_time: "",
      color: "#3B82F6",
      position: "",
      pay_value: 0
    });
    setEditingTemplate(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (template: ShiftTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      start_time: template.start_time,
      end_time: template.end_time,
      color: template.color,
      position: template.position,
      pay_value: template.pay_value
    });
    setIsDialogOpen(true);
  };

  const canManageShifts = userRole === 'admin';

  if (!canManageShifts) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-600">Access Denied</h2>
        <p className="text-gray-500 mt-2">You don't have permission to manage shift templates.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shift Templates</h1>
          <p className="text-gray-600">Create and manage shift templates for rostering</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTemplate ? 'Edit' : 'Create'} Shift Template</DialogTitle>
              <DialogDescription>
                {editingTemplate ? 'Update the shift template details.' : 'Create a new shift template for rostering.'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Morning Shift"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="e.g., Cashier, Manager"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pay_value">Pay Rate (per hour)</Label>
                  <Input
                    id="pay_value"
                    type="number"
                    step="0.01"
                    value={formData.pay_value}
                    onChange={(e) => setFormData({ ...formData, pay_value: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
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
          <CardTitle>Shift Templates</CardTitle>
          <CardDescription>
            Manage your shift templates that can be used for rostering
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
                  <TableHead>Time</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Pay Rate</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shiftTemplates?.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>{template.start_time} - {template.end_time}</TableCell>
                    <TableCell>{template.position}</TableCell>
                    <TableCell>£{template.pay_value}/hr</TableCell>
                    <TableCell>
                      <div 
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: template.color }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
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

export default ShiftTemplates;
