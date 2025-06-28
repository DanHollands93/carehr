
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
  shift_id: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  status: 'scheduled' | 'clocked_in' | 'completed' | 'discrepancy';
  discrepancy_type: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  shifts?: {
    date: string;
    start_time: string;
    end_time: string;
    employees: {
      first_name: string;
      last_name: string;
    };
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
          shifts!inner(
            date,
            start_time,
            end_time,
            employees!inner(first_name, last_name)
          )
        `)
        .eq('status', 'discrepancy')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching discrepancy records:', error);
        throw error;
      }
      
      console.log('Fetched discrepancy records:', data);
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

  const getDiscrepancyInfo = (record: TimeClockRecord) => {
    if (!record.discrepancy_type) {
      return { type: 'Unknown discrepancy', severity: 'medium' };
    }

    const types = record.discrepancy_type.split(',');
    let maxSeverity = 'low';

    types.forEach(type => {
      switch (type.trim()) {
        case 'early_clock_in':
          if (record.clock_in_time && record.shifts) {
            const clockIn = parseISO(record.clock_in_time);
            const shiftStart = parseISO(`${record.shifts.date}T${record.shifts.start_time}`);
            const diff = Math.abs(differenceInMinutes(clockIn, shiftStart));
            if (diff > 30) maxSeverity = 'high';
            else if (diff > 15) maxSeverity = 'medium';
          }
          break;
        case 'late_clock_in':
          maxSeverity = 'high';
          break;
        case 'early_clock_out':
          maxSeverity = 'medium';
          break;
        case 'late_clock_out':
          if (maxSeverity !== 'high') maxSeverity = 'medium';
          break;
      }
    });

    return {
      type: formatDiscrepancyType(record.discrepancy_type),
      severity: maxSeverity
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
                      {record.shifts?.employees?.first_name} {record.shifts?.employees?.last_name}
                    </CardTitle>
                    <div className="flex space-x-2">
                      <Badge 
                        variant={discrepancyInfo.severity === 'high' ? 'destructive' : discrepancyInfo.severity === 'medium' ? 'default' : 'secondary'}
                      >
                        {discrepancyInfo.severity} priority
                      </Badge>
                      <Badge variant="outline">
                        {record.shifts?.date ? format(parseISO(record.shifts.date), 'MMM dd') : 'Unknown date'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>Scheduled: {record.shifts?.start_time} - {record.shifts?.end_time}</span>
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
