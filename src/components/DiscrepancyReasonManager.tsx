import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserCompanyId } from "@/hooks/useUserCompanyId";
import { cn } from "@/lib/utils";

interface DiscrepancyReason {
  id: string;
  name: string;
  is_paid: boolean;
  context: string;
  is_active: boolean;
  sort_order: number;
}

const CONTEXT_OPTIONS = [
  { value: 'late_clock_in', label: 'Late Clock In', description: 'Clocked in after shift start' },
  { value: 'early_clock_in', label: 'Early Clock In', description: 'Clocked in before shift start' },
  { value: 'early_clock_out', label: 'Early Clock Out', description: 'Clocked out before shift end' },
  { value: 'late_clock_out', label: 'Late Clock Out', description: 'Clocked out after shift end' },
  { value: 'no_show', label: 'No Show', description: 'Did not clock in at all' },
  { value: 'absence', label: 'Absence', description: 'Related to an absence' },
  { value: 'any', label: 'Any', description: 'Applies to all situations' },
];

const DiscrepancyReasonManager = () => {
  const { companyId } = useUserCompanyId();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newContext, setNewContext] = useState("any");
  const [newIsPaid, setNewIsPaid] = useState(false);

  const { data: reasons = [], isLoading } = useQuery({
    queryKey: ['discrepancy-reasons', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discrepancy_reasons')
        .select('*')
        .eq('company_id', companyId!)
        .order('context')
        .order('sort_order');
      if (error) throw error;
      return data as DiscrepancyReason[];
    },
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('discrepancy_reasons')
        .insert([{
          name: newName.trim(),
          context: newContext,
          is_paid: newIsPaid,
          company_id: companyId,
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discrepancy-reasons'] });
      setNewName("");
      setNewIsPaid(false);
      toast({ title: "Reason added" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('discrepancy_reasons')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discrepancy-reasons'] });
      toast({ title: "Updated" });
    },
  });

  const togglePaidMutation = useMutation({
    mutationFn: async ({ id, is_paid }: { id: string; is_paid: boolean }) => {
      const { error } = await supabase
        .from('discrepancy_reasons')
        .update({ is_paid })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discrepancy-reasons'] });
    },
  });

  const contextLabel = (ctx: string) => CONTEXT_OPTIONS.find(o => o.value === ctx)?.label || ctx;

  const contextColor = (ctx: string) => {
    switch (ctx) {
      case 'late_clock_in': return 'bg-destructive/10 text-destructive';
      case 'early_clock_in': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'early_clock_out': return 'bg-destructive/10 text-destructive';
      case 'late_clock_out': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'no_show': return 'bg-destructive/10 text-destructive';
      case 'absence': return 'bg-primary/10 text-primary';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Group by context
  const grouped = CONTEXT_OPTIONS.map(opt => ({
    ...opt,
    reasons: reasons.filter(r => r.context === opt.value),
  })).filter(g => g.reasons.length > 0);

  const ungroupedContexts = CONTEXT_OPTIONS.filter(
    opt => !grouped.find(g => g.value === opt.value) || grouped.find(g => g.value === opt.value)
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Discrepancy Reasons
        </CardTitle>
        <CardDescription>
          Configure reasons for clock discrepancies. Each reason is tied to a specific context (e.g., Late Clock In) and can be marked as paid or unpaid. Only relevant reasons will appear during reviews.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new reason */}
        <div className="rounded-lg border p-4 space-y-3">
          <p className="text-sm font-medium">Add New Reason</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Reason Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Traffic delay"
                onKeyDown={(e) => e.key === 'Enter' && newName.trim() && addMutation.mutate()}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Context</Label>
              <Select value={newContext} onValueChange={setNewContext}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTEXT_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-3">
              <div className="flex items-center gap-2">
                <Switch checked={newIsPaid} onCheckedChange={setNewIsPaid} />
                <Label className="text-xs">{newIsPaid ? 'Paid' : 'Unpaid'}</Label>
              </div>
              <Button size="sm" onClick={() => addMutation.mutate()} disabled={!newName.trim() || addMutation.isPending}>
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Grouped reasons */}
        {CONTEXT_OPTIONS.map(opt => {
          const contextReasons = reasons.filter(r => r.context === opt.value);
          if (contextReasons.length === 0) return null;

          return (
            <div key={opt.value} className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={cn("text-xs", contextColor(opt.value))}>
                  {opt.label}
                </Badge>
                <span className="text-xs text-muted-foreground">{opt.description}</span>
              </div>
              <div className="space-y-1.5">
                {contextReasons.map(reason => (
                  <div
                    key={reason.id}
                    className={cn(
                      "flex items-center justify-between rounded-lg border p-3 transition-colors",
                      !reason.is_active && "opacity-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{reason.name}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          reason.is_paid
                            ? "border-emerald-300 text-emerald-700 dark:text-emerald-400"
                            : "border-border text-muted-foreground"
                        )}
                      >
                        {reason.is_paid ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Label className={cn(
                          "text-xs",
                          reason.is_paid ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"
                        )}>
                          {reason.is_paid ? 'Paid' : 'Unpaid'}
                        </Label>
                        <Switch
                          checked={reason.is_paid}
                          onCheckedChange={(checked) => togglePaidMutation.mutate({ id: reason.id, is_paid: checked })}
                        />
                      </div>
                      <Switch
                        checked={reason.is_active}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: reason.id, is_active: checked })}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {reasons.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No discrepancy reasons configured yet.</p>
            <p className="text-xs mt-1">Add reasons above to provide options during discrepancy reviews.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DiscrepancyReasonManager;
