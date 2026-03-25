
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserCompanyId } from "@/hooks/useUserCompanyId";
import { useHiddenDefaults } from "@/hooks/useSystemDefaults";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface AbsenceType {
  id: string;
  name: string;
  color: string;
  is_requestable: boolean;
  is_payable: boolean;
  is_active: boolean;
  sort_order: number;
  company_id: string | null;
}

const DEFAULT_COLORS = [
  '#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b',
];

const AbsenceTypeManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyId } = useUserCompanyId();
  const { hiddenIds, toggleHidden } = useHiddenDefaults('absence_types');
  const [editDialog, setEditDialog] = useState<{ open: boolean; item?: AbsenceType }>({ open: false });
  const [form, setForm] = useState({ name: '', color: '#6366f1', is_requestable: true, is_payable: false });

  // Fetch company-specific absence types
  const { data: companyTypes = [], isLoading: loadingCompany } = useQuery({
    queryKey: ['absence-types', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('absence_types')
        .select('*')
        .eq('company_id', companyId!)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as AbsenceType[];
    },
    enabled: !!companyId,
  });

  // Fetch system-level defaults (company_id IS NULL)
  const { data: systemTypes = [], isLoading: loadingSystem } = useQuery({
    queryKey: ['absence-types-system'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('absence_types')
        .select('*')
        .is('company_id', null)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as AbsenceType[];
    },
  });

  const isLoading = loadingCompany || loadingSystem;

  // Merge: system defaults (not hidden) + company types
  const visibleSystemTypes = systemTypes.filter(t => !hiddenIds.includes(t.id));
  const allTypes = [...visibleSystemTypes, ...companyTypes];

  const upsertMutation = useMutation({
    mutationFn: async (values: { id?: string; name: string; color: string; is_requestable: boolean; is_payable: boolean }) => {
      if (values.id) {
        const { error } = await supabase.from('absence_types').update({
          name: values.name,
          color: values.color,
          is_requestable: values.is_requestable,
          is_payable: values.is_payable,
        }).eq('id', values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('absence_types').insert([{
          name: values.name,
          color: values.color,
          is_requestable: values.is_requestable,
          is_payable: values.is_payable,
          sort_order: companyTypes.length,
          company_id: companyId,
        }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absence-types', companyId] });
      setEditDialog({ open: false });
      toast({ title: "Absence type saved" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('absence_types').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absence-types', companyId] });
    }
  });

  const openCreate = () => {
    setForm({ name: '', color: '#6366f1', is_requestable: true, is_payable: false });
    setEditDialog({ open: true });
  };

  const openEdit = (item: AbsenceType) => {
    setForm({ name: item.name, color: item.color, is_requestable: item.is_requestable, is_payable: item.is_payable });
    setEditDialog({ open: true, item });
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    upsertMutation.mutate({ id: editDialog.item?.id, ...form });
  };

  const isSystemDefault = (item: AbsenceType) => item.company_id === null;

  // Hidden system defaults (so user can re-enable them)
  const hiddenSystemTypes = systemTypes.filter(t => hiddenIds.includes(t.id));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Absence Types</CardTitle>
            <CardDescription>System defaults are shared across all companies. You can hide them or add your own custom types.</CardDescription>
          </div>
          <Button onClick={openCreate} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Type
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : allTypes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No absence types configured yet. Add your first one above.</div>
        ) : (
          <div className="space-y-2">
            {allTypes.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-medium">{item.name}</span>
                  <div className="flex gap-1.5">
                    {isSystemDefault(item) && (
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <Globe className="w-2.5 h-2.5" />
                        Default
                      </Badge>
                    )}
                    {item.is_requestable && (
                      <Badge variant="outline" className="text-[10px]">Requestable</Badge>
                    )}
                    {item.is_payable && (
                      <Badge variant="secondary" className="text-[10px]">Payable</Badge>
                    )}
                    {!item.is_active && !isSystemDefault(item) && (
                      <Badge variant="destructive" className="text-[10px]">Inactive</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isSystemDefault(item) ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => toggleHidden({ recordId: item.id, hide: true })}
                    >
                      Hide
                    </Button>
                  ) : (
                    <>
                      <Switch
                        checked={item.is_active}
                        onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: item.id, is_active: checked })}
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hidden system defaults */}
        {hiddenSystemTypes.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground mb-2">Hidden Defaults ({hiddenSystemTypes.length})</p>
            <div className="flex flex-wrap gap-2">
              {hiddenSystemTypes.map(item => (
                <Button
                  key={item.id}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 gap-1.5"
                  onClick={() => toggleHidden({ recordId: item.id, hide: false })}
                >
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                  <span className="text-muted-foreground">+ Show</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        <Dialog open={editDialog.open} onOpenChange={(open) => !open && setEditDialog({ open: false })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editDialog.item ? 'Edit Absence Type' : 'New Absence Type'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Sick Leave" />
              </div>
              <div>
                <Label>Colour</Label>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {DEFAULT_COLORS.map(c => (
                    <button
                      key={c}
                      className="w-8 h-8 rounded-full border-2 transition-all"
                      style={{ backgroundColor: c, borderColor: form.color === c ? 'hsl(var(--foreground))' : 'transparent' }}
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Requestable by Staff</Label>
                  <p className="text-xs text-muted-foreground">Staff can request this absence type themselves</p>
                </div>
                <Switch checked={form.is_requestable} onCheckedChange={(v) => setForm(f => ({ ...f, is_requestable: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Payable</Label>
                  <p className="text-xs text-muted-foreground">Shifts during this absence are still paid</p>
                </div>
                <Switch checked={form.is_payable} onCheckedChange={(v) => setForm(f => ({ ...f, is_payable: v }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog({ open: false })}>Cancel</Button>
              <Button onClick={handleSave} disabled={!form.name.trim() || upsertMutation.isPending}>
                {upsertMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AbsenceTypeManager;
