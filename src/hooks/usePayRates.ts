
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PayRate {
  id: string;
  company_id: string | null;
  job_role_id: string | null;
  employee_job_role_id: string | null;
  career_history_id: string | null;
  employee_id: string | null;
  pay_rate: number;
  pay_type: string;
  currency: string;
  effective_from: string;
  effective_to: string | null;
  reason: string | null;
  created_by: string | null;
  created_at: string;
}

export const usePayRates = (employeeId?: string) => {
  return useQuery({
    queryKey: ['pay-rates', 'employee', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const { data, error } = await supabase
        .from('pay_rates')
        .select('*')
        .eq('employee_id', employeeId)
        .order('effective_from', { ascending: false });
      if (error) throw error;
      return (data || []) as PayRate[];
    },
    enabled: !!employeeId
  });
};

export const useJobRolePayRates = (jobRoleId?: string) => {
  return useQuery({
    queryKey: ['pay-rates', 'job-role', jobRoleId],
    queryFn: async () => {
      if (!jobRoleId) return [];
      const { data, error } = await supabase
        .from('pay_rates')
        .select('*')
        .eq('job_role_id', jobRoleId)
        .is('employee_id', null)
        .order('effective_from', { ascending: false });
      if (error) throw error;
      return (data || []) as PayRate[];
    },
    enabled: !!jobRoleId
  });
};

export const useAddPayRate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payRate: {
      employee_id?: string;
      job_role_id?: string;
      employee_job_role_id?: string;
      career_history_id?: string;
      pay_rate: number;
      pay_type: string;
      currency?: string;
      effective_from: string;
      reason?: string;
    }) => {
      // Close previous current rate scoped to the specific career_history entry
      if (payRate.career_history_id) {
        await (supabase
          .from('pay_rates')
          .update({ effective_to: payRate.effective_from }) as any)
          .eq('career_history_id', payRate.career_history_id)
          .is('effective_to', null);
      } else if (payRate.employee_job_role_id) {
        await supabase
          .from('pay_rates')
          .update({ effective_to: payRate.effective_from })
          .eq('employee_job_role_id', payRate.employee_job_role_id)
          .is('effective_to', null);
      } else if (payRate.employee_id) {
        await supabase
          .from('pay_rates')
          .update({ effective_to: payRate.effective_from })
          .eq('employee_id', payRate.employee_id)
          .is('employee_job_role_id', null)
          .is('effective_to', null);
      } else if (payRate.job_role_id && !payRate.employee_id) {
        await supabase
          .from('pay_rates')
          .update({ effective_to: payRate.effective_from })
          .eq('job_role_id', payRate.job_role_id)
          .is('employee_id', null)
          .is('effective_to', null);
      }

      const insertData: any = {
        employee_id: payRate.employee_id || null,
        job_role_id: payRate.job_role_id || null,
        employee_job_role_id: payRate.employee_job_role_id || null,
        pay_rate: payRate.pay_rate,
        pay_type: payRate.pay_type,
        currency: payRate.currency || 'GBP',
        effective_from: payRate.effective_from,
        reason: payRate.reason || null,
      };

      if (payRate.career_history_id) {
        insertData.career_history_id = payRate.career_history_id;
      }

      const { data, error } = await supabase
        .from('pay_rates')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pay-rates'] });
    }
  });
};
