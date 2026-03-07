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
import { Plus, Pencil, Trash2, ClipboardCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserCompanyId } from '@/hooks/useUserCompanyId';

interface CustomField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'yes_no' | 'select' | 'textarea';
  required: boolean;
  options?: string[];
}

interface ReviewTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  is_active: boolean;
  auto_schedule: boolean;
  schedule_interval_days: number;
  schedule_count: number | null;
  auto_create_on_hire: boolean;
  custom_fields: CustomField[];
  sort_order: number;
}

const CATEGORIES = [
  { value: 'probation', label: 'Probation' },
  { value: 'supervision', label: 'Supervision' },
  { value: 'appraisal', label: 'Appraisal' },
];

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'yes_no', label: 'Yes / No' },
  { value: 'select', label: 'Dropdown' },
];

interface Props {
  companyId?: string;
}

const ReviewTypeManager = ({ companyId: propCompanyId }: Props) => {
  const { companyId: hookCompanyId } = useUserCompanyId();
  const companyId = propCompanyId || hookCompanyId;
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ReviewTemplate | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'supervision',
    description: '',
    is_active: true,
    auto_schedule: false,
    schedule_interval_days: 30,
    schedule_count: null as number | null,
    auto_create_on_hire: false,
    custom_fields: [] as CustomField[],
  });

  const [newField, setNewField] = useState<CustomField>({ key: '', label: '', type: 'text', required: false });
  const [newFieldOptions, setNewFieldOptions] = useState('');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['review-type-templates', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('review_type_templates' as any)
        .select('*')
        .eq('company_id', companyId!)
        .order('sort_order');
      if (error) throw error;
      return (data || []) as unknown as ReviewTemplate[];
    },
    enabled: !!companyId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editing) {
        const { error } = await supabase.from('review_type_templates' as any).update(data).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('review_type_templates' as any).insert({ ...data, company_id: companyId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-type-templates', companyId] });
      toast.success(editing ? 'Review type updated' : 'Review type created');
      closeForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('review_type_templates' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-type-templates', companyId] });
      toast.success('Review type deleted');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const openCreate = () => {
    setEditing(null);
    setFormData({
      name: '', category: 'supervision', description: '', is_active: true,
      auto_schedule: false, schedule_interval_days: 30, schedule_count: null,
      auto_create_on_hire: false, custom_fields: [],
    });
    setShowForm(true);
  };

  const openEdit = (t: ReviewTemplate) => {
    setEditing(t);
    setFormData({
      name: t.name, category: t.category, description: t.description || '',
      is_active: t.is_active, auto_schedule: t.auto_schedule,
      schedule_interval_days: t.schedule_interval_days || 30,
      schedule_count: t.schedule_count, auto_create_on_hire: t.auto_create_on_hire,
      custom_fields: t.custom_fields || [],
    });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditing(null); };

  const addCustomField = () => {
    if (!newField.label.trim()) { toast.error('Label required'); return; }
    const key = newField.label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const field: CustomField = {
      ...newField, key,
      options: newField.type === 'select' ? newFieldOptions.split(',').map(o => o.trim()).filter(Boolean) : undefined,
    };
    setFormData(p => ({ ...p, custom_fields: [...p.custom_fields, field] }));
    setNewField({ key: '', label: '', type: 'text', required: false });
    setNewFieldOptions('');
  };

  const removeCustomField = (idx: number) => {
    setFormData(p => ({ ...p, custom_fields: p.custom_fields.filter((_, i) => i !== idx) }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) { toast.error('Name is required'); return; }
    saveMutation.mutate(formData);
  };

  const getCategoryBadge = (cat: string) => {
    const colors: Record<string, string> = {
      probation: 'bg-amber-100 text-amber-800',
      supervision: 'bg-blue-100 text-blue-800',
      appraisal: 'bg-emerald-100 text-emerald-800',
    };
    return <Badge className={colors[cat] || ''}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5" />
              Review Types
            </CardTitle>
            <CardDescription>Configure probation reviews, supervisions, and appraisals with custom form schemas and scheduling</CardDescription>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />Add Type
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-6 text-muted-foreground">Loading...</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No review types configured yet</p>
            <p className="text-sm mt-1">Add types like Probation Review, Monthly Supervision, Annual Appraisal</p>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map(t => (
              <div key={t.id} className="border rounded-lg">
                <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{t.name}</span>
                    {getCategoryBadge(t.category)}
                    {!t.is_active && <Badge variant="secondary">Inactive</Badge>}
                    {t.auto_schedule && <Badge variant="outline">Auto-scheduled</Badge>}
                    {(t.custom_fields?.length || 0) > 0 && <Badge variant="outline">{t.custom_fields.length} fields</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(t); }}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(t.id); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    {expandedId === t.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
                {expandedId === t.id && (
                  <div className="px-4 pb-4 border-t pt-3 space-y-2 text-sm">
                    {t.description && <p className="text-muted-foreground">{t.description}</p>}
                    <div className="flex gap-4">
                      {t.auto_schedule && <span>Every {t.schedule_interval_days} days{t.schedule_count ? `, max ${t.schedule_count}` : ''}</span>}
                      {t.auto_create_on_hire && <span>Auto-creates on new employment</span>}
                    </div>
                    {t.custom_fields?.length > 0 && (
                      <div className="space-y-1 mt-2">
                        <p className="font-medium">Form Fields:</p>
                        {t.custom_fields.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-muted-foreground pl-2">
                            <span>• {f.label}</span>
                            <Badge variant="outline" className="text-xs">{f.type === 'yes_no' ? 'Yes/No' : f.type}</Badge>
                            {f.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
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
            <DialogTitle>{editing ? 'Edit Review Type' : 'Add Review Type'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Monthly Supervision" />
              </div>
              <div>
                <Label>Category *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={formData.is_active} onCheckedChange={(v) => setFormData(p => ({ ...p, is_active: v }))} />
              <Label>Active</Label>
            </div>

            {/* Scheduling */}
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-medium text-sm">Scheduling</h4>
              <div className="flex items-center gap-3">
                <Switch checked={formData.auto_schedule} onCheckedChange={(v) => setFormData(p => ({ ...p, auto_schedule: v }))} />
                <Label>Auto-schedule reviews at intervals</Label>
              </div>
              {formData.auto_schedule && (
                <div className="grid grid-cols-2 gap-4 pl-4">
                  <div>
                    <Label className="text-xs">Interval (days)</Label>
                    <Input type="number" value={formData.schedule_interval_days} onChange={(e) => setFormData(p => ({ ...p, schedule_interval_days: parseInt(e.target.value) || 30 }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Max reviews (blank = unlimited)</Label>
                    <Input type="number" value={formData.schedule_count ?? ''} onChange={(e) => setFormData(p => ({ ...p, schedule_count: e.target.value ? parseInt(e.target.value) : null }))} />
                  </div>
                </div>
              )}
              {formData.category === 'probation' && (
                <div className="flex items-center gap-3">
                  <Switch checked={formData.auto_create_on_hire} onCheckedChange={(v) => setFormData(p => ({ ...p, auto_create_on_hire: v }))} />
                  <Label>Auto-create when new employment record is added</Label>
                </div>
              )}
            </div>

            {/* Custom fields */}
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-medium text-sm">Form Fields</h4>
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
                <p className="text-sm font-medium text-muted-foreground">Add a form field</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Label</Label>
                    <Input value={newField.label} onChange={(e) => setNewField(p => ({ ...p, label: e.target.value }))} placeholder="e.g. Goals Met" />
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
                    <Input value={newFieldOptions} onChange={(e) => setNewFieldOptions(e.target.value)} placeholder="e.g. Excellent, Good, Satisfactory, Needs Improvement" />
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

export default ReviewTypeManager;
