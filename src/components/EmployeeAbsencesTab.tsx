import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserCompanyId } from '@/hooks/useUserCompanyId';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface EmployeeAbsencesTabProps {
  employeeId: string;
}

const EmployeeAbsencesTab = ({ employeeId }: EmployeeAbsencesTabProps) => {
  const { companyId } = useUserCompanyId();
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const canManageAbsences = hasPermission('edit_employees') || hasPermission('manage_absences');

  const { data: absences = [], isLoading } = useQuery({
    queryKey: ['employee-absences', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('absences')
        .select('*, absence_types(id, name, color, is_payable)')
        .eq('employee_id', employeeId)
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!employeeId,
  });

  const { data: absenceTypes = [] } = useQuery({
    queryKey: ['absence-types', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('absence_types')
        .select('*')
        .eq('company_id', companyId!)
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Form state
  const [formData, setFormData] = useState({
    absence_type_id: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    reason: '',
    status: 'approved',
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('absences').insert({
        employee_id: employeeId,
        company_id: companyId,
        absence_type_id: formData.absence_type_id,
        start_date: formData.start_date,
        end_date: formData.end_date || formData.start_date,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        reason: formData.reason || null,
        status: formData.status,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-absences', employeeId] });
      toast.success('Absence added successfully');
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Failed to add absence: ' + error.message);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('absences')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-absences', employeeId] });
      toast.success('Absence status updated');
    },
    onError: (error: any) => {
      toast.error('Failed to update absence: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      absence_type_id: '',
      start_date: '',
      end_date: '',
      start_time: '',
      end_time: '',
      reason: '',
      status: 'approved',
    });
  };

  const filteredAbsences = statusFilter === 'all'
    ? absences
    : absences.filter((a: any) => a.status === statusFilter);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-muted text-muted-foreground',
    };
    return (
      <Badge className={variants[status] || 'bg-muted text-muted-foreground'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd MMM yyyy');
    } catch {
      return dateStr;
    }
  };

  if (isLoading) return <div className="p-4">Loading absences...</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" /> Absences
              </CardTitle>
              <CardDescription>View and manage employee absence records</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              {canManageAbsences && (
                <Button onClick={() => setShowAddDialog(true)} size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Add Absence
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAbsences.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No absences found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Times</TableHead>
                  <TableHead>Payable</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  {canManageAbsences && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAbsences.map((absence: any) => (
                  <TableRow key={absence.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: absence.absence_types?.color || '#6366f1' }}
                        />
                        {absence.absence_types?.name || 'Unknown'}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(absence.start_date)}</TableCell>
                    <TableCell>{formatDate(absence.end_date)}</TableCell>
                    <TableCell>
                      {absence.start_time && absence.end_time ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Clock className="w-3 h-3" />
                          {absence.start_time} - {absence.end_time}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Full day</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={absence.absence_types?.is_payable ? 'default' : 'outline'}>
                        {absence.absence_types?.is_payable ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(absence.status)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {absence.reason || '-'}
                    </TableCell>
                    {canManageAbsences && (
                      <TableCell>
                        <div className="flex gap-1">
                          {absence.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 h-7 text-xs"
                                onClick={() => updateStatusMutation.mutate({ id: absence.id, status: 'approved' })}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 h-7 text-xs"
                                onClick={() => updateStatusMutation.mutate({ id: absence.id, status: 'rejected' })}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {absence.status === 'approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-muted-foreground h-7 text-xs"
                              onClick={() => updateStatusMutation.mutate({ id: absence.id, status: 'cancelled' })}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Absence Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Absence</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Absence Type</Label>
              <Select
                value={formData.absence_type_id}
                onValueChange={(v) => setFormData({ ...formData, absence_type_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {absenceTypes.map((type: any) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                        {type.name}
                        {type.is_payable && <Badge variant="secondary" className="ml-1 text-xs">Paid</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time (optional)</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div>
                <Label>End Time (optional)</Label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Optional reason for absence"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button
              onClick={() => addMutation.mutate()}
              disabled={!formData.absence_type_id || !formData.start_date || addMutation.isPending}
            >
              {addMutation.isPending ? 'Adding...' : 'Add Absence'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeAbsencesTab;
