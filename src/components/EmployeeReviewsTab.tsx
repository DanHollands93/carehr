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
import { Plus, ClipboardCheck, Calendar, CheckCircle, Clock, AlertTriangle, Pencil, Lock, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserCompanyId } from '@/hooks/useUserCompanyId';

interface CustomField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'yes_no' | 'select';
  required: boolean;
  options?: string[];
}

interface ReviewTemplate {
  id: string;
  name: string;
  category: string;
  custom_fields: CustomField[];
}

interface Review {
  id: string;
  review_type: string;
  category: string;
  status: string;
  scheduled_date: string | null;
  completed_date: string | null;
  reviewer_notes: string | null;
  employee_notes: string | null;
  outcome: string | null;
  custom_fields: Record<string, any>;
  review_type_template_id: string | null;
}

const OUTCOMES: Record<string, string[]> = {
  probation: ['Passed', 'Extended', 'Failed'],
  supervision: ['Satisfactory', 'Needs Improvement', 'Unsatisfactory'],
  appraisal: ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement', 'Unsatisfactory'],
};

const STATUS_OPTIONS = ['scheduled', 'in_progress', 'completed', 'cancelled'];

interface Props {
  employeeId: string;
  canEdit: boolean;
  initialReviewId?: string;
}

const EmployeeReviewsTab = ({ employeeId, canEdit, initialReviewId }: Props) => {
  const { companyId } = useUserCompanyId();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [hasOpenedInitial, setHasOpenedInitial] = useState(false);

  const [formData, setFormData] = useState({
    review_type_template_id: '',
    review_type: '',
    category: 'supervision',
    status: 'scheduled',
    scheduled_date: '',
    completed_date: '',
    reviewer_notes: '',
    employee_notes: '',
    outcome: '',
    custom_fields: {} as Record<string, any>,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['review-type-templates', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('review_type_templates' as any)
        .select('*')
        .eq('company_id', companyId!)
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return (data || []) as unknown as ReviewTemplate[];
    },
    enabled: !!companyId,
  });

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['employee-reviews', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_reviews' as any)
        .select('*')
        .eq('employee_id', employeeId)
        .order('scheduled_date', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Review[];
    },
    enabled: !!employeeId,
  });


  const saveMutation = useMutation({
    mutationFn: async ({ data, completing }: { data: any; completing: boolean }) => {
      const payload = { ...data };
      if (!payload.review_type_template_id) delete payload.review_type_template_id;
      if (!payload.completed_date) delete payload.completed_date;
      if (!payload.outcome) delete payload.outcome;

      if (completing) {
        payload.status = 'completed';
        payload.completed_date = payload.completed_date || new Date().toISOString().split('T')[0];
      } else if (editingReview && payload.status === 'scheduled') {
        payload.status = 'in_progress';
      }

      if (editingReview) {
        const { error } = await supabase.from('employee_reviews' as any).update(payload).eq('id', editingReview.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('employee_reviews' as any).insert({ ...payload, employee_id: employeeId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-reviews', employeeId] });
      toast.success(editingReview ? 'Review updated' : 'Review created');
      closeForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const selectedTemplate = templates.find(t => t.id === formData.review_type_template_id);

  const openCreate = () => {
    setEditingReview(null);
    setFormData({
      review_type_template_id: '', review_type: '', category: 'supervision',
      status: 'scheduled', scheduled_date: '', completed_date: '',
      reviewer_notes: '', employee_notes: '', outcome: '', custom_fields: {},
    });
    setShowForm(true);
  };

  const openEdit = (r: Review) => {
    setEditingReview(r);
    setFormData({
      review_type_template_id: r.review_type_template_id || '',
      review_type: r.review_type, category: r.category,
      status: r.status, scheduled_date: r.scheduled_date || '',
      completed_date: r.completed_date || '', reviewer_notes: r.reviewer_notes || '',
      employee_notes: r.employee_notes || '', outcome: r.outcome || '',
      custom_fields: r.custom_fields || {},
    });
    setShowForm(true);
  };

  // Auto-open a specific review if initialReviewId is provided
  React.useEffect(() => {
    if (initialReviewId && reviews.length > 0 && !hasOpenedInitial) {
      const review = reviews.find(r => r.id === initialReviewId);
      if (review) {
        openEdit(review);
        setHasOpenedInitial(true);
      }
    }
  }, [initialReviewId, reviews, hasOpenedInitial]);

  const closeForm = () => { setShowForm(false); setEditingReview(null); };

  const handleTypeChange = (templateId: string) => {
    const t = templates.find(x => x.id === templateId);
    if (t) {
      setFormData(p => ({ ...p, review_type_template_id: t.id, review_type: t.name, category: t.category, custom_fields: {} }));
    }
  };

  const setCustomFieldValue = (key: string, value: any) => {
    setFormData(p => ({ ...p, custom_fields: { ...p.custom_fields, [key]: value } }));
  };

  const handleSave = (completing: boolean = false) => {
    if (!formData.review_type) { toast.error('Please select a review type'); return; }
    if (completing && selectedTemplate) {
      for (const f of selectedTemplate.custom_fields) {
        if (f.required && !formData.custom_fields[f.key]) {
          toast.error(`${f.label} is required`); return;
        }
      }
    }
    saveMutation.mutate({ data: formData, completing });
  };

  const isCompleted = editingReview?.status === 'completed';

  const getStatusBadge = (status: string) => {
    const map: Record<string, { icon: React.ReactNode; className: string }> = {
      scheduled: { icon: <Calendar className="w-3 h-3" />, className: '' },
      in_progress: { icon: <Clock className="w-3 h-3" />, className: 'bg-blue-100 text-blue-800' },
      completed: { icon: <CheckCircle className="w-3 h-3" />, className: 'bg-emerald-100 text-emerald-800' },
      cancelled: { icon: <AlertTriangle className="w-3 h-3" />, className: 'bg-muted text-muted-foreground' },
    };
    const s = map[status] || map.scheduled;
    return <Badge className={`gap-1 ${s.className}`}>{s.icon}{status.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}</Badge>;
  };

  const getCategoryBadge = (cat: string) => {
    const colors: Record<string, string> = {
      probation: 'bg-amber-100 text-amber-800',
      supervision: 'bg-blue-100 text-blue-800',
      appraisal: 'bg-emerald-100 text-emerald-800',
    };
    return <Badge variant="outline" className={colors[cat] || ''}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Badge>;
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-GB'); } catch { return d; }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2"><ClipboardCheck className="w-5 h-5" />Reviews</CardTitle>
              <CardDescription>Probation reviews, supervisions, and appraisals</CardDescription>
            </div>
            {canEdit && (
              <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Review</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map(r => {
                const template = templates.find(t => t.id === r.review_type_template_id);
                return (
                  <Card key={r.id} className="border">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-medium">{r.review_type}</span>
                            {getCategoryBadge(r.category)}
                            {getStatusBadge(r.status)}
                            {r.outcome && <Badge variant="outline">{r.outcome}</Badge>}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground mt-2">
                            {r.scheduled_date && <div>Scheduled: {formatDate(r.scheduled_date)}</div>}
                            {r.completed_date && <div>Completed: {formatDate(r.completed_date)}</div>}
                          </div>
                          {r.reviewer_notes && <p className="text-sm text-muted-foreground mt-1">Notes: {r.reviewer_notes}</p>}
                          {/* Custom field values */}
                          {template && template.custom_fields?.length > 0 && Object.keys(r.custom_fields || {}).length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm text-muted-foreground mt-1">
                              {template.custom_fields.map(f => {
                                const val = r.custom_fields?.[f.key];
                                if (val === undefined || val === null || val === '') return null;
                                const display = f.type === 'yes_no' ? (val ? 'Yes' : 'No') : String(val);
                                return <div key={f.key}>{f.label}: {display}</div>;
                              })}
                            </div>
                          )}
                        </div>
                        {canEdit && (
                          <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                            {r.status === 'completed' ? <Eye className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isCompleted && <Lock className="w-4 h-4 text-muted-foreground" />}
              {editingReview ? (isCompleted ? 'View Review' : 'Edit Review') : 'Add Review'}
            </DialogTitle>
            {isCompleted && (
              <p className="text-sm text-muted-foreground">This review has been completed and is locked.</p>
            )}
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Review Type *</Label>
              {editingReview ? (
                <Input value={formData.review_type} disabled className="bg-muted" />
              ) : templates.length > 0 ? (
                <Select value={formData.review_type_template_id} onValueChange={handleTypeChange}>
                  <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                  <SelectContent>
                    {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={formData.review_type} onChange={(e) => setFormData(p => ({ ...p, review_type: e.target.value }))} placeholder="e.g. Monthly Supervision" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Input value={formData.status.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())} disabled className="bg-muted" />
              </div>
              <div>
                <Label>Outcome</Label>
                <Select value={formData.outcome} onValueChange={(v) => setFormData(p => ({ ...p, outcome: v }))} disabled={isCompleted}>
                  <SelectTrigger disabled={isCompleted}><SelectValue placeholder="Select outcome..." /></SelectTrigger>
                  <SelectContent>
                    {(OUTCOMES[formData.category] || OUTCOMES.supervision).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Scheduled Date</Label>
                <Input type="date" value={formData.scheduled_date} onChange={(e) => setFormData(p => ({ ...p, scheduled_date: e.target.value }))} disabled={isCompleted} />
              </div>
              <div>
                <Label>Completed Date</Label>
                <Input type="date" value={formData.completed_date} onChange={(e) => setFormData(p => ({ ...p, completed_date: e.target.value }))} disabled={isCompleted} />
              </div>
            </div>

            {/* Custom fields from template */}
            {selectedTemplate && selectedTemplate.custom_fields?.length > 0 && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="text-sm font-medium text-muted-foreground">Review Form</h4>
                {selectedTemplate.custom_fields.map(field => (
                  <div key={field.key}>
                    <Label>{field.label}{field.required ? ' *' : ''}</Label>
                    {field.type === 'text' && (
                      <Input value={formData.custom_fields[field.key] || ''} onChange={(e) => setCustomFieldValue(field.key, e.target.value)} disabled={isCompleted} />
                    )}
                    {field.type === 'textarea' && (
                      <Textarea value={formData.custom_fields[field.key] || ''} onChange={(e) => setCustomFieldValue(field.key, e.target.value)} disabled={isCompleted} />
                    )}
                    {field.type === 'number' && (
                      <Input type="number" value={formData.custom_fields[field.key] || ''} onChange={(e) => setCustomFieldValue(field.key, e.target.value)} disabled={isCompleted} />
                    )}
                    {field.type === 'date' && (
                      <Input type="date" value={formData.custom_fields[field.key] || ''} onChange={(e) => setCustomFieldValue(field.key, e.target.value)} disabled={isCompleted} />
                    )}
                    {field.type === 'yes_no' && (
                      <div className="flex items-center gap-3 mt-1">
                        <Switch checked={formData.custom_fields[field.key] === true} onCheckedChange={(v) => setCustomFieldValue(field.key, v)} disabled={isCompleted} />
                        <span className="text-sm">{formData.custom_fields[field.key] ? 'Yes' : 'No'}</span>
                      </div>
                    )}
                    {field.type === 'select' && field.options && (
                      <Select value={formData.custom_fields[field.key] || ''} onValueChange={(v) => setCustomFieldValue(field.key, v)} disabled={isCompleted}>
                        <SelectTrigger disabled={isCompleted}><SelectValue placeholder={`Select...`} /></SelectTrigger>
                        <SelectContent>
                          {field.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div>
              <Label>Reviewer Notes</Label>
              <Textarea value={formData.reviewer_notes} onChange={(e) => setFormData(p => ({ ...p, reviewer_notes: e.target.value }))} disabled={isCompleted} />
            </div>
            <div>
              <Label>Employee Notes</Label>
              <Textarea value={formData.employee_notes} onChange={(e) => setFormData(p => ({ ...p, employee_notes: e.target.value }))} disabled={isCompleted} />
            </div>
          </div>
          <DialogFooter>
            {isCompleted ? (
              <Button variant="outline" onClick={closeForm}>Close</Button>
            ) : (
              <>
                <Button variant="outline" onClick={closeForm}>Cancel</Button>
                <Button variant="secondary" onClick={() => handleSave(false)} disabled={saveMutation.isPending}>
                  Save for Later
                </Button>
                <Button onClick={() => handleSave(true)} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : 'Complete Review'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeReviewsTab;
