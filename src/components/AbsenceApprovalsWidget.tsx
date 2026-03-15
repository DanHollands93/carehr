
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { CalendarOff, Check, X } from "lucide-react";

const AbsenceApprovalsWidget = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pendingAbsences = [], isLoading } = useQuery({
    queryKey: ['pending-absences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('absences')
        .select('*, absence_types(name, color, is_payable), employees(first_name, last_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approved' | 'rejected' }) => {
      const { error } = await supabase.from('absences').update({
        status: action,
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['pending-absences'] });
      queryClient.invalidateQueries({ queryKey: ['absences'] });
      queryClient.invalidateQueries({ queryKey: ['absences-range'] });
      queryClient.invalidateQueries({ queryKey: ['my-absences'] });
      toast({ title: `Absence ${action}` });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  if (isLoading) return null;
  if (pendingAbsences.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarOff className="w-4 h-4" />
          Pending Absence Requests ({pendingAbsences.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingAbsences.map((absence: any) => (
          <div key={absence.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: absence.absence_types?.color }} />
              <div>
                <div className="font-medium text-sm">
                  {absence.employees?.first_name} {absence.employees?.last_name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {absence.absence_types?.name} · {absence.start_date} → {absence.end_date}
                  {absence.start_time && ` (${absence.start_time}–${absence.end_time})`}
                </div>
                {absence.reason && (
                  <div className="text-xs text-muted-foreground mt-0.5">Reason: {absence.reason}</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant={absence.absence_types?.is_payable ? "secondary" : "outline"} className="text-[10px]">
                {absence.absence_types?.is_payable ? 'Paid' : 'Unpaid'}
              </Badge>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                onClick={() => approveMutation.mutate({ id: absence.id, action: 'approved' })}
                disabled={approveMutation.isPending}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                onClick={() => approveMutation.mutate({ id: absence.id, action: 'rejected' })}
                disabled={approveMutation.isPending}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AbsenceApprovalsWidget;
