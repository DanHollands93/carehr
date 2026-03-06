import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DailyAllocation {
  id: string;
  roster_template_id: string;
  allocation_location_id: string;
  employee_id: string;
  date: string;
  company_id: string | null;
}

export const useDailyAllocations = (templateId: string | undefined, weekStart: string, weekEnd: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allocations } = useQuery({
    queryKey: ['daily-allocations', templateId, weekStart, weekEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roster_daily_allocations')
        .select('*')
        .eq('roster_template_id', templateId!)
        .gte('date', weekStart)
        .lte('date', weekEnd);
      if (error) throw error;
      return data as DailyAllocation[];
    },
    enabled: !!templateId
  });

  const setAllocation = useMutation({
    mutationFn: async ({ employeeId, date, locationId }: { employeeId: string; date: string; locationId: string }) => {
      // Upsert: delete existing then insert
      await supabase
        .from('roster_daily_allocations')
        .delete()
        .eq('roster_template_id', templateId!)
        .eq('employee_id', employeeId)
        .eq('date', date);

      const { error } = await supabase
        .from('roster_daily_allocations')
        .insert([{
          roster_template_id: templateId,
          allocation_location_id: locationId,
          employee_id: employeeId,
          date
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-allocations', templateId] });
    },
    onError: (error) => {
      toast({ title: "Error saving allocation", description: error.message, variant: "destructive" });
    }
  });

  const removeAllocation = useMutation({
    mutationFn: async ({ employeeId, date }: { employeeId: string; date: string }) => {
      const { error } = await supabase
        .from('roster_daily_allocations')
        .delete()
        .eq('roster_template_id', templateId!)
        .eq('employee_id', employeeId)
        .eq('date', date);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-allocations', templateId] });
    }
  });

  const bulkSetAllocations = useMutation({
    mutationFn: async (assignments: { employeeId: string; date: string; locationId: string }[]) => {
      // Delete all existing allocations for this date
      const dates = [...new Set(assignments.map(a => a.date))];
      for (const date of dates) {
        await supabase
          .from('roster_daily_allocations')
          .delete()
          .eq('roster_template_id', templateId!)
          .eq('date', date);
      }

      if (assignments.length > 0) {
        const { error } = await supabase
          .from('roster_daily_allocations')
          .insert(assignments.map(a => ({
            roster_template_id: templateId,
            allocation_location_id: a.locationId,
            employee_id: a.employeeId,
            date: a.date
          })));
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-allocations', templateId] });
      toast({ title: "Allocations saved" });
    },
    onError: (error) => {
      toast({ title: "Error saving allocations", description: error.message, variant: "destructive" });
    }
  });

  const getAllocationsForDate = (date: string) => {
    return allocations?.filter(a => a.date === date) || [];
  };

  const getEmployeeAllocation = (employeeId: string, date: string) => {
    return allocations?.find(a => a.employee_id === employeeId && a.date === date);
  };

  return {
    allocations: allocations || [],
    setAllocation,
    removeAllocation,
    bulkSetAllocations,
    getAllocationsForDate,
    getEmployeeAllocation
  };
};
