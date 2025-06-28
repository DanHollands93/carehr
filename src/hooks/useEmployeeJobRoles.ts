
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EmployeeJobRole {
  id: string;
  employee_id: string;
  job_role_id: string;
  pay_rate: number;
  currency: string;
  is_primary: boolean;
  job_roles: {
    id: string;
    title: string;
    department: string;
  };
}

export const useEmployeeJobRoles = (employeeId?: string) => {
  return useQuery({
    queryKey: ['employee-job-roles', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      
      const { data, error } = await supabase
        .from('employee_job_roles')
        .select(`
          id,
          employee_id,
          job_role_id,
          pay_rate,
          currency,
          is_primary,
          job_roles (
            id,
            title,
            department
          )
        `)
        .eq('employee_id', employeeId)
        .is('end_date', null) // Only active roles
        .order('is_primary', { ascending: false });
      
      if (error) throw error;
      return data as EmployeeJobRole[];
    },
    enabled: !!employeeId
  });
};

export const useAllEmployeeJobRoles = () => {
  return useQuery({
    queryKey: ['all-employee-job-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_job_roles')
        .select(`
          id,
          employee_id,
          job_role_id,
          pay_rate,
          currency,
          is_primary,
          job_roles (
            id,
            title,
            department
          )
        `)
        .is('end_date', null) // Only active roles
        .order('employee_id, is_primary', { ascending: [true, false] });
      
      if (error) throw error;
      return data as EmployeeJobRole[];
    }
  });
};
