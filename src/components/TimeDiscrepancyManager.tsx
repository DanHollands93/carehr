import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { Clock, User, AlertCircle, CheckCircle } from "lucide-react";

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
  employee?: {
    first_name: string;
    last_name: string;
  };
  shift?: {
    date: string;
    start_time: string;
    end_time: string;
  };
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

interface Shift {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
}

interface DiscrepancyApproval {
  clock_in_action?: string;
  clock_in_notes?: string;
  clock_out_action?: string;
  clock_out_notes?: string;
}

const TimeDiscrepancyManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [approvals, setApprovals] = useState<Record<string, DiscrepancyApproval>>({});

  const { data: discrepancyRecords, isLoading } = useQuery({
    queryKey: ['time-discrepancies'],
    queryFn: async () => {
      console.log('Fetching discrepancy records...');
      
      // First, get the discrepancy records
      const { data: records, error: recordsError } = await supabase
        .from('time_clock_records')
        .select('*')
        .eq('status', 'discrepancy')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });
      
      if (recordsError) {
        console.error('Error fetching time clock records:', recordsError);
        throw recordsError;
      }
      
      console.log('Found discrepancy records:', records);
      
      if (!records || records.length === 0) {
        return [];
      }
      
      // Get unique employee IDs and shift IDs
      const employeeIds = [...new Set(records.map(r => r.employee_id))];
      const shiftIds = [...new Set(records.map(r => r.shift_id).filter(Boolean))];
      
      // Fetch employees
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .in('id', employeeIds);
      
      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        throw employeesError;
      }
      
      // Fetch shifts
      const { data: shifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('id, date, start_time, end_time')
        .in('id', shiftIds);
      
      if (shiftsError) {
        console.error('Error fetching shifts:', shiftsError);
        throw shiftsError;
      }
      
      // Create lookup maps
      const employeeMap = new Map(employees?.map(emp => [emp.id, emp]) || []);
      const shiftMap = new Map(shifts?.map(shift => [shift.id, shift]) || []);
      
      // Combine the data
      const transformedRecords = records.map(record => ({
        ...record,
        employee: employeeMap.get(record.employee_id),
        shift: shiftMap.get(record.shift_id || '')
      })) as TimeClockRecord[];
      
      console.log('Transformed records with employee and shift data:', transformedRecords);
      return transformedRecords;
    }
  });

  const approveRecordMutation = useMutation({
    mutationFn: async ({ recordId }: { recordId: string }) => {
      const approval = approvals[recordId];
      if (!approval) throw new Error('No approval data found');

      // Combine all notes into one
      const combinedNotes = [
        approval.clock_in_notes && `Clock In: ${approval.clock_in_notes}`,
        approval.clock_out_notes && `Clock Out: ${approval.clock_out_notes}`
      ].filter(Boolean).join('; ');

      const { error } = await supabase
        .from('time_clock_records')
        .update({
          approval_status: 'approved',
          notes: combinedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-discrepancies'] });
      toast({ title: "Record approved successfully" });
      setSelectedRecord(null);
      setApprovals(prev => {
        const updated = { ...prev };
        if (selectedRecord) delete updated[selectedRecord];
        return updated;
      });
    },
    onError: (error) => {
      toast({ 
        title: "Error approving record", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

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
          default:
            return t.replace(/_/g, ' ');
        }
      })
      .join(', ');
  };

  const getDiscrepancyTypes = (record: TimeClockRecord) => {
    if (!record.discrepancy_type) return [];
    return record.discrepancy_type.split(',').map(t => t.trim());
  };

  const hasClockInDiscrepancy = (record: TimeClockRecord) => {
    const types = getDiscrepancyTypes(record);
    return types.some(t => t === 'early_clock_in' || t === 'late_clock_in');
  };

  const hasClockOutDiscrepancy = (record: TimeClockRecord) => {
    const types = getDiscrepancyTypes(record);
    return types.some(t => t === 'early_clock_out' || t === 'late_clock_out');
  };

  const getTimeDifference = (actual: string, scheduled: string, date: string) => {
    const actualTime = parseISO(actual);
    const scheduledDateTime = parseISO(`${date}T${scheduled}`);
    return differenceInMinutes(actualTime, scheduledDateTime);
  };

  const updateApproval = (recordId: string, field: keyof DiscrepancyApproval, value: string) => {
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
    if (!record || !approval) return false;

    const needsClockInApproval = hasClockInDiscrepancy(record);
    const needsClockOutApproval = hasClockOutDiscrepancy(record);

    return (!needsClockInApproval || approval.clock_in_action) &&
           (!needsClockOutApproval || approval.clock_out_action);
  };

  const handleApprove = () => {
    if (!selectedRecord) return;
    approveRecordMutation.mutate({ recordId: selectedRecord });
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
                      <Badge variant="destructive">Discrepancy</Badge>
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
                    
                    {/* Clock In Section */}
                    {record.clock_in_time && hasClockInDiscrepancy(record) && (
                      <div className="border rounded-lg p-4 bg-red-50">
                        <div className="flex items-center space-x-2 text-red-600 mb-2">
                          <User className="w-4 h-4" />
                          <span>
                            Clocked in: {format(parseISO(record.clock_in_time), 'HH:mm')}
                            {record.shift && (
                              <span className="ml-2 text-sm">
                                ({getTimeDifference(record.clock_in_time, record.shift.start_time, record.shift.date) > 0 ? '+' : ''}
                                {getTimeDifference(record.clock_in_time, record.shift.start_time, record.shift.date)} min)
                              </span>
                            )}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="space-y-2">
                            <Label>Clock In Action</Label>
                            <Select 
                              value={approval.clock_in_action || ''} 
                              onValueChange={(value) => updateApproval(record.id, 'clock_in_action', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="What to do with early/late clock in..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pay_from_scheduled">Pay from scheduled time</SelectItem>
                                <SelectItem value="pay_from_actual">Pay from actual clock in time</SelectItem>
                                <SelectItem value="deduct_time">Deduct time for late arrival</SelectItem>
                              </SelectContent>
                            </Select>
                            <Textarea
                              placeholder="Notes for clock in decision..."
                              value={approval.clock_in_notes || ''}
                              onChange={(e) => updateApproval(record.id, 'clock_in_notes', e.target.value)}
                              rows={2}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Clock Out Section */}
                    {record.clock_out_time && hasClockOutDiscrepancy(record) && (
                      <div className="border rounded-lg p-4 bg-blue-50">
                        <div className="flex items-center space-x-2 text-blue-600 mb-2">
                          <User className="w-4 h-4" />
                          <span>
                            Clocked out: {format(parseISO(record.clock_out_time), 'HH:mm')}
                            {record.shift && (
                              <span className="ml-2 text-sm">
                                ({getTimeDifference(record.clock_out_time, record.shift.end_time, record.shift.date) > 0 ? '+' : ''}
                                {getTimeDifference(record.clock_out_time, record.shift.end_time, record.shift.date)} min)
                              </span>
                            )}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="space-y-2">
                            <Label>Clock Out Action</Label>
                            <Select 
                              value={approval.clock_out_action || ''} 
                              onValueChange={(value) => updateApproval(record.id, 'clock_out_action', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="What to do with early/late clock out..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pay_until_scheduled">Pay until scheduled time</SelectItem>
                                <SelectItem value="pay_until_actual">Pay until actual clock out time</SelectItem>
                                <SelectItem value="overtime_approved">Approve overtime pay</SelectItem>
                                <SelectItem value="deduct_early_leave">Deduct time for early departure</SelectItem>
                              </SelectContent>
                            </Select>
                            <Textarea
                              placeholder="Notes for clock out decision..."
                              value={approval.clock_out_notes || ''}
                              onChange={(e) => updateApproval(record.id, 'clock_out_notes', e.target.value)}
                              rows={2}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {!hasClockInDiscrepancy(record) && !hasClockOutDiscrepancy(record) && (
                      <div className="flex items-center space-x-2 text-amber-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>General discrepancy: {formatDiscrepancyType(record.discrepancy_type || '')}</span>
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
                        {approveRecordMutation.isPending ? 'Processing...' : 'Approve Decisions'}
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
                      Review & Approve
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
