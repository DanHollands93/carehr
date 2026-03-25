
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserCompanyId } from "@/hooks/useUserCompanyId";

interface RequestAbsenceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
}

const RequestAbsenceDialog = ({ isOpen, onClose, employeeId }: RequestAbsenceDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyId } = useUserCompanyId();
  const [form, setForm] = useState({
    absence_type_id: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    reason: '',
  });

  // Fetch hidden defaults for this company
  const { data: hiddenIds = [] } = useQuery({
    queryKey: ['hidden-defaults', 'absence_types', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_hidden_defaults')
        .select('record_id')
        .eq('company_id', companyId!)
        .eq('table_name', 'absence_types');
      if (error) throw error;
      return (data || []).map(d => d.record_id);
    },
    enabled: isOpen && !!companyId,
  });

  const { data: absenceTypes = [] } = useQuery({
    queryKey: ['absence-types-requestable', companyId, hiddenIds],
    queryFn: async () => {
      // Fetch company types
      const { data: companyData, error: e1 } = await supabase
        .from('absence_types')
        .select('*')
        .eq('company_id', companyId!)
        .eq('is_active', true)
        .eq('is_requestable', true)
        .order('sort_order');
      if (e1) throw e1;

      // Fetch system defaults
      const { data: systemData, error: e2 } = await supabase
        .from('absence_types')
        .select('*')
        .is('company_id', null)
        .eq('is_active', true)
        .eq('is_requestable', true)
        .order('sort_order');
      if (e2) throw e2;

      const visibleSystem = (systemData || []).filter(t => !hiddenIds.includes(t.id));
      return [...visibleSystem, ...(companyData || [])];
    },
    enabled: isOpen && !!companyId,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('absences').insert([{
        employee_id: employeeId,
        absence_type_id: form.absence_type_id,
        start_date: form.start_date,
        end_date: form.end_date || form.start_date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        reason: form.reason || null,
        status: 'pending',
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absences'] });
      queryClient.invalidateQueries({ queryKey: ['my-absences'] });
      toast({ title: "Absence request submitted", description: "Your request is pending approval." });
      setForm({ absence_type_id: '', start_date: '', end_date: '', start_time: '', end_time: '', reason: '' });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const selectedType = absenceTypes.find(t => t.id === form.absence_type_id);
  const isValid = form.absence_type_id && form.start_date;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Absence</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Absence Type</Label>
            <Select value={form.absence_type_id} onValueChange={(v) => setForm(f => ({ ...f, absence_type_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {absenceTypes.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                      {t.name}
                      {t.is_payable && <Badge variant="secondary" className="text-[9px] ml-1">Paid</Badge>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))} min={form.start_date} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Time <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input type="time" value={form.start_time} onChange={(e) => setForm(f => ({ ...f, start_time: e.target.value }))} />
            </div>
            <div>
              <Label>End Time <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input type="time" value={form.end_time} onChange={(e) => setForm(f => ({ ...f, end_time: e.target.value }))} />
            </div>
          </div>

          <div>
            <Label>Reason <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea value={form.reason} onChange={(e) => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Briefly describe your reason..." rows={2} />
          </div>

          {selectedType && (
            <div className="text-xs text-muted-foreground p-2 rounded bg-muted/50">
              {selectedType.is_payable
                ? "This absence type is payable — shifts during this period will remain paid."
                : "This absence type is unpaid — shifts during this period will not be paid."}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => submitMutation.mutate()} disabled={!isValid || submitMutation.isPending}>
            {submitMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequestAbsenceDialog;
