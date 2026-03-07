import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Shield, AlertTriangle, CheckCircle, Clock, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ComplianceRecord {
  id: string;
  compliance_type: string;
  reference_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  status: string | null;
  notes: string | null;
}

const COMPLIANCE_TYPES = [
  'Right to Work',
  'DBS Check',
  'Passport',
  'Visa',
  'Professional Registration',
  'Driving Licence',
  'First Aid Certificate',
  'Food Hygiene Certificate',
  'Health & Safety Training',
  'Safeguarding Training',
  'Manual Handling Training',
  'Fire Safety Training',
  'GDPR Training',
  'Insurance',
  'Other',
];

const STATUS_OPTIONS = ['valid', 'expired', 'pending', 'not_required'];

interface EmployeeComplianceTabProps {
  employeeId: string;
  canEdit: boolean;
  // Legacy fields from employee record for migration display
  employee: {
    right_to_work_status?: string;
    passport_number?: string;
    visa_expiry?: string;
  };
}

const EmployeeComplianceTab = ({ employeeId, canEdit, employee }: EmployeeComplianceTabProps) => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ComplianceRecord | null>(null);
  const [formData, setFormData] = useState({
    compliance_type: '',
    reference_number: '',
    issue_date: '',
    expiry_date: '',
    status: 'valid',
    notes: '',
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['employee-compliance', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_compliance' as any)
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ComplianceRecord[];
    },
    enabled: !!employeeId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingRecord) {
        const { error } = await supabase
          .from('employee_compliance' as any)
          .update(data)
          .eq('id', editingRecord.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('employee_compliance' as any)
          .insert({ ...data, employee_id: employeeId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-compliance', employeeId] });
      toast.success(editingRecord ? 'Compliance record updated' : 'Compliance record added');
      closeForm();
    },
    onError: (err: any) => toast.error('Failed to save: ' + err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employee_compliance' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-compliance', employeeId] });
      toast.success('Compliance record deleted');
    },
    onError: (err: any) => toast.error('Failed to delete: ' + err.message),
  });

  const openCreate = () => {
    setEditingRecord(null);
    setFormData({ compliance_type: '', reference_number: '', issue_date: '', expiry_date: '', status: 'valid', notes: '' });
    setShowForm(true);
  };

  const openEdit = (record: ComplianceRecord) => {
    setEditingRecord(record);
    setFormData({
      compliance_type: record.compliance_type,
      reference_number: record.reference_number || '',
      issue_date: record.issue_date || '',
      expiry_date: record.expiry_date || '',
      status: record.status || 'valid',
      notes: record.notes || '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRecord(null);
  };

  const handleSave = () => {
    if (!formData.compliance_type) {
      toast.error('Please select a compliance type');
      return;
    }
    saveMutation.mutate(formData);
  };

  const getStatusBadge = (status: string | null, expiryDate: string | null) => {
    const isExpired = expiryDate && new Date(expiryDate) < new Date();
    const isExpiringSoon = expiryDate && !isExpired && new Date(expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    if (isExpired || status === 'expired') {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" />Expired</Badge>;
    }
    if (isExpiringSoon) {
      return <Badge className="gap-1 bg-amber-500 hover:bg-amber-600"><Clock className="w-3 h-3" />Expiring Soon</Badge>;
    }
    if (status === 'pending') {
      return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" />Pending</Badge>;
    }
    if (status === 'not_required') {
      return <Badge variant="outline" className="gap-1">Not Required</Badge>;
    }
    return <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-700"><CheckCircle className="w-3 h-3" />Valid</Badge>;
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-GB'); } catch { return d; }
  };

  return (
    <div className="space-y-6">
      {/* Legacy fields from employee record */}
      {(employee.right_to_work_status || employee.passport_number || employee.visa_expiry) && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Legacy Compliance Data</CardTitle>
            <CardDescription>These fields are from the original employee record. Add them as compliance records below for better tracking.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {employee.right_to_work_status && (
                <div><span className="font-medium text-muted-foreground">Right to Work:</span> {employee.right_to_work_status}</div>
              )}
              {employee.passport_number && (
                <div><span className="font-medium text-muted-foreground">Passport:</span> {employee.passport_number}</div>
              )}
              {employee.visa_expiry && (
                <div><span className="font-medium text-muted-foreground">Visa Expiry:</span> {formatDate(employee.visa_expiry)}</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Compliance Records
              </CardTitle>
              <CardDescription>Track right to work, DBS checks, certifications, and training records</CardDescription>
            </div>
            {canEdit && (
              <Button size="sm" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Add Record
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No compliance records yet</p>
              {canEdit && <p className="text-sm mt-1">Add records to track right to work, DBS checks, certifications and more</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <Card key={record.id} className="border">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{record.compliance_type}</span>
                          {getStatusBadge(record.status, record.expiry_date)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground mt-2">
                          {record.reference_number && <div>Ref: {record.reference_number}</div>}
                          {record.issue_date && <div>Issued: {formatDate(record.issue_date)}</div>}
                          {record.expiry_date && <div>Expires: {formatDate(record.expiry_date)}</div>}
                        </div>
                        {record.notes && <p className="text-sm text-muted-foreground mt-1">{record.notes}</p>}
                      </div>
                      {canEdit && (
                        <div className="flex gap-1 ml-4">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(record)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(record.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRecord ? 'Edit Compliance Record' : 'Add Compliance Record'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type *</Label>
              <Select value={formData.compliance_type} onValueChange={(v) => setFormData(p => ({ ...p, compliance_type: v }))}>
                <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                <SelectContent>
                  {COMPLIANCE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reference Number</Label>
              <Input value={formData.reference_number} onChange={(e) => setFormData(p => ({ ...p, reference_number: e.target.value }))} placeholder="e.g. certificate number" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Issue Date</Label>
                <Input type="date" value={formData.issue_date} onChange={(e) => setFormData(p => ({ ...p, issue_date: e.target.value }))} />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input type="date" value={formData.expiry_date} onChange={(e) => setFormData(p => ({ ...p, expiry_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))} placeholder="Any additional notes..." />
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
    </div>
  );
};

export default EmployeeComplianceTab;
