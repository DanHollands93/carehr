
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AbsenceWithType {
  id: string;
  employee_id: string;
  absence_type_id: string;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  status: string;
  notes: string | null;
  absence_types: {
    id: string;
    name: string;
    color: string;
    is_payable: boolean;
  };
}

export const useAbsencesForDateRange = (startDate: string, endDate: string, enabled = true) => {
  return useQuery({
    queryKey: ['absences-range', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('absences')
        .select('*, absence_types(id, name, color, is_payable)')
        .in('status', ['approved', 'pending'])
        .lte('start_date', endDate)
        .gte('end_date', startDate);
      if (error) throw error;
      return (data || []) as AbsenceWithType[];
    },
    enabled,
  });
};

export const useMyAbsences = (employeeId: string | undefined) => {
  return useQuery({
    queryKey: ['my-absences', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('absences')
        .select('*, absence_types(id, name, color, is_payable)')
        .eq('employee_id', employeeId!)
        .order('start_date', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as AbsenceWithType[];
    },
    enabled: !!employeeId,
  });
};

// Check if an employee has an approved absence covering a specific date
export const getAbsenceForEmployeeDate = (
  absences: AbsenceWithType[],
  employeeId: string,
  date: string
): AbsenceWithType | undefined => {
  return absences.find(a =>
    a.employee_id === employeeId &&
    a.start_date <= date &&
    a.end_date >= date &&
    (a.status === 'approved' || a.status === 'pending')
  );
};
