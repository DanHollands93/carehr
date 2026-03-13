import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PoundSterling, RefreshCw } from "lucide-react";
import { usePayRates, useAddPayRate, PayRate } from "@/hooks/usePayRates";
import { useEmployeeJobRoles } from "@/hooks/useEmployeeJobRoles";
import { usePositionPayRates } from "@/hooks/usePositionPayRates";
import { toast } from "sonner";

interface PayRateHistoryProps {
  employeeId: string;
  canEdit: boolean;
}

const PayRateHistory = ({ employeeId, canEdit }: PayRateHistoryProps) => {
  const { data: payRates = [], isLoading } = usePayRates(employeeId);
  const { data: employeeJobRoles = [] } = useEmployeeJobRoles(employeeId);
  const [updateRoleId, setUpdateRoleId] = useState<string | null>(null);

  const formatDate = (d: string) => {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString('en-GB'); } catch { return d; }
  };

  // Group pay rates by employee_job_role_id
  const getRatesForRole = (ejrId: string) =>
    payRates.filter(r => r.employee_job_role_id === ejrId);

  const getCurrentRate = (ejrId: string): PayRate | undefined =>
    payRates.find(r => r.employee_job_role_id === ejrId && !r.effective_to);

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading pay history...</div>;

  if (employeeJobRoles.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm border rounded-md">
        No active job roles assigned. Add a job role first, then assign pay rates.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {employeeJobRoles.map((ejr) => {
        const roleRates = getRatesForRole(ejr.id);
        const currentRate = getCurrentRate(ejr.id);
        const roleTitle = ejr.job_roles?.title || 'Unknown Role';

        return (
          <Card key={ejr.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <PoundSterling className="w-4 h-4" />
                    {roleTitle}
                  </CardTitle>
                  {ejr.is_primary && <Badge variant="secondary" className="text-xs">Primary</Badge>}
                </div>
                <div className="flex items-center gap-3">
                  {currentRate ? (
                    <span className="text-sm font-medium text-foreground">
                      Current: {currentRate.currency} {Number(currentRate.pay_rate).toFixed(2)}/{currentRate.pay_type === 'salary' ? 'yr' : 'hr'}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">No rate set</span>
                  )}
                  {canEdit && (
                    <Button size="sm" variant="outline" onClick={() => setUpdateRoleId(ejr.id)}>
                      <RefreshCw className="w-3 h-3 mr-1" /> {currentRate ? 'Update' : 'Set Rate'}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            {roleRates.length > 0 && (
              <CardContent className="pt-0">
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
                    {roleRates.map((rate) => (
                      <TableRow key={rate.id}>
                        <TableCell className="font-medium">{rate.currency} {Number(rate.pay_rate).toFixed(2)}</TableCell>
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
              </CardContent>
            )}
          </Card>
        );
      })}

      {updateRoleId && (
        <UpdatePayRateDialog
          employeeId={employeeId}
          employeeJobRoleId={updateRoleId}
          jobRoleTitle={employeeJobRoles.find(r => r.id === updateRoleId)?.job_roles?.title || ''}
          onClose={() => setUpdateRoleId(null)}
          onSuccess={() => {
            setUpdateRoleId(null);
            toast.success("Pay rate updated successfully");
          }}
        />
      )}
    </div>
  );
};

const UpdatePayRateDialog = ({
  employeeId,
  employeeJobRoleId,
  jobRoleTitle,
  onClose,
  onSuccess,
}: {
  employeeId: string;
  employeeJobRoleId: string;
  jobRoleTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const addPayRate = useAddPayRate();
  const { data: positionPayRates = [] } = usePositionPayRates(jobRoleTitle || undefined);
  const [selectedPayRateId, setSelectedPayRateId] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [customRate, setCustomRate] = useState('');
  const [customPayType, setCustomPayType] = useState('hourly');
  const [reason, setReason] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const selectedTier = positionPayRates.find(r => r.id === selectedPayRateId);

  const handleSubmit = async () => {
    const rate = useCustom ? Number(customRate) : selectedTier?.pay_rate;
    const payType = useCustom ? customPayType : selectedTier?.pay_type || 'hourly';

    if (!rate || rate <= 0) {
      toast.error("Please select or enter a valid pay rate");
      return;
    }
    if (!effectiveFrom) {
      toast.error("Please enter an effective from date");
      return;
    }

    try {
      await addPayRate.mutateAsync({
        employee_id: employeeId,
        employee_job_role_id: employeeJobRoleId,
        pay_rate: rate,
        pay_type: payType,
        currency: 'GBP',
        effective_from: effectiveFrom,
        reason: reason || (useCustom ? 'Custom rate' : `${selectedTier?.name} (${jobRoleTitle})`),
      });
      onSuccess();
    } catch {
      toast.error("Failed to update pay rate");
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Pay Rate — {jobRoleTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!useCustom && (
            <div>
              <Label>Pay Rate Tier</Label>
              <Select value={selectedPayRateId} onValueChange={setSelectedPayRateId}>
                <SelectTrigger>
                  <SelectValue placeholder={positionPayRates.length > 0 ? "Select a rate tier" : "No tiers for this position"} />
                </SelectTrigger>
                <SelectContent>
                  {positionPayRates.map((rate) => (
                    <SelectItem key={rate.id} value={rate.id}>
                      {rate.name} — £{Number(rate.pay_rate).toFixed(2)}/{rate.pay_type === 'salary' ? 'yr' : 'hr'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTier && (
                <p className="text-sm mt-1 text-muted-foreground">
                  Selected: <span className="font-medium text-foreground">£{Number(selectedTier.pay_rate).toFixed(2)}</span> ({selectedTier.pay_type})
                </p>
              )}
            </div>
          )}

          <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setUseCustom(!useCustom); setSelectedPayRateId(''); }}>
            {useCustom ? '← Select from tiers instead' : 'Enter custom rate instead'}
          </Button>

          {useCustom && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pay Type</Label>
                <Select value={customPayType} onValueChange={setCustomPayType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="salary">Salary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{customPayType === 'hourly' ? 'Hourly Rate (£)' : 'Annual Salary (£)'}</Label>
                <Input type="number" step="0.01" min="0.01" value={customRate} onChange={(e) => setCustomRate(e.target.value)} />
              </div>
            </div>
          )}

          <div>
            <Label>Effective From *</Label>
            <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">Previous rate for this role will be ended on this date.</p>
          </div>

          <div>
            <Label>Reason</Label>
            <Input placeholder="e.g. Annual uplift, Promotion" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={addPayRate.isPending}>
              {addPayRate.isPending ? 'Updating...' : 'Update Pay Rate'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PayRateHistory;
