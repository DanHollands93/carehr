import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, ChevronDown, ChevronRight, PoundSterling, TrendingUp, Briefcase } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useJobRolePayRates, useAddPayRate, type PayRate } from "@/hooks/usePayRates";
import { useUserCompanyId } from "@/hooks/useUserCompanyId";
import { toast } from "sonner";

interface JobRole {
  id: string;
  title: string;
  department: string | null;
  pay_rate: number | null;
  location: string | null;
}

const useJobRoles = () => {
  const { companyId } = useUserCompanyId();
  return useQuery({
    queryKey: ['job-roles', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('job_roles')
        .select('*')
        .eq('company_id', companyId)
        .order('title');
      if (error) throw error;
      return (data || []) as JobRole[];
    },
    enabled: !!companyId,
  });
};

const JobRolePayRates = ({ role }: { role: JobRole }) => {
  const { data: payRates = [], isLoading } = useJobRolePayRates(role.id);
  const addPayRate = useAddPayRate();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [newRate, setNewRate] = useState({
    pay_rate: '',
    pay_type: 'hourly',
    effective_from: new Date().toISOString().split('T')[0],
    reason: '',
  });

  const currentRate = payRates.find(r => !r.effective_to);

  const handleAdd = async () => {
    if (!newRate.pay_rate || Number(newRate.pay_rate) <= 0) {
      toast.error("Pay rate must be greater than 0");
      return;
    }
    try {
      await addPayRate.mutateAsync({
        job_role_id: role.id,
        pay_rate: Number(newRate.pay_rate),
        pay_type: newRate.pay_type,
        currency: 'GBP',
        effective_from: newRate.effective_from,
        reason: newRate.reason || undefined,
      });

      // Also update the job_roles table current pay_rate
      await supabase
        .from('job_roles')
        .update({ pay_rate: Number(newRate.pay_rate) })
        .eq('id', role.id);

      toast.success("Pay rate added to role");
      setShowAddDialog(false);
      setNewRate({ pay_rate: '', pay_type: 'hourly', effective_from: new Date().toISOString().split('T')[0], reason: '' });
    } catch {
      toast.error("Failed to add pay rate");
    }
  };

  const formatDate = (d: string) => {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString('en-GB'); } catch { return d; }
  };

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="border rounded-lg">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left">
              <div className="flex items-center gap-3">
                {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                <div>
                  <div className="font-medium">{role.title}</div>
                  <div className="text-sm text-muted-foreground">{role.department || 'No department'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {currentRate ? (
                  <Badge variant="secondary">
                    £{Number(currentRate.pay_rate).toFixed(2)}/{currentRate.pay_type === 'salary' ? 'yr' : 'hr'}
                  </Badge>
                ) : role.pay_rate ? (
                  <Badge variant="outline">
                    £{Number(role.pay_rate).toFixed(2)}/hr
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">No rate set</Badge>
                )}
                <Badge variant="outline" className="text-xs">{payRates.length} rate{payRates.length !== 1 ? 's' : ''}</Badge>
              </div>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t px-4 pb-4 pt-2 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Pay Rate History</span>
                <Button size="sm" variant="outline" onClick={() => setShowAddDialog(true)}>
                  <Plus className="w-3 h-3 mr-1" /> Add Rate
                </Button>
              </div>
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : payRates.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rate</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payRates.map((rate) => (
                      <TableRow key={rate.id}>
                        <TableCell className="font-medium">£{Number(rate.pay_rate).toFixed(2)}</TableCell>
                        <TableCell className="capitalize">{rate.pay_type}</TableCell>
                        <TableCell>{formatDate(rate.effective_from)}</TableCell>
                        <TableCell>
                          {rate.effective_to ? formatDate(rate.effective_to) : (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Current</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{rate.reason || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-3 text-muted-foreground text-sm">
                  No pay rates recorded for this role. Add one to start tracking.
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Pay Rate — {role.title}</DialogTitle>
            <DialogDescription>Add a new base pay rate for this job role.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pay Type</Label>
                <Select value={newRate.pay_type} onValueChange={(v) => setNewRate(p => ({ ...p, pay_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="salary">Salary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{newRate.pay_type === 'hourly' ? 'Hourly Rate (£)' : 'Annual Salary (£)'}</Label>
                <Input type="number" step="0.01" min="0.01" value={newRate.pay_rate} onChange={(e) => setNewRate(p => ({ ...p, pay_rate: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Effective From</Label>
              <Input type="date" value={newRate.effective_from} onChange={(e) => setNewRate(p => ({ ...p, effective_from: e.target.value }))} />
            </div>
            <div>
              <Label>Reason</Label>
              <Input placeholder="e.g. Annual uplift, Market adjustment" value={newRate.reason} onChange={(e) => setNewRate(p => ({ ...p, reason: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={addPayRate.isPending}>
                {addPayRate.isPending ? 'Adding...' : 'Add Rate'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const BulkUpliftDialog = ({ roles, open, onOpenChange }: { roles: JobRole[]; open: boolean; onOpenChange: (v: boolean) => void }) => {
  const addPayRate = useAddPayRate();
  const queryClient = useQueryClient();
  const [upliftType, setUpliftType] = useState<'percentage' | 'fixed'>('percentage');
  const [upliftValue, setUpliftValue] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [applying, setApplying] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const toggleRole = (id: string) => {
    setSelectedRoleIds(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedRoleIds.length === roles.length) {
      setSelectedRoleIds([]);
    } else {
      setSelectedRoleIds(roles.map(r => r.id));
    }
  };

  const handleApply = async () => {
    if (!upliftValue || Number(upliftValue) <= 0) {
      toast.error("Enter a valid uplift value");
      return;
    }
    if (selectedRoleIds.length === 0) {
      toast.error("Select at least one role");
      return;
    }
    setApplying(true);
    try {
      for (const roleId of selectedRoleIds) {
        const role = roles.find(r => r.id === roleId);
        if (!role || !role.pay_rate) continue;
        const newRate = upliftType === 'percentage'
          ? role.pay_rate * (1 + Number(upliftValue) / 100)
          : role.pay_rate + Number(upliftValue);

        await addPayRate.mutateAsync({
          job_role_id: roleId,
          pay_rate: Math.round(newRate * 100) / 100,
          pay_type: 'hourly',
          currency: 'GBP',
          effective_from: effectiveFrom,
          reason: reason || `Bulk uplift ${upliftType === 'percentage' ? upliftValue + '%' : '£' + upliftValue}`,
        });

        await supabase
          .from('job_roles')
          .update({ pay_rate: Math.round(newRate * 100) / 100 })
          .eq('id', roleId);
      }
      queryClient.invalidateQueries({ queryKey: ['job-roles'] });
      toast.success(`Uplift applied to ${selectedRoleIds.length} role(s)`);
      onOpenChange(false);
    } catch {
      toast.error("Failed to apply uplift");
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply Bulk Pay Uplift</DialogTitle>
          <DialogDescription>Increase pay rates across selected roles from a given date.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Uplift Type</Label>
              <Select value={upliftType} onValueChange={(v: 'percentage' | 'fixed') => setUpliftType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{upliftType === 'percentage' ? 'Percentage' : 'Amount (£)'}</Label>
              <Input type="number" step="0.01" min="0.01" value={upliftValue} onChange={(e) => setUpliftValue(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Effective From</Label>
            <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
          </div>
          <div>
            <Label>Reason</Label>
            <Input placeholder="e.g. Annual pay review 2026" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Select Roles</Label>
              <Button variant="ghost" size="sm" onClick={selectAll}>
                {selectedRoleIds.length === roles.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div className="border rounded-md max-h-48 overflow-y-auto divide-y">
              {roles.filter(r => r.pay_rate && r.pay_rate > 0).map(role => {
                const selected = selectedRoleIds.includes(role.id);
                const newRate = upliftType === 'percentage'
                  ? (role.pay_rate || 0) * (1 + Number(upliftValue || 0) / 100)
                  : (role.pay_rate || 0) + Number(upliftValue || 0);
                return (
                  <label key={role.id} className="flex items-center justify-between p-2 cursor-pointer hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={selected} onChange={() => toggleRole(role.id)} className="rounded" />
                      <span className="text-sm">{role.title}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      £{(role.pay_rate || 0).toFixed(2)} → <span className="font-medium text-foreground">£{newRate.toFixed(2)}</span>
                    </div>
                  </label>
                );
              })}
              {roles.filter(r => !r.pay_rate || r.pay_rate <= 0).length > 0 && (
                <div className="p-2 text-xs text-muted-foreground">
                  {roles.filter(r => !r.pay_rate || r.pay_rate <= 0).length} role(s) skipped (no current rate)
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleApply} disabled={applying}>
              {applying ? 'Applying...' : `Apply Uplift (${selectedRoleIds.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const JobRolePayRateManager = () => {
  const { data: roles = [], isLoading } = useJobRoles();
  const [showUplift, setShowUplift] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Job Roles & Pay Rates
            </CardTitle>
            <CardDescription>Manage base pay rates for each job role. Each role can have multiple rate records over time.</CardDescription>
          </div>
          <Button variant="outline" onClick={() => setShowUplift(true)} disabled={roles.length === 0}>
            <TrendingUp className="w-4 h-4 mr-1" /> Bulk Uplift
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-muted-foreground text-sm">Loading job roles...</div>
        ) : roles.length > 0 ? (
          <div className="space-y-2">
            {roles.map(role => (
              <JobRolePayRates key={role.id} role={role} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No job roles found. Create job roles via Lookup Lists or employee career history.
          </div>
        )}
      </CardContent>

      <BulkUpliftDialog roles={roles} open={showUplift} onOpenChange={setShowUplift} />
    </Card>
  );
};

export default JobRolePayRateManager;
