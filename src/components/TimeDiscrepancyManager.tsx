
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
import { Clock, User, AlertCircle, CheckCircle, XCircle } from "lucide-react";

interface TimeClockRecord {
  id: string;
  employee_id: string;
  shift_date: string;
  shift_start_time: string;
  shift_end_time: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  status: 'scheduled' | 'clocked_in' | 'completed' | 'discrepancy';
  discrepancy_type: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  employees?: {
    first_name: string;
    last_name: string;
  };
}

const TimeDiscrepancyManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [approvalAction, setApprovalAction] = useState<string>('');
  const [notes, setNotes] = useState('');

  const { data: discrepancyRecords, isLoading } = useQuery({
    queryKey: ['time-discrepancies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_clock_records')
        .select(`
          *,
          employees!inner(first_name, last_name)
        `)
        .eq('approval_status', 'pending')
        .or('status.eq.discrepancy,discrepancy_type.not.is.null')
        .order('shift_date', { ascending: false });
      
      if (error) throw error;
      return data as TimeClockRecord[];
    }
  });

  const approveRecordMutation = useMutation({
    mutationFn: async ({ recordId, action, notes }: { 
      recordId: string; 
      action: string; 
      notes: string;
    }) => {
      const { error } = await supabase
        .from('time_clock_records')
        .update({
          approval_status: action === 'approve' ? 'approved' : 'rejected',
          notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-discrepancies'] });
      toast({ title: "Record updated successfully" });
      setSelectedRecord(null);
      setApprovalAction('');
      setNotes('');
    },
    onError: (error) => {
      toast({ 
        title: "Error updating record", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const getDiscrepancyInfo = (record: TimeClockRecord) => {
    if (!record.clock_in_time || !record.clock_out_time) {
      return { type: 'Missing clock record', severity: 'high' };
    }

    const shiftStart = parseISO(`${record.shift_date}T${record.shift_start_time}`);
    const shiftEnd = parseISO(`${record.shift_date}T${record.shift_end_time}`);
    const clockIn = parseISO(record.clock_in_time);
    const clockOut = parseISO(record.clock_out_time);

    const clockInDiff = differenceInMinutes(clockIn, shiftStart);
    const clockOutDiff = differenceInMinutes(clockOut, shiftEnd);

    let issues = [];
    if (Math.abs(clockInDiff) > 15) {
      issues.push(`Clock in ${clockInDiff > 0 ? 'late' : 'early'} by ${Math.abs(clockInDiff)} min`);
    }
    if (Math.abs(clockOutDiff) > 15) {
      issues.push(`Clock out ${clockOutDiff > 0 ? 'late' : 'early'} by ${Math.abs(clockOutDiff)} min`);
    }

    return {
      type: issues.join(', ') || 'Unknown discrepancy',
      severity: Math.max(Math.abs(clockInDiff), Math.abs(clockOutDiff)) > 30 ? 'high' : 'medium'
    };
  };

  const handleApprove = () => {
    if (!selectedRecord || !approvalAction) return;
    
    approveRecordMutation.mutate({
      recordId: selectedRecord,
      action: approvalAction,
      notes
    });
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
            const discrepancyInfo = getDiscrepancyInfo(record);
            const isSelected = selectedRecord === record.id;
            
            return (
              <Card key={record.id} className={`${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                      {record.employees?.first_name} {record.employees?.last_name}
                    </CardTitle>
                    <div className="flex space-x-2">
                      <Badge 
                        variant={discrepancyInfo.severity === 'high' ? 'destructive' : 'secondary'}
                      >
                        {discrepancyInfo.severity} priority
                      </Badge>
                      <Badge variant="outline">
                        {format(parseISO(record.shift_date), 'MMM dd')}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>Scheduled: {record.shift_start_time} - {record.shift_end_time}</span>
                      </div>
                      {record.clock_in_time && (
                        <div className="flex items-center space-x-2 text-green-600">
                          <User className="w-4 h-4" />
                          <span>Clocked in: {format(parseISO(record.clock_in_time), 'HH:mm')}</span>
                        </div>
                      )}
                      {record.clock_out_time && (
                        <div className="flex items-center space-x-2 text-blue-600">
                          <User className="w-4 h-4" />
                          <span>Clocked out: {format(parseISO(record.clock_out_time), 'HH:mm')}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>{discrepancyInfo.type}</span>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="approval-action">Action</Label>
                        <Select value={approvalAction} onValueChange={setApprovalAction}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select approval action..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="approve">Approve as worked</SelectItem>
                            <SelectItem value="approve_overtime">Approve with overtime</SelectItem>
                            <SelectItem value="deduct_time">Deduct time for late arrival/early leave</SelectItem>
                            <SelectItem value="reject">Reject - no pay adjustment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add notes about this approval decision..."
                          rows={3}
                        />
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          onClick={handleApprove}
                          disabled={!approvalAction || approveRecordMutation.isPending}
                          className="flex-1"
                        >
                          {approveRecordMutation.isPending ? 'Processing...' : 'Apply Decision'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedRecord(null);
                            setApprovalAction('');
                            setNotes('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
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
