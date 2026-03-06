
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Clock, ArrowLeft, ArrowRight, Loader2, Save, Info } from "lucide-react";
import { useUserCompanyId } from "@/hooks/useUserCompanyId";
import { cn } from "@/lib/utils";

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  description: string | null;
}

interface ExceptionRule {
  key: string;
  actionKey: string;
  label: string;
  description: string;
  icon: 'early_in' | 'late_in' | 'early_out' | 'late_out';
  minutes: number;
  action: 'paid' | 'unpaid';
}

const EXCEPTION_RULES: Omit<ExceptionRule, 'minutes' | 'action'>[] = [
  {
    key: 'early_clock_in_minutes',
    actionKey: 'early_clock_in_auto_action',
    label: 'Clock In Before Shift',
    description: 'When staff clock in early, up to this many minutes before shift start',
    icon: 'early_in',
  },
  {
    key: 'late_clock_in_minutes',
    actionKey: 'late_clock_in_auto_action',
    label: 'Clock In After Shift Start',
    description: 'When staff clock in late, up to this many minutes after shift start',
    icon: 'late_in',
  },
  {
    key: 'early_clock_out_minutes',
    actionKey: 'early_clock_out_auto_action',
    label: 'Clock Out Before Shift End',
    description: 'When staff clock out early, up to this many minutes before shift end',
    icon: 'early_out',
  },
  {
    key: 'late_clock_out_minutes',
    actionKey: 'late_clock_out_auto_action',
    label: 'Clock Out After Shift End',
    description: 'When staff clock out late, up to this many minutes after shift end',
    icon: 'late_out',
  },
];

const AutoExceptionsSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyId } = useUserCompanyId();

  const settingKeys = EXCEPTION_RULES.flatMap(r => [r.key, r.actionKey]);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings', 'auto-exceptions', companyId],
    queryFn: async () => {
      const query = supabase
        .from('system_settings')
        .select('*')
        .in('setting_key', settingKeys);
      
      if (companyId) {
        query.eq('company_id', companyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SystemSetting[];
    },
    enabled: !!companyId,
  });

  const getVal = (key: string, fallback: string) => {
    return settings?.find(s => s.setting_key === key)?.setting_value || fallback;
  };

  const [localRules, setLocalRules] = useState<{ minutes: number; action: 'paid' | 'unpaid' }[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalRules(EXCEPTION_RULES.map(r => ({
        minutes: parseInt(getVal(r.key, '15')) || 15,
        action: (getVal(r.actionKey, 'unpaid') as 'paid' | 'unpaid'),
      })));
      setHasChanges(false);
    }
  }, [settings]);

  const updateRule = (index: number, field: 'minutes' | 'action', value: number | string) => {
    setLocalRules(prev => prev.map((rule, i) =>
      i === index ? { ...rule, [field]: value } : rule
    ));
    setHasChanges(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = EXCEPTION_RULES.flatMap((r, i) => [
        { key: r.key, value: String(localRules[i].minutes) },
        { key: r.actionKey, value: localRules[i].action },
      ]);

      for (const u of updates) {
        const existing = settings?.find(s => s.setting_key === u.key);
        if (existing) {
          const { error } = await supabase
            .from('system_settings')
            .update({ setting_value: u.value, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      setHasChanges(false);
      toast({ title: "Auto-exception rules saved" });
    },
    onError: (err: Error) => {
      toast({ title: "Error saving", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading || localRules.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const iconForRule = (icon: ExceptionRule['icon']) => {
    switch (icon) {
      case 'early_in': return <ArrowRight className="w-4 h-4" />;
      case 'late_in': return <ArrowRight className="w-4 h-4" />;
      case 'early_out': return <ArrowLeft className="w-4 h-4" />;
      case 'late_out': return <ArrowLeft className="w-4 h-4" />;
    }
  };

  const iconBg = (icon: ExceptionRule['icon']) => {
    if (icon === 'early_in' || icon === 'late_out') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-destructive/10 text-destructive';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Auto-Exception Rules
        </CardTitle>
        <CardDescription>
          Set thresholds for automatic clock discrepancy handling. Variances within the limit are auto-resolved; anything beyond requires manual review.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-lg bg-muted/60 border border-border p-3">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            When an employee's clock time falls within the configured threshold, the system will automatically apply the paid/unpaid exception. 
            If the variance exceeds the threshold, a manager will need to manually review and decide.
          </p>
        </div>

        {EXCEPTION_RULES.map((rule, i) => (
          <div
            key={rule.key}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4"
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={cn("p-2 rounded-lg shrink-0", iconBg(rule.icon))}>
                {iconForRule(rule.icon)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{rule.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Up to</Label>
                <Input
                  type="number"
                  min={0}
                  max={120}
                  className="w-16 h-8 text-center text-sm"
                  value={localRules[i].minutes}
                  onChange={(e) => updateRule(i, 'minutes', parseInt(e.target.value) || 0)}
                />
                <Label className="text-xs text-muted-foreground">min</Label>
              </div>

              <div className="flex items-center gap-2 border-l pl-3">
                <Label className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  localRules[i].action === 'paid'
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-muted-foreground"
                )}>
                  {localRules[i].action === 'paid' ? 'Paid' : 'Unpaid'}
                </Label>
                <Switch
                  checked={localRules[i].action === 'paid'}
                  onCheckedChange={(checked) => updateRule(i, 'action', checked ? 'paid' : 'unpaid')}
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-end pt-2">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!hasChanges || saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Rules
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoExceptionsSettings;
