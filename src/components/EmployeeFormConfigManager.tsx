import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Settings2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserCompanyId } from '@/hooks/useUserCompanyId';

interface CustomField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'yes_no' | 'select';
  required: boolean;
  options?: string[];
}

interface FieldConfig {
  visible: boolean;
  required: boolean;
}

interface FormConfig {
  id?: string;
  section: string;
  field_configs: Record<string, FieldConfig>;
  custom_fields: CustomField[];
}

const SECTIONS = [
  {
    key: 'personal_details',
    label: 'Personal Details',
    fields: [
      { key: 'first_name', label: 'First Name', alwaysVisible: true },
      { key: 'last_name', label: 'Last Name', alwaysVisible: true },
      { key: 'known_as', label: 'Known As' },
      { key: 'date_of_birth', label: 'Date of Birth' },
      { key: 'email', label: 'Personal Email', alwaysVisible: true },
      { key: 'work_email', label: 'Work Email' },
      { key: 'phone_number', label: 'Phone Number' },
      { key: 'national_insurance_number', label: 'National Insurance Number' },
      { key: 'tax_code', label: 'Tax Code' },
    ],
  },
  {
    key: 'emergency_contact',
    label: 'Emergency Contact',
    fields: [
      { key: 'name', label: 'Contact Name' },
      { key: 'relationship', label: 'Relationship' },
      { key: 'phone', label: 'Phone Number' },
    ],
  },
  {
    key: 'address',
    label: 'Address',
    fields: [
      { key: 'line_1', label: 'Address Line 1', alwaysVisible: true },
      { key: 'line_2', label: 'Address Line 2' },
      { key: 'city', label: 'City', alwaysVisible: true },
      { key: 'postcode', label: 'Postcode', alwaysVisible: true },
      { key: 'country', label: 'Country' },
      { key: 'start_date', label: 'Start Date', alwaysVisible: true },
      { key: 'end_date', label: 'End Date' },
    ],
  },
  {
    key: 'employment_history',
    label: 'Employment History',
    fields: [
      { key: 'job_title', label: 'Job Title', alwaysVisible: true },
      { key: 'location', label: 'Location' },
      { key: 'employment_type', label: 'Employment Type' },
      { key: 'contract_type', label: 'Contract Type' },
      { key: 'pay_rate', label: 'Pay Rate' },
      { key: 'pay_type', label: 'Pay Type' },
      { key: 'currency', label: 'Currency' },
      { key: 'hours_per_week', label: 'Hours Per Week' },
      { key: 'notice_period_weeks', label: 'Notice Period' },
      { key: 'probation_end_date', label: 'Probation End Date' },
      { key: 'start_date', label: 'Start Date', alwaysVisible: true },
      { key: 'end_date', label: 'End Date' },
    ],
  },
];

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'yes_no', label: 'Yes / No' },
  { value: 'select', label: 'Dropdown' },
];

interface Props {
  companyId?: string;
}

const EmployeeFormConfigManager = ({ companyId: propCompanyId }: Props) => {
  const { companyId: hookCompanyId } = useUserCompanyId();
  const companyId = propCompanyId || hookCompanyId;
  const queryClient = useQueryClient();

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['employee-form-configs', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_form_configs' as any)
        .select('*')
        .eq('company_id', companyId!);
      if (error) throw error;
      return (data || []) as unknown as (FormConfig & { id: string })[];
    },
    enabled: !!companyId,
  });

  const getConfigForSection = (sectionKey: string): FormConfig => {
    const existing = configs.find(c => c.section === sectionKey);
    if (existing) return existing;
    return { section: sectionKey, field_configs: {}, custom_fields: [] };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="w-5 h-5" />
          Employee Form Configuration
        </CardTitle>
        <CardDescription>Configure which fields are visible and required for each employee section, and add custom fields</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="personal_details">
          <TabsList className="flex-wrap mb-4">
            {SECTIONS.map(s => (
              <TabsTrigger key={s.key} value={s.key}>{s.label}</TabsTrigger>
            ))}
          </TabsList>
          {SECTIONS.map(section => (
            <TabsContent key={section.key} value={section.key}>
              <SectionConfigEditor
                section={section}
                config={getConfigForSection(section.key)}
                companyId={companyId!}
                onSaved={() => queryClient.invalidateQueries({ queryKey: ['employee-form-configs', companyId] })}
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

interface SectionConfigEditorProps {
  section: typeof SECTIONS[number];
  config: FormConfig;
  companyId: string;
  onSaved: () => void;
}

const SectionConfigEditor = ({ section, config, companyId, onSaved }: SectionConfigEditorProps) => {
  const [fieldConfigs, setFieldConfigs] = useState<Record<string, FieldConfig>>({});
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [newField, setNewField] = useState<CustomField>({ key: '', label: '', type: 'text', required: false });
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setFieldConfigs(config.field_configs || {});
    setCustomFields(config.custom_fields || []);
    setDirty(false);
  }, [config]);

  const getFieldConfig = (key: string, alwaysVisible?: boolean): FieldConfig => {
    if (fieldConfigs[key]) return fieldConfigs[key];
    return { visible: true, required: !!alwaysVisible };
  };

  const updateFieldConfig = (key: string, update: Partial<FieldConfig>) => {
    setFieldConfigs(prev => ({
      ...prev,
      [key]: { ...getFieldConfig(key), ...update },
    }));
    setDirty(true);
  };

  const addCustomField = () => {
    if (!newField.label.trim()) { toast.error('Label required'); return; }
    const key = newField.label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const field: CustomField = {
      ...newField,
      key,
      options: newField.type === 'select' ? newFieldOptions.split(',').map(o => o.trim()).filter(Boolean) : undefined,
    };
    setCustomFields(prev => [...prev, field]);
    setNewField({ key: '', label: '', type: 'text', required: false });
    setNewFieldOptions('');
    setDirty(true);
  };

  const removeCustomField = (idx: number) => {
    setCustomFields(prev => prev.filter((_, i) => i !== idx));
    setDirty(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        company_id: companyId,
        section: section.key,
        field_configs: fieldConfigs,
        custom_fields: customFields,
      };
      if (config.id) {
        const { error } = await supabase
          .from('employee_form_configs' as any)
          .update({ field_configs: fieldConfigs, custom_fields: customFields })
          .eq('id', config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('employee_form_configs' as any)
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Configuration saved');
      setDirty(false);
      onSaved();
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      {/* Built-in fields */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Standard Fields</h4>
        <div className="space-y-2">
          {section.fields.map(f => {
            const fc = getFieldConfig(f.key, f.alwaysVisible);
            return (
              <div key={f.key} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium">{f.label}</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={fc.visible}
                      onCheckedChange={(v) => updateFieldConfig(f.key, { visible: v })}
                      disabled={f.alwaysVisible}
                    />
                    <Label className="text-xs text-muted-foreground">Visible</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={fc.required}
                      onCheckedChange={(v) => updateFieldConfig(f.key, { required: v })}
                      disabled={f.alwaysVisible}
                    />
                    <Label className="text-xs text-muted-foreground">Required</Label>
                  </div>
                  {f.alwaysVisible && <Badge variant="outline" className="text-xs">Always shown</Badge>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom fields */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Custom Fields</h4>
        {customFields.length > 0 && (
          <div className="space-y-2">
            {customFields.map((f, i) => (
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
              <Input value={newField.label} onChange={(e) => setNewField(p => ({ ...p, label: e.target.value }))} placeholder="e.g. Employee ID" />
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
              <Input value={newFieldOptions} onChange={(e) => setNewFieldOptions(e.target.value)} placeholder="Option 1, Option 2, Option 3" />
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

      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !dirty}>
        {saveMutation.isPending ? 'Saving...' : 'Save Configuration'}
      </Button>
    </div>
  );
};

export default EmployeeFormConfigManager;
