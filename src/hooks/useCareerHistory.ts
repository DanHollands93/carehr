
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CareerHistoryEntry {
  id: string;
  employee_id: string;
  job_title: string;
  location: string;
  start_date: string;
  end_date: string | null;
  pay_rate: number;
  currency: string;
  job_role_id: string | null;
  employment_type: string;
  pay_type: string;
  contract_type: string;
}

export const useCareerHistory = (employeeId?: string) => {
  return useQuery({
    queryKey: ['career-history', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      
      const { data, error } = await supabase
        .from('career_history')
        .select('*')
        .eq('employee_id', employeeId)
        .is('end_date', null) // Only active positions
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      return (data || []) as CareerHistoryEntry[];
    },
    enabled: !!employeeId
  });
};
