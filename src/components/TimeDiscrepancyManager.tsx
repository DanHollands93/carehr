import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { Clock, User, AlertCircle, CheckCircle, Calendar } from "lucide-react";

interface TimeClockRecord {
  id: string;
  employee_id: string;
  shift_id: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  status: 'scheduled' | 'clocked_in' | 'completed' | 'discrepancy';
  discrepancy_type: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  early_overtime_status: 'unpaid' | 'paid' | 'pending';
  late_overtime_status: 'unpaid' | 'paid' | 'pending';
  employee?: {
    first_name: string;
    last_name: string;
  };
  shift?: {
    date: string;
    start_time: string;
    end_time: string;
    pay_rate: number;
    break_minutes?: number;
    paid_break_minutes?: number;
  };
}

interface DiscrepancyApproval {
  early_overtime_decision?: 'paid' | 'unpaid';
  early_overtime_notes?: string;
  late_overtime_decision?: 'paid' | 'unpaid';
  late_overtime_notes?: string;
  general_notes?: string;
  manual_start_time?: string;
  manual_end_time?: string;
  break_deduction_minutes?: number;
}

const TimeDiscrepancyManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [approvals, setApprovals] = useState<Record<string, DiscrepancyApproval>>({});

  const { data: discrepancyRecords, isLoading } = useQuery({
    queryKey: ['time-discrepancies-new'],
    queryFn: async () => {
      console.log('Fetching discrepancy records...');
      
      const now = new Date();
      
      // First, get all shifts that have ended
      const { data: shifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .lte('date', format(now, 'yyyy-MM-dd'))
        .order('date', { ascending: false });
      
      if (shiftsError) {
        console.error('Error fetching shifts:', shiftsError);
        throw shiftsError;
      }
      
      console.log('Found shifts:', shifts);
      
      if (!shifts || shifts.length === 0) {
        console.log('No shifts found');
        return [];
      }
      
      // Filter shifts that have ended
      const endedShifts = shifts.filter(shift => {
        const shiftEndTime = parseISO(`${shift.date}T${shift.end_time}`);
        return now > shiftEndTime;
      });
      
      console.log('Ended shifts:', endedShifts);
      
      const validRecords = [];
      
      for (const shift of endedShifts) {
        // Check if a time clock record exists for this shift
        let { data: timeRecord, error: recordError } = await supabase
          .from('time_clock_records')
          .select('*')
          .eq('shift_id', shift.id)
          .maybeSingle();
        
        if (recordError) {
          console.error('Error fetching time clock record for shift:', shift.id, recordError);
          continue;
        }
        
        // If no time clock record exists, create one
        if (!timeRecord) {
          console.log('Creating time clock record for shift:', shift.id);
          const { data: newRecord, error: createError } = await supabase
            .from('time_clock_records')
            .insert({
              shift_id: shift.id,
              employee_id: shift.employee_id,
              status: 'discrepancy',
              discrepancy_type: 'did_not_clock_in',
              approval_status: 'pending'
            })
            .select()
            .single();
          
          if (createError) {
            console.error('Error creating time clock record:', createError);
            continue;
          }
          
          timeRecord = newRecord;
        }
        
        // Only include records that need approval
        if (timeRecord.approval_status === 'pending' && 
            (timeRecord.status === 'discrepancy' || 
             (timeRecord.status === 'scheduled' && !timeRecord.clock_in_time))) {
          
          // If it's scheduled but should be a discrepancy, update it
          if (timeRecord.status === 'scheduled' && !timeRecord.clock_in_time) {
            await supabase
              .from('time_clock_records')
              .update({
                status: 'discrepancy',
                discrepancy_type: 'did_not_clock_in'
              })
              .eq('id', timeRecord.id);
            
            timeRecord.status = 'discrepancy';
            timeRecord.discrepancy_type = 'did_not_clock_in';
          }
          
          // Get pay rate from employee_job_roles
          const { data: employeeJobRole } = await supabase
            .from('employee_job_roles')
            .select('pay_rate')
            .eq('employee_id', shift.employee_id)
            .eq('is_primary', true)
            .maybeSingle();
          
          // Add shift data with pay rate
          const shiftWithPayRate = {
            ...shift,
            pay_rate: employeeJobRole?.pay_rate || 0,
            break_minutes: 60, // Default break - this should come from shift data eventually
            paid_break_minutes: 0
          };
          
          validRecords.push({
            ...timeRecord,
            shift: shiftWithPayRate
          });
        }
      }
      
      console.log('Valid records before employee lookup:', validRecords);
      
      // Get employee details for all valid records
      const employeeIds = [...new Set(validRecords.map(r => r.employee_id))];
      console.log('Employee IDs for valid records:', employeeIds);
      
      if (employeeIds.length === 0) {
        return [];
      }
      
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .in('id', employeeIds);
      
      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        throw employeesError;
      }
      
      console.log('Employees for valid records:', employees);
      
      // Create lookup map
      const employeeMap = new Map(employees?.map(emp => [emp.id, emp]) || []);
      
      // Combine the data
      const transformedRecords = validRecords.map(record => ({
        ...record,
        employee: employeeMap.get(record.employee_id)
      })) as TimeClockRecord[];
      
      console.log('Final transformed records:', transformedRecords);
      return transformedRecords;
    }
  });

  const approveRecordMutation = useMutation({
    mutationFn: async ({ recordId }: { recordId: string }) => {
      const approval = approvals[recordId];
      const record = discrepancyRecords?.find(r => r.id === recordId);
      
      if (!approval || !record) throw new Error('No approval data or record found');

      // Handle case where employee didn't clock in at all
      if (record.discrepancy_type === 'did_not_clock_in') {
        let updateData: any = {
          approval_status: 'approved',
          notes: approval.general_notes || 'Employee did not clock in for scheduled shift',
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // If manual times are provided, calculate pay
        if (approval.manual_start_time && approval.manual_end_time) {
          const shift = record.shift;
          if (!shift) throw new Error('No shift data found');

          const manualStartTime = parseISO(`${shift.date}T${approval.manual_start_time}`);
          const manualEndTime = parseISO(`${shift.date}T${approval.manual_end_time}`);
          const totalMinutesWorked = differenceInMinutes(manualEndTime, manualStartTime);
          const breakDeductionMinutes = approval.break_deduction_minutes || shift.break_minutes || 60;
          const paidMinutes = Math.max(0, totalMinutesWorked - breakDeductionMinutes);

          updateData = {
            ...updateData,
            clock_in_time: manualStartTime.toISOString(),
            clock_out_time: manualEndTime.toISOString(),
            scheduled_minutes_paid: paidMinutes,
            status: 'completed',
            discrepancy_type: 'manual_time_entry',
            notes: `${approval.general_notes || ''} - Manual time entry: ${approval.manual_start_time} to ${approval.manual_end_time}. Break deduction: ${breakDeductionMinutes} minutes`.trim()
          };

          // Create time segment for manual entry
          await supabase
            .from('time_segments')
            .insert({
              time_clock_record_id: recordId,
              segment_type: 'manual_entry',
              start_time: manualStartTime.toISOString(),
              end_time: manualEndTime.toISOString(),
              minutes_worked: totalMinutesWorked,
              minutes_paid: paidMinutes,
              pay_status: 'paid'
            });
        }
        
        const { error: updateError } = await supabase
          .from('time_clock_records')
          .update(updateData)
          .eq('id', recordId);
        
        if (updateError) throw updateError;
        return;
      }

      // Handle normal discrepancies with actual clock times (keep existing logic)
      const clockInTime = record.clock_in_time ? parseISO(record.clock_in_time) : null;
      const clockOutTime = record.clock_out_time ? parseISO(record.clock_out_time) : null;
      const shift = record.shift;
      
      if (!shift || !clockInTime || !clockOutTime) {
        throw new Error('Missing shift or clock times');
      }
      
      const shiftStartTime = parseISO(`${shift.date}T${shift.start_time}`);
      const shiftEndTime = parseISO(`${shift.date}T${shift.end_time}`);
      
      // Calculate time segments (existing logic)
      let earlyMinutes = 0;
      let scheduledMinutes = 0;
      let lateMinutes = 0;
      let earlyPaidMinutes = 0;
      let scheduledPaidMinutes = 0;
      let latePaidMinutes = 0;
      
      if (clockInTime < shiftStartTime) {
        earlyMinutes = differenceInMinutes(shiftStartTime, clockInTime);
        earlyPaidMinutes = approval.early_overtime_decision === 'paid' ? earlyMinutes : 0;
      }
      
      const actualStartTime = clockInTime > shiftStartTime ? clockInTime : shiftStartTime;
      const actualEndTime = clockOutTime < shiftEndTime ? clockOutTime : shiftEndTime;
      if (actualEndTime > actualStartTime) {
        scheduledMinutes = differenceInMinutes(actualEndTime, actualStartTime);
        scheduledPaidMinutes = scheduledMinutes;
      }
      
      if (clockOutTime > shiftEndTime) {
        lateMinutes = differenceInMinutes(clockOutTime, shiftEndTime);
        latePaidMinutes = approval.late_overtime_decision === 'paid' ? lateMinutes : 0;
      }
      
      const combinedNotes = [
        approval.early_overtime_notes && `Early overtime: ${approval.early_overtime_notes}`,
        approval.late_overtime_notes && `Late overtime: ${approval.late_overtime_notes}`,
        approval.general_notes && `General: ${approval.general_notes}`
      ].filter(Boolean).join('; ');

      // Update the time clock record (DON'T CHANGE ACTUAL CLOCK TIMES)
      const { error: updateError } = await supabase
        .from('time_clock_records')
        .update({
          approval_status: 'approved',
          notes: combinedNotes,
          early_minutes_worked: earlyMinutes,
          early_minutes_paid: earlyPaidMinutes,
          late_minutes_worked: lateMinutes,
          late_minutes_paid: latePaidMinutes,
          scheduled_minutes_paid: scheduledPaidMinutes,
          early_overtime_status: approval.early_overtime_decision || 'pending',
          late_overtime_status: approval.late_overtime_decision || 'pending',
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId);
      
      if (updateError) throw updateError;
      
      // Create time segments for detailed reporting
      if (clockInTime && clockOutTime) {
        const segments = [];
        
        if (earlyMinutes > 0) {
          segments.push({
            time_clock_record_id: recordId,
            segment_type: 'early_overtime',
            start_time: clockInTime.toISOString(),
            end_time: shiftStartTime.toISOString(),
            minutes_worked: earlyMinutes,
            minutes_paid: earlyPaidMinutes,
            pay_status: approval.early_overtime_decision || 'pending'
          });
        }
        
        if (scheduledMinutes > 0) {
          segments.push({
            time_clock_record_id: recordId,
            segment_type: 'scheduled',
            start_time: actualStartTime.toISOString(),
            end_time: actualEndTime.toISOString(),
            minutes_worked: scheduledMinutes,
            minutes_paid: scheduledPaidMinutes,
            pay_status: 'paid'
          });
        }
        
        if (lateMinutes > 0) {
          segments.push({
            time_clock_record_id: recordId,
            segment_type: 'late_overtime',
            start_time: shiftEndTime.toISOString(),
            end_time: clockOutTime.toISOString(),
            minutes_worked: lateMinutes,
            minutes_paid: latePaidMinutes,
            pay_status: approval.late_overtime_decision || 'pending'
          });
        }
        
        if (segments.length > 0) {
          const { error: segmentsError } = await supabase
            .from('time_segments')
            .insert(segments);
            
          if (segmentsError) {
            console.error('Error creating time segments:', segmentsError);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-discrepancies-new'] });
      queryClient.invalidateQueries({ queryKey: ['hours-analysis-detailed'] });
      toast({ title: "Time discrepancy processed successfully" });
      setSelectedRecord(null);
      setApprovals(prev => {
        const updated = { ...prev };
        if (selectedRecord) delete updated[selectedRecord];
        return updated;
      });
    },
    onError: (error) => {
      toast({ 
        title: "Error processing discrepancy", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const getOvertimeOptions = (type: 'early' | 'late') => [
    { value: 'paid', label: `Pay ${type} overtime` },
    { value: 'unpaid', label: `Don't pay ${type} overtime` }
  ];

  const formatDiscrepancyType = (type: string) => {
    if (!type) return 'Unknown discrepancy';
    
    return type
      .split(',')
      .map(t => t.trim())
      .map(t => {
        switch (t) {
          case 'early_clock_in':
            return 'Early clock in';
          case 'late_clock_in':
            return 'Late clock in';
          case 'early_clock_out':
            return 'Early clock out';
          case 'late_clock_out':
            return 'Late clock out';
          case 'did_not_clock_in':
            return 'Did not clock in';
          default:
            return t.replace(/_/g, ' ');
        }
      })
      .join(', ');
  };

  const getTimeDifference = (actual: string, scheduled: string, date: string) => {
    const actualTime = parseISO(actual);
    const scheduledDateTime = parseISO(`${date}T${scheduled}`);
    return differenceInMinutes(actualTime, scheduledDateTime);
  };

  const updateApproval = (recordId: string, field: keyof DiscrepancyApproval, value: string | boolean | number) => {
    setApprovals(prev => ({
      ...prev,
      [recordId]: {
        ...prev[recordId],
        [field]: value
      }
    }));
  };

  const canApprove = (recordId: string) => {
    const record = discrepancyRecords?.find(r => r.id === recordId);
    const approval = approvals[recordId];
    if (!record) return false;

    // If employee didn't clock in at all, we need manual times to approve
    if (record.discrepancy_type === 'did_not_clock_in') {
      return approval?.manual_start_time && approval?.manual_end_time;
    }

    // For actual clock time discrepancies, check if we have decisions for required overtime periods
    if (!approval) return false;
    
    const hasEarlyOvertime = record.clock_in_time && record.shift && 
      parseISO(record.clock_in_time) < parseISO(`${record.shift.date}T${record.shift.start_time}`);
    const hasLateOvertime = record.clock_out_time && record.shift && 
      parseISO(record.clock_out_time) > parseISO(`${record.shift.date}T${record.shift.end_time}`);

    return (!hasEarlyOvertime || approval.early_overtime_decision) &&
           (!hasLateOvertime || approval.late_overtime_decision);
  };

  const handleApprove = () => {
    if (!selectedRecord) return;
    approveRecordMutation.mutate({ recordId: selectedRecord });
  };

  const calculateScheduledHours = (shift: any) => {
    const startTime = parseISO(`${shift.date}T${shift.start_time}`);
    const endTime = parseISO(`${shift.date}T${shift.end_time}`);
    return differenceInMinutes(endTime, startTime) / 60;
  };

  const getBreakDeductionHours = (shift: any) => {
    return (shift.break_minutes || 60) / 60; // Convert minutes to hours, default to 1 hour
  };

  const calculateFinalPayLength = (recordId: string, shift: any) => {
    const approval = approvals[recordId];
    if (!approval || !approval.manual_start_time || !approval.manual_end_time) {
      // Default calculation
      const scheduledHours = calculateScheduledHours(shift);
      const breakDeductionHours = getBreakDeductionHours(shift);
      return Math.max(0, scheduledHours - breakDeductionHours);
    }

    // Calculate from manual times
    const manualHours = differenceInMinutes(
      parseISO(`2000-01-01T${approval.manual_end_time}`), 
      parseISO(`2000-01-01T${approval.manual_start_time}`)
    ) / 60;
    
    const breakDeductionHours = (approval.break_deduction_minutes || shift.break_minutes || 60) / 60;
    return Math.max(0, manualHours - breakDeductionHours);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading discrepancies...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Time Discrepancy Management</h2>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {discrepancyRecords?.length || 0} pending
        </Badge>
      </div>

      {discrepancyRecords && discrepancyRecords.length > 0 ? (
        <div className="space-y-4">
          {discrepancyRecords.map((record) => {
            const isSelected = selectedRecord === record.id;
            const approval = approvals[record.id] || {};
            
            // Check if this is a no-show case
            const isNoShow = record.discrepancy_type === 'did_not_clock_in';
            
            // Calculate overtime periods for non-no-show cases
            const hasEarlyOvertime = !isNoShow && record.clock_in_time && record.shift && 
              parseISO(record.clock_in_time) < parseISO(`${record.shift.date}T${record.shift.start_time}`);
            const hasLateOvertime = !isNoShow && record.clock_out_time && record.shift && 
              parseISO(record.clock_out_time) > parseISO(`${record.shift.date}T${record.shift.end_time}`);
            
            return (
              <Card key={record.id} className={`${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                      {record.employee ? 
                        `${record.employee.first_name} ${record.employee.last_name}` : 
                        'Unknown Employee'
                      }
                    </CardTitle>
                    <div className="flex space-x-2">
                      <Badge variant="destructive">
                        {formatDiscrepancyType(record.discrepancy_type || '')}
                      </Badge>
                      <Badge variant="outline">
                        {record.shift?.date ? format(parseISO(record.shift.date), 'MMM dd') : 'Unknown date'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        Scheduled: {record.shift?.start_time || 'N/A'} - {record.shift?.end_time || 'N/A'}
                      </span>
                    </div>
                    
                    {!isNoShow && (
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>
                          Actual: {record.clock_in_time ? format(parseISO(record.clock_in_time), 'HH:mm') : 'N/A'} - {record.clock_out_time ? format(parseISO(record.clock_out_time), 'HH:mm') : 'N/A'}
                        </span>
                      </div>
                    )}

                    {isNoShow && record.shift && (
                      <div className="border rounded-lg p-4 bg-red-50">
                        <div className="flex items-center space-x-2 text-red-600 mb-3">
                          <AlertCircle className="w-4 h-4" />
                          <span>Employee did not clock in for scheduled shift</span>
                        </div>
                        
                        {/* Simplified Shift Information - removed financial details */}
                        <div className="grid grid-cols-1 gap-4 mb-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <div>
                              <div className="font-medium">Scheduled Hours</div>
                              <div>{calculateScheduledHours(record.shift).toFixed(1)}h</div>
                            </div>
                          </div>
                        </div>

                        {/* Break Deduction and Final Pay Length */}
                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm bg-white p-3 rounded border">
                          <div>
                            <div className="font-medium text-gray-600">Break Deduction</div>
                            <div className="text-sm">{getBreakDeductionHours(record.shift).toFixed(1)}h</div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-600">Final Pay Length</div>
                            <div className="text-sm font-medium text-green-600">
                              {calculateFinalPayLength(record.id, record.shift).toFixed(1)}h
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="space-y-4 border-t pt-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Actual Start Time</Label>
                                <Input
                                  type="time"
                                  value={approval.manual_start_time || record.shift.start_time}
                                  onChange={(e) => updateApproval(record.id, 'manual_start_time', e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Actual End Time</Label>
                                <Input
                                  type="time"
                                  value={approval.manual_end_time || record.shift.end_time}
                                  onChange={(e) => updateApproval(record.id, 'manual_end_time', e.target.value)}
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Break Deduction (minutes)</Label>
                              <Input
                                type="number"
                                min="0"
                                step="15"
                                value={approval.break_deduction_minutes || record.shift.break_minutes || 60}
                                onChange={(e) => updateApproval(record.id, 'break_deduction_minutes', parseInt(e.target.value) || 0)}
                              />
                            </div>
                            
                            {approval.manual_start_time && approval.manual_end_time && (
                              <div className="p-2 bg-green-50 rounded text-sm text-green-700">
                                <Clock className="w-4 h-4 inline mr-1" />
                                Final pay length: {calculateFinalPayLength(record.id, record.shift).toFixed(1)}h
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Early Overtime Section */}
                    {hasEarlyOvertime && (
                      <div className="border rounded-lg p-4 bg-blue-50">
                        <div className="flex items-center space-x-2 text-blue-600 mb-2">
                          <AlertCircle className="w-4 h-4" />
                          <span>
                            Early arrival: {Math.abs(getTimeDifference(record.clock_in_time!, record.shift!.start_time, record.shift!.date))} minutes early
                          </span>
                        </div>
                        {isSelected && (
                          <div className="space-y-2">
                            <Label>Early Overtime Decision</Label>
                            <Select 
                              value={approval.early_overtime_decision || ''} 
                              onValueChange={(value) => updateApproval(record.id, 'early_overtime_decision', value as 'paid' | 'unpaid')}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choose payment for early arrival..." />
                              </SelectTrigger>
                              <SelectContent>
                                {getOvertimeOptions('early').map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Textarea
                              placeholder="Notes for early overtime decision..."
                              value={approval.early_overtime_notes || ''}
                              onChange={(e) => updateApproval(record.id, 'early_overtime_notes', e.target.value)}
                              rows={2}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Late Overtime Section */}
                    {hasLateOvertime && (
                      <div className="border rounded-lg p-4 bg-orange-50">
                        <div className="flex items-center space-x-2 text-orange-600 mb-2">
                          <AlertCircle className="w-4 h-4" />
                          <span>
                            Late departure: {getTimeDifference(record.clock_out_time!, record.shift!.end_time, record.shift!.date)} minutes late
                          </span>
                        </div>
                        {isSelected && (
                          <div className="space-y-2">
                            <Label>Late Overtime Decision</Label>
                            <Select 
                              value={approval.late_overtime_decision || ''} 
                              onValueChange={(value) => updateApproval(record.id, 'late_overtime_decision', value as 'paid' | 'unpaid')}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choose payment for late departure..." />
                              </SelectTrigger>
                              <SelectContent>
                                {getOvertimeOptions('late').map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Textarea
                              placeholder="Notes for late overtime decision..."
                              value={approval.late_overtime_notes || ''}
                              onChange={(e) => updateApproval(record.id, 'late_overtime_notes', e.target.value)}
                              rows={2}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* General Notes */}
                    {isSelected && (
                      <div className="space-y-2">
                        <Label>General Notes</Label>
                        <Textarea
                          placeholder="Additional notes for this time record..."
                          value={approval.general_notes || ''}
                          onChange={(e) => updateApproval(record.id, 'general_notes', e.target.value)}
                          rows={2}
                        />
                      </div>
                    )}
                  </div>

                  {isSelected && (
                    <div className="flex space-x-2 pt-4 border-t">
                      <Button
                        onClick={handleApprove}
                        disabled={!canApprove(record.id) || approveRecordMutation.isPending}
                        className="flex-1"
                      >
                        {approveRecordMutation.isPending ? 'Processing...' : 'Process Time Record'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedRecord(null);
                          setApprovals(prev => {
                            const updated = { ...prev };
                            delete updated[record.id];
                            return updated;
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  {!isSelected && (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedRecord(record.id)}
                      className="w-full"
                    >
                      Review & Process
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <div className="space-y-2">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
              <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
              <p className="text-gray-500">
                No time discrepancies requiring approval at the moment.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TimeDiscrepancyManager;
