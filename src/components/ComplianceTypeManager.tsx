import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, GripVertical, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserCompanyId } from '@/hooks/useUserCompanyId';

interface FieldCondition {
  field_key: string;
  value: string;
}

interface CustomField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'yes_no' | 'select';
  required: boolean;
  options?: string[]; // for select type
  condition?: FieldCondition; // show only when another field matches a value
}

interface ComplianceTemplate {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  show_reference_number: boolean;
  show_issue_date: boolean;
  show_expiry_date: boolean;
  custom_fields: CustomField[];
  sort_order: number;
}

interface Props {
  companyId?: string;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'yes_no', label: 'Yes / No' },
  { value: 'select', label: 'Dropdown' },
];

const ComplianceTypeManager = ({ companyId: propCompanyId }: Props) => {
  const { companyId: hookCompanyId } = useUserCompanyId();
  const companyId = propCompanyId || hookCompanyId;
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ComplianceTemplate | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    show_reference_number: true,
    show_issue_date: true,
    show_expiry_date: true,
    custom_fields: [] as CustomField[],
  });

  const [newField, setNewField] = useState<CustomField>({
    key: '',
    label: '',
    type: 'text',
    required: false,
    options: [],
    condition: undefined,
  });
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [enableCondition, setEnableCondition] = useState(false);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['compliance-type-templates', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_type_templates' as any)
        .select('*')
        .eq('company_id', companyId!)
        .order('sort_order');
      if (error) throw error;
      return (data || []) as unknown as ComplianceTemplate[];
    },
    enabled: !!companyId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editing) {
        const { error } = await supabase
          .from('compliance_type_templates' as any)
          .update(data)
          .eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('compliance_type_templates' as any)
          .insert({ ...data, company_id: companyId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-type-templates', companyId] });
      toast.success(editing ? 'Compliance type updated' : 'Compliance type created');
      closeForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('compliance_type_templates' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-type-templates', companyId] });
      toast.success('Compliance type deleted');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const openCreate = () => {
    setEditing(null);
    setFormData({
      name: '', description: '', is_active: true,
      show_reference_number: true, show_issue_date: true, show_expiry_date: true,
      custom_fields: [],
    });
    setShowForm(true);
  };

  const openEdit = (t: ComplianceTemplate) => {
    setEditing(t);
    setFormData({
      name: t.name,
      description: t.description || '',
      is_active: t.is_active,
      show_reference_number: t.show_reference_number,
      show_issue_date: t.show_issue_date,
      show_expiry_date: t.show_expiry_date,
      custom_fields: t.custom_fields || [],
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const addCustomField = () => {
    if (!newField.label.trim()) {
      toast.error('Field label is required');
      return;
    }
    const key = newField.label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const field: CustomField = {
      ...newField,
      key,
      options: newField.type === 'select' ? newFieldOptions.split(',').map(o => o.trim()).filter(Boolean) : undefined,
      condition: enableCondition && newField.condition?.field_key ? newField.condition : undefined,
    };
    setFormData(p => ({ ...p, custom_fields: [...p.custom_fields, field] }));
    setNewField({ key: '', label: '', type: 'text', required: false, options: [], condition: undefined });
    setNewFieldOptions('');
    setEnableCondition(false);
  };

  const removeCustomField = (idx: number) => {
    setFormData(p => ({ ...p, custom_fields: p.custom_fields.filter((_, i) => i !== idx) }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Compliance Types
            </CardTitle>
            <CardDescription>Define the compliance record types and custom fields for your organisation</CardDescription>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Type
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-6 text-muted-foreground">Loading...</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No compliance types configured yet</p>
            <p className="text-sm mt-1">Add types like DBS Check, Right to Work, First Aid etc. with custom fields</p>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((t) => (
              <div key={t.id} className="border rounded-lg">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{t.name}</span>
                    {!t.is_active && <Badge variant="secondary">Inactive</Badge>}
                    {(t.custom_fields?.length || 0) > 0 && (
                      <Badge variant="outline">{t.custom_fields.length} custom field{t.custom_fields.length !== 1 ? 's' : ''}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(t); }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(t.id); }}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                    {expandedId === t.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
                {expandedId === t.id && (
                  <div className="px-4 pb-4 border-t pt-3 space-y-2">
                    {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
                    <div className="flex gap-4 text-sm">
                      <span>Reference #: {t.show_reference_number ? '✓' : '✗'}</span>
                      <span>Issue Date: {t.show_issue_date ? '✓' : '✗'}</span>
                      <span>Expiry Date: {t.show_expiry_date ? '✓' : '✗'}</span>
                    </div>
                    {t.custom_fields?.length > 0 && (
                      <div className="space-y-1 mt-2">
                        <p className="text-sm font-medium">Custom Fields:</p>
                        {t.custom_fields.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground pl-2">
                            <span>• {f.label}</span>
                            <Badge variant="outline" className="text-xs">{f.type === 'yes_no' ? 'Yes/No' : f.type}</Badge>
                            {f.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
                            {f.type === 'select' && f.options && (
                              <span className="text-xs">({f.options.join(', ')})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Compliance Type' : 'Add Compliance Type'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic info */}
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="e.g. DBS Check" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Describe this compliance type..." />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={formData.is_active} onCheckedChange={(v) => setFormData(p => ({ ...p, is_active: v }))} />
                <Label>Active</Label>
              </div>
            </div>

            {/* Standard field toggles */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Standard Fields</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <Switch checked={formData.show_reference_number} onCheckedChange={(v) => setFormData(p => ({ ...p, show_reference_number: v }))} />
                  <Label className="text-sm">Reference Number</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.show_issue_date} onCheckedChange={(v) => setFormData(p => ({ ...p, show_issue_date: v }))} />
                  <Label className="text-sm">Issue Date</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.show_expiry_date} onCheckedChange={(v) => setFormData(p => ({ ...p, show_expiry_date: v }))} />
                  <Label className="text-sm">Expiry Date</Label>
                </div>
              </div>
            </div>

            {/* Custom fields */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Custom Fields</h4>
              {formData.custom_fields.length > 0 && (
                <div className="space-y-2">
                  {formData.custom_fields.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 border rounded bg-muted/30">
                      <span className="flex-1 text-sm font-medium">{f.label}</span>
                      <Badge variant="outline" className="text-xs">{f.type === 'yes_no' ? 'Yes/No' : f.type}</Badge>
                      {f.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeCustomField(i)}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="border rounded-lg p-3 space-y-3 bg-muted/20">
                <p className="text-sm font-medium text-muted-foreground">Add a custom field</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Label</Label>
                    <Input value={newField.label} onChange={(e) => setNewField(p => ({ ...p, label: e.target.value }))} placeholder="e.g. Check Level" />
                  </div>
                  <div>
                    <Label className="text-xs">Type</Label>
                    <Select value={newField.type} onValueChange={(v: any) => setNewField(p => ({ ...p, type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map(ft => <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {newField.type === 'select' && (
                  <div>
                    <Label className="text-xs">Options (comma separated)</Label>
                    <Input value={newFieldOptions} onChange={(e) => setNewFieldOptions(e.target.value)} placeholder="e.g. Basic, Standard, Enhanced, Enhanced with Barred Lists" />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch checked={newField.required} onCheckedChange={(v) => setNewField(p => ({ ...p, required: v }))} />
                    <Label className="text-sm">Required</Label>
                  </div>
                  <Button size="sm" variant="outline" onClick={addCustomField}>
                    <Plus className="w-3 h-3 mr-1" /> Add Field
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ComplianceTypeManager;
