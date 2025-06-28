
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, differenceInMinutes } from "date-fns";

interface TimeClockRecord {
  id: string;
  employee_id: string;
  shift_id: string | null;
  shift_date: string;
  shift_start_time: string;
  shift_end_time: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  status: 'scheduled' | 'clocked_in' | 'completed' | 'discrepancy';
  discrepancy_type: string | null;
  approved_by: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
}

export const useTimeClockRecords = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employeeProfile } = useQuery({
    queryKey: ['employee-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('employee_id')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const { data: todayRecords, isLoading } = useQuery({
    queryKey: ['time-clock-records', employeeProfile?.employee_id, format(new Date(), 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!employeeProfile?.employee_id) return [];
      
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // First get today's shifts
      const { data: shifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .eq('employee_id', employeeProfile.employee_id)
        .eq('date', today);
      
      if (shiftsError) throw shiftsError;
      
      // Then get or create time clock records for these shifts
      const records: TimeClockRecord[] = [];
      
      for (const shift of shifts || []) {
        let { data: existingRecord, error: recordError } = await supabase
          .from('time_clock_records')
          .select('*')
          .eq('employee_id', employeeProfile.employee_id)
          .eq('shift_date', today)
          .eq('shift_start_time', shift.start_time)
          .eq('shift_end_time', shift.end_time)
          .maybeSingle();
        
        if (recordError && recordError.code !== 'PGRST116') throw recordError;
        
        if (!existingRecord) {
          // Create a new record for this shift
          const { data: newRecord, error: createError } = await supabase
            .from('time_clock_records')
            .insert({
              employee_id: employeeProfile.employee_id,
              shift_id: shift.id,
              shift_date: today,
              shift_start_time: shift.start_time,
              shift_end_time: shift.end_time,
              status: 'scheduled'
            })
            .select()
            .single();
          
          if (createError) throw createError;
          existingRecord = newRecord;
        }
        
        records.push(existingRecord as TimeClockRecord);
      }
      
      return records;
    },
    enabled: !!employeeProfile?.employee_id
  });

  const clockInMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await supabase
        .from('time_clock_records')
        .update({
          clock_in_time: new Date().toISOString(),
          status: 'clocked_in',
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-clock-records'] });
      toast({ title: "Successfully clocked in!" });
    },
    onError: (error) => {
      toast({ 
        title: "Error clocking in", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const clockOutMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await supabase
        .from('time_clock_records')
        .update({
          clock_out_time: new Date().toISOString(),
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-clock-records'] });
      toast({ title: "Successfully clocked out!" });
    },
    onError: (error) => {
      toast({ 
        title: "Error clocking out", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const validateClockTime = (record: TimeClockRecord, isClockIn: boolean, tolerances: {
    earlyClockInMinutes: number;
    lateClockInMinutes: number;
    earlyClockOutMinutes: number;
    lateClockOutMinutes: number;
  }) => {
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    const targetTime = isClockIn ? record.shift_start_time : record.shift_end_time;
    const shiftDateTime = parseISO(`${today}T${targetTime}`);
    const minutesDiff = differenceInMinutes(now, shiftDateTime);
    
    const tolerance = isClockIn 
      ? (minutesDiff < 0 ? tolerances.earlyClockInMinutes : tolerances.lateClockInMinutes)
      : (minutesDiff < 0 ? tolerances.earlyClockOutMinutes : tolerances.lateClockOutMinutes);
    
    const isWithinTolerance = Math.abs(minutesDiff) <= tolerance;
    
    return {
      isWithinTolerance,
      minutesDiff,
      warningMessage: !isWithinTolerance 
        ? `You are ${Math.abs(minutesDiff)} minutes ${minutesDiff < 0 ? 'early' : 'late'} for ${isClockIn ? 'clock in' : 'clock out'}`
        : null
    };
  };

  return {
    todayRecords,
    isLoading,
    clockIn: clockInMutation.mutate,
    clockOut: clockOutMutation.mutate,
    isClockingIn: clockInMutation.isPending,
    isClockingOut: clockOutMutation.isPending,
    validateClockTime
  };
};
