import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { Settings, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NotificationTemplate {
  id: string;
  name: string;
  title_template: string;
  message_template: string;
  type: 'success' | 'warning' | 'info';
  category: string;
  trigger_event: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Available trigger events with descriptions
const TRIGGER_EVENTS = [
  { value: 'holiday_approved', label: 'Holiday Approved', description: 'When a holiday request is approved by a manager' },
  { value: 'holiday_rejected', label: 'Holiday Rejected', description: 'When a holiday request is rejected by a manager' },
  { value: 'holiday_submitted', label: 'Holiday Submitted', description: 'When an employee submits a new holiday request' },
  { value: 'profile_updated', label: 'Profile Updated', description: 'When an employee updates their profile information' },
  { value: 'shift_assigned', label: 'Shift Assigned', description: 'When a new shift is assigned to an employee' },
  { value: 'policy_updated', label: 'Policy Updated', description: 'When company policies are updated' },
  { value: 'training_assigned', label: 'Training Assigned', description: 'When training is assigned to an employee' },
  { value: 'document_uploaded', label: 'Document Uploaded', description: 'When a new document is uploaded to the system' },
  { value: 'system_maintenance', label: 'System Maintenance', description: 'System maintenance notifications' }
];

// Available dynamic content variables with descriptions
const DYNAMIC_VARIABLES = [
  { value: 'employee_name', label: 'Employee Name', description: 'Full name of the employee' },
  { value: 'first_name', label: 'First Name', description: 'Employee\'s first name' },
  { value: 'last_name', label: 'Last Name', description: 'Employee\'s last name' },
  { value: 'approver_name', label: 'Approver Name', description: 'Name of the person who approved/rejected' },
  { value: 'start_date', label: 'Start Date', description: 'Start date for holidays or events' },
  { value: 'end_date', label: 'End Date', description: 'End date for holidays or events' },
  { value: 'rejection_reason', label: 'Rejection Reason', description: 'Reason for rejection' },
  { value: 'department', label: 'Department', description: 'Employee\'s department' },
  { value: 'job_title', label: 'Job Title', description: 'Employee\'s job title' },
  { value: 'manager_name', label: 'Manager Name', description: 'Name of the employee\'s manager' },
  { value: 'shift_date', label: 'Shift Date', description: 'Date of the assigned shift' },
  { value: 'shift_time', label: 'Shift Time', description: 'Time of the assigned shift' },
  { value: 'document_name', label: 'Document Name', description: 'Name of the uploaded document' },
  { value: 'policy_name', label: 'Policy Name', description: 'Name of the updated policy' },
  { value: 'training_name', label: 'Training Name', description: 'Name of the assigned training' }
];

const NotificationTemplateManager = () => {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const canManageTemplates = hasPermission('manage_users'); // Using admin permission

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error",
        description: "Failed to load notification templates",
        variant: "destructive"
      });
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  };

  const saveTemplate = async (template: Partial<NotificationTemplate>) => {
    if (editingTemplate) {
      // Update existing template
      const { error } = await supabase
        .from('notification_templates')
        .update({
          ...template,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingTemplate.id);

      if (error) {
        console.error('Error updating template:', error);
        toast({
          title: "Error",
          description: "Failed to update template",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Template updated successfully"
        });
        setEditingTemplate(null);
        loadTemplates();
      }
    } else {
      // Create new template
      const { error } = await supabase
        .from('notification_templates')
        .insert(template);

      if (error) {
        console.error('Error creating template:', error);
        toast({
          title: "Error",
          description: "Failed to create template",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Template created successfully"
        });
        setIsCreating(false);
        loadTemplates();
      }
    }
  };

  const deleteTemplate = async (templateId: string) => {
    const { error } = await supabase
      .from('notification_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Template deleted successfully"
      });
      loadTemplates();
    }
  };

  if (!canManageTemplates) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">You don't have permission to manage notification templates.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">Loading templates...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Notification Templates</h2>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      {(isCreating || editingTemplate) && (
        <TemplateForm
          template={editingTemplate}
          onSave={saveTemplate}
          onCancel={() => {
            setIsCreating(false);
            setEditingTemplate(null);
          }}
        />
      )}

      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{template.category}</Badge>
                    <Badge variant={template.type === 'success' ? 'default' : template.type === 'warning' ? 'destructive' : 'secondary'}>
                      {template.type}
                    </Badge>
                    <Badge variant={template.is_active ? 'default' : 'secondary'}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingTemplate(template)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteTemplate(template.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <Label className="text-sm font-medium">Title Template:</Label>
                  <p className="text-sm text-gray-600">{template.title_template}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Message Template:</Label>
                  <p className="text-sm text-gray-600">{template.message_template}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Trigger Event:</Label>
                  <p className="text-sm text-gray-600">
                    {TRIGGER_EVENTS.find(e => e.value === template.trigger_event)?.label || template.trigger_event}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const TemplateForm = ({ template, onSave, onCancel }: {
  template: NotificationTemplate | null;
  onSave: (template: Partial<NotificationTemplate>) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    title_template: template?.title_template || '',
    message_template: template?.message_template || '',
    type: template?.type || 'info' as const,
    category: template?.category || '',
    trigger_event: template?.trigger_event || '',
    is_active: template?.is_active ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addDynamicContent = (variable: string, field: 'title' | 'message') => {
    const placeholder = `{{${variable}}}`;
    if (field === 'title') {
      setFormData(prev => ({
        ...prev,
        title_template: prev.title_template + placeholder
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        message_template: prev.message_template + placeholder
      }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{template ? 'Edit Template' : 'Create New Template'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="trigger_event">Trigger Event</Label>
              <Select value={formData.trigger_event} onValueChange={(value) => setFormData(prev => ({ ...prev, trigger_event: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select trigger event" />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_EVENTS.map((event) => (
                    <SelectItem key={event.value} value={event.value}>
                      <div>
                        <div className="font-medium">{event.label}</div>
                        <div className="text-xs text-gray-500">{event.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="title_template">Title Template</Label>
              <Select onValueChange={(value) => addDynamicContent(value, 'title')}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Add dynamic content" />
                </SelectTrigger>
                <SelectContent>
                  {DYNAMIC_VARIABLES.map((variable) => (
                    <SelectItem key={variable.value} value={variable.value}>
                      <div>
                        <div className="font-medium">{variable.label}</div>
                        <div className="text-xs text-gray-500">{variable.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              id="title_template"
              value={formData.title_template}
              onChange={(e) => setFormData(prev => ({ ...prev, title_template: e.target.value }))}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="message_template">Message Template</Label>
              <Select onValueChange={(value) => addDynamicContent(value, 'message')}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Add dynamic content" />
                </SelectTrigger>
                <SelectContent>
                  {DYNAMIC_VARIABLES.map((variable) => (
                    <SelectItem key={variable.value} value={variable.value}>
                      <div>
                        <div className="font-medium">{variable.label}</div>
                        <div className="text-xs text-gray-500">{variable.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              id="message_template"
              value={formData.message_template}
              onChange={(e) => setFormData(prev => ({ ...prev, message_template: e.target.value }))}
              required
              rows={3}
            />
            <p className="text-sm text-gray-500 mt-1">
              Use the dropdown above to add dynamic content or manually type variables with double curly braces (e.g., {{employee_name}})
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              Save Template
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default NotificationTemplateManager;
