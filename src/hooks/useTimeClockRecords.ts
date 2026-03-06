
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, differenceInMinutes, addDays, startOfDay, endOfDay } from "date-fns";

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

interface ShiftWithRecord {
  id: string;
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  position: string;
  time_record: TimeClockRecord | null;
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
      console.log('Looking for shifts on date:', today);
      console.log('Employee ID:', employeeProfile.employee_id);
      
      // First get today's shifts
      const { data: shifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .eq('employee_id', employeeProfile.employee_id)
        .eq('date', today);
      
      if (shiftsError) {
        console.error('Error fetching shifts:', shiftsError);
        throw shiftsError;
      }
      
      console.log('Found shifts for today:', shifts);
      
      // Then get or create time clock records for these shifts
      const records: TimeClockRecord[] = [];
      
      for (const shift of shifts || []) {
        console.log('Processing shift:', shift);
        
        let { data: existingRecord, error: recordError } = await supabase
          .from('time_clock_records')
          .select('*')
          .eq('employee_id', employeeProfile.employee_id)
          .eq('shift_id', shift.id)
          .maybeSingle();
        
        if (recordError && recordError.code !== 'PGRST116') {
          console.error('Error fetching time clock record:', recordError);
          throw recordError;
        }
        
        if (!existingRecord) {
          console.log('Creating new time clock record for shift:', shift.id);
          // Create a new record for this shift
          const { data: newRecord, error: createError } = await supabase
            .from('time_clock_records')
            .insert({
              employee_id: employeeProfile.employee_id,
              shift_id: shift.id,
              status: 'scheduled'
            })
            .select()
            .single();
          
          if (createError) {
            console.error('Error creating time clock record:', createError);
            throw createError;
          }
          existingRecord = newRecord;
          console.log('Created new time clock record:', existingRecord);
        }
        
        // Add the shift information to the record for display purposes
        const recordWithShiftInfo = {
          ...existingRecord,
          shift_date: shift.date,
          shift_start_time: shift.start_time,
          shift_end_time: shift.end_time
        } as TimeClockRecord;
        
        records.push(recordWithShiftInfo);
      }

      // Also fetch ad-hoc records (no shift linked) for today
      const { data: adHocRecords, error: adHocError } = await supabase
        .from('time_clock_records')
        .select('*')
        .eq('employee_id', employeeProfile.employee_id)
        .is('shift_id', null)
        .eq('shift_date', today);

      if (adHocError) {
        console.error('Error fetching ad-hoc records:', adHocError);
      } else if (adHocRecords) {
        for (const rec of adHocRecords) {
          records.push({
            ...rec,
            shift_date: rec.shift_date || today,
            shift_start_time: rec.shift_start_time || '',
            shift_end_time: rec.shift_end_time || '',
          } as TimeClockRecord);
        }
      }
      
      console.log('Final records for today:', records);
      return records;
    },
    enabled: !!employeeProfile?.employee_id
  });

  // New query for upcoming shifts (next 6 weeks)
  const { data: upcomingShifts } = useQuery({
    queryKey: ['upcoming-shifts', employeeProfile?.employee_id],
    queryFn: async () => {
      if (!employeeProfile?.employee_id) return [];
      
      const today = new Date();
      const sixWeeksFromNow = addDays(today, 42); // 6 weeks = 42 days
      
      const { data: shifts, error } = await supabase
        .from('shifts')
        .select(`
          *,
          time_clock_records!left(
            id,
            status,
            clock_in_time,
            clock_out_time
          )
        `)
        .eq('employee_id', employeeProfile.employee_id)
        .gte('date', format(today, 'yyyy-MM-dd'))
        .lte('date', format(sixWeeksFromNow, 'yyyy-MM-dd'))
        .order('date', { ascending: true });
      
      if (error) throw error;
      
      return (shifts || []).map((shift: any) => ({
        ...shift,
        time_record: shift.time_clock_records?.[0] || null
      })) as any[];
    },
    enabled: !!employeeProfile?.employee_id
  });

  const clockInMutation = useMutation({
    mutationFn: async ({ recordId, captureData }: { recordId: string; captureData?: { latitude?: number; longitude?: number; accuracy?: number; photoUrl?: string } }) => {
      const now = new Date();
      const clockTime = now.toISOString();
      
      // Get the record to check for discrepancies
      const record = todayRecords?.find(r => r.id === recordId);
      if (!record) throw new Error('Record not found');
      
      // Check for discrepancies
      const today = format(now, 'yyyy-MM-dd');
      const shiftStartDateTime = parseISO(`${today}T${record.shift_start_time}`);
      const minutesDiff = differenceInMinutes(now, shiftStartDateTime);
      
      let status: 'clocked_in' | 'discrepancy' = 'clocked_in';
      let discrepancyType: string | null = null;
      
      if (Math.abs(minutesDiff) > 15) {
        status = 'discrepancy';
        if (minutesDiff < -15) {
          discrepancyType = 'early_clock_in';
        } else if (minutesDiff > 15) {
          discrepancyType = 'late_clock_in';
        }
      }
      
      const updateData: Record<string, any> = {
        clock_in_time: clockTime,
        status: status,
        discrepancy_type: discrepancyType,
        updated_at: now.toISOString(),
      };

      if (captureData?.latitude != null) updateData.clock_in_latitude = captureData.latitude;
      if (captureData?.longitude != null) updateData.clock_in_longitude = captureData.longitude;
      if (captureData?.accuracy != null) updateData.clock_in_accuracy = captureData.accuracy;
      if (captureData?.photoUrl) updateData.clock_in_photo_url = captureData.photoUrl;

      const { error } = await supabase
        .from('time_clock_records')
        .update(updateData)
        .eq('id', recordId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-clock-records'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-shifts'] });
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
    mutationFn: async ({ recordId, captureData }: { recordId: string; captureData?: { latitude?: number; longitude?: number; accuracy?: number; photoUrl?: string } }) => {
      const now = new Date();
      const clockTime = now.toISOString();
      
      // Get the record to check for discrepancies
      const record = todayRecords?.find(r => r.id === recordId);
      if (!record) throw new Error('Record not found');
      
      let status: 'completed' | 'discrepancy' = 'completed';
      let discrepancyType: string | null = record.discrepancy_type;

      // Only check for discrepancies if this is a rostered shift (has shift_end_time)
      if (record.shift_end_time) {
        const today = format(now, 'yyyy-MM-dd');
        const shiftEndDateTime = parseISO(`${today}T${record.shift_end_time}`);
        const minutesDiff = differenceInMinutes(now, shiftEndDateTime);
        
        if (Math.abs(minutesDiff) > 15) {
          status = 'discrepancy';
          if (minutesDiff < -15) {
            discrepancyType = discrepancyType ? `${discrepancyType},early_clock_out` : 'early_clock_out';
          } else if (minutesDiff > 15) {
            discrepancyType = discrepancyType ? `${discrepancyType},late_clock_out` : 'late_clock_out';
          }
        }
      }
      
      const updateData: Record<string, any> = {
        clock_out_time: clockTime,
        status: status,
        discrepancy_type: discrepancyType,
        updated_at: now.toISOString(),
      };

      if (captureData?.latitude != null) updateData.clock_out_latitude = captureData.latitude;
      if (captureData?.longitude != null) updateData.clock_out_longitude = captureData.longitude;
      if (captureData?.accuracy != null) updateData.clock_out_accuracy = captureData.accuracy;
      if (captureData?.photoUrl) updateData.clock_out_photo_url = captureData.photoUrl;

      const { error } = await supabase
        .from('time_clock_records')
        .update(updateData)
        .eq('id', recordId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-clock-records'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-shifts'] });
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

  const adHocClockInMutation = useMutation({
    mutationFn: async ({ captureData }: { captureData?: { latitude?: number; longitude?: number; accuracy?: number; photoUrl?: string } } = {}) => {
      if (!employeeProfile?.employee_id) throw new Error('No employee profile');
      const now = new Date();
      const today = format(now, 'yyyy-MM-dd');

      const insertData: Record<string, any> = {
        employee_id: employeeProfile.employee_id,
        shift_id: null,
        shift_date: today,
        shift_start_time: null,
        shift_end_time: null,
        clock_in_time: now.toISOString(),
        status: 'clocked_in',
        notes: 'Ad-hoc clock in',
      };

      if (captureData?.latitude != null) insertData.clock_in_latitude = captureData.latitude;
      if (captureData?.longitude != null) insertData.clock_in_longitude = captureData.longitude;
      if (captureData?.accuracy != null) insertData.clock_in_accuracy = captureData.accuracy;
      if (captureData?.photoUrl) insertData.clock_in_photo_url = captureData.photoUrl;

      const { error } = await supabase
        .from('time_clock_records')
        .insert(insertData as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-clock-records'] });
      toast({ title: "Ad-hoc clock in recorded!" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return {
    todayRecords,
    upcomingShifts,
    isLoading,
    clockIn: clockInMutation.mutate,
    clockOut: clockOutMutation.mutate,
    adHocClockIn: adHocClockInMutation.mutate,
    isClockingIn: clockInMutation.isPending,
    isClockingOut: clockOutMutation.isPending,
    isAdHocClockingIn: adHocClockInMutation.isPending,
    validateClockTime
  };
};
