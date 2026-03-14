import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PoundSterling, RefreshCw, AlertTriangle } from "lucide-react";
import { usePayRates, useAddPayRate, PayRate } from "@/hooks/usePayRates";
import { useCareerHistory } from "@/hooks/useCareerHistory";
import { usePositionPayRates } from "@/hooks/usePositionPayRates";
import { toast } from "sonner";

interface PayRateHistoryProps {
  employeeId: string;
  canEdit: boolean;
}

const PayRateHistory = ({ employeeId, canEdit }: PayRateHistoryProps) => {
  const { data: payRates = [], isLoading } = usePayRates(employeeId);
  const { data: careerHistory = [] } = useCareerHistory(employeeId);
  const [updateEntryId, setUpdateEntryId] = useState<string | null>(null);

  const formatDate = (d: string) => {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString('en-GB'); } catch { return d; }
  };

  // Group pay rates by career_history_id or fall back to matching by job title
  const getRatesForEntry = (entryId: string) =>
    payRates.filter(r => r.employee_job_role_id === entryId);

  const getCurrentRate = (entryId: string): PayRate | undefined =>
    payRates.find(r => r.employee_job_role_id === entryId && !r.effective_to);

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading pay history...</div>;

  if (careerHistory.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm border rounded-md">
        No active employment history. Add a position in Employment History first, then assign pay rates.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {careerHistory.map((entry) => {
        const entryRates = getRatesForEntry(entry.id);
        const currentRate = getCurrentRate(entry.id);

        return (
          <Card key={entry.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <PoundSterling className="w-4 h-4" />
                    {entry.job_title}
                  </CardTitle>
                  {!entry.end_date && <Badge variant="secondary" className="text-xs">Current</Badge>}
                </div>
                <div className="flex items-center gap-3">
                  {currentRate ? (
                    <span className="text-sm font-medium text-foreground">
                      Current: {currentRate.currency} {Number(currentRate.pay_rate).toFixed(2)}/{currentRate.pay_type === 'salary' ? 'yr' : 'hr'}
                    </span>
                  ) : (
                    <span className="text-sm text-destructive flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> No rate set
                    </span>
                  )}
                  {canEdit && (
                    <Button size="sm" variant="outline" onClick={() => setUpdateEntryId(entry.id)}>
                      <RefreshCw className="w-3 h-3 mr-1" /> {currentRate ? 'Update' : 'Set Rate'}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            {entryRates.length > 0 && (
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
                    {entryRates.map((rate) => (
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

      {updateEntryId && (
        <UpdatePayRateDialog
          employeeId={employeeId}
          careerHistoryId={updateEntryId}
          jobTitle={careerHistory.find(e => e.id === updateEntryId)?.job_title || ''}
          onClose={() => setUpdateEntryId(null)}
          onSuccess={() => {
            setUpdateEntryId(null);
            toast.success("Pay rate updated successfully");
          }}
        />
      )}
    </div>
  );
};

const UpdatePayRateDialog = ({
  employeeId,
  careerHistoryId,
  jobTitle,
  onClose,
  onSuccess,
}: {
  employeeId: string;
  careerHistoryId: string;
  jobTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const addPayRate = useAddPayRate();
  const { data: positionPayRates = [] } = usePositionPayRates(jobTitle || undefined);
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
        employee_job_role_id: careerHistoryId,
        pay_rate: rate,
        pay_type: payType,
        currency: 'GBP',
        effective_from: effectiveFrom,
        reason: reason || (useCustom ? 'Custom rate' : `${selectedTier?.name} (${jobTitle})`),
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
          <DialogTitle>Update Pay Rate — {jobTitle}</DialogTitle>
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
            <p className="text-xs text-muted-foreground mt-1">Previous rate for this position will be ended on this date.</p>
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
