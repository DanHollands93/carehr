import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PoundSterling, RefreshCw } from "lucide-react";
import { usePayRates, useAddPayRate } from "@/hooks/usePayRates";
import { usePositionPayRates } from "@/hooks/usePositionPayRates";
import { useCareerHistory } from "@/hooks/useCareerHistory";
import { toast } from "sonner";

interface PayRateHistoryProps {
  employeeId: string;
  canEdit: boolean;
}

const PayRateHistory = ({ employeeId, canEdit }: PayRateHistoryProps) => {
  const { data: payRates = [], isLoading } = usePayRates(employeeId);
  const { data: careerHistory = [] } = useCareerHistory(employeeId);
  const addPayRate = useAddPayRate();
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  // Get unique positions from career history
  const positions = [...new Set(careerHistory.map(ch => ch.job_title).filter(Boolean))];

  const formatDate = (d: string) => {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString('en-GB'); } catch { return d; }
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading pay history...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <PoundSterling className="w-4 h-4" />
          Pay Rate History
        </h3>
        {canEdit && (
          <Button size="sm" onClick={() => setShowUpdateDialog(true)}>
            <RefreshCw className="w-4 h-4 mr-1" /> Update Pay Rate
          </Button>
        )}
      </div>

      {payRates.length > 0 ? (
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
                <TableCell className="font-medium">{rate.currency} {Number(rate.pay_rate).toFixed(2)}</TableCell>
                <TableCell className="capitalize">{rate.pay_type}</TableCell>
                <TableCell>{formatDate(rate.effective_from)}</TableCell>
                <TableCell>{rate.effective_to ? formatDate(rate.effective_to) : <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Current</span>}</TableCell>
                <TableCell className="text-muted-foreground">{rate.reason || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-md">No pay rate history recorded. Click "Update Pay Rate" to add one.</div>
      )}

      {showUpdateDialog && (
        <UpdatePayRateDialog
          employeeId={employeeId}
          positions={positions}
          onClose={() => setShowUpdateDialog(false)}
          onSuccess={() => {
            setShowUpdateDialog(false);
            toast.success("Pay rate updated successfully");
          }}
        />
      )}
    </div>
  );
};

// Dialog for updating/adding a pay rate
const UpdatePayRateDialog = ({
  employeeId,
  positions,
  onClose,
  onSuccess,
}: {
  employeeId: string;
  positions: string[];
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const addPayRate = useAddPayRate();
  const [selectedPosition, setSelectedPosition] = useState<string>(positions[0] || '');
  const { data: positionPayRates = [] } = usePositionPayRates(selectedPosition || undefined);
  const [selectedPayRateId, setSelectedPayRateId] = useState<string>('');
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
        pay_rate: rate,
        pay_type: payType,
        currency: 'GBP',
        effective_from: effectiveFrom,
        reason: reason || (useCustom ? 'Custom rate' : `${selectedTier?.name} (${selectedPosition})`),
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
          <DialogTitle>Update Pay Rate</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Position selector */}
          {positions.length > 0 && (
            <div>
              <Label>Position</Label>
              <Select value={selectedPosition} onValueChange={(v) => { setSelectedPosition(v); setSelectedPayRateId(''); }}>
                <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                <SelectContent>
                  {positions.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Pay rate tier selector */}
          {!useCustom && (
            <div>
              <Label>Pay Rate Tier</Label>
              <Select value={selectedPayRateId} onValueChange={setSelectedPayRateId}>
                <SelectTrigger><SelectValue placeholder={positionPayRates.length > 0 ? "Select a rate tier" : "No tiers for this position"} /></SelectTrigger>
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

          {/* Custom rate toggle */}
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
            <p className="text-xs text-muted-foreground mt-1">The date this rate starts. Previous rate will be ended on this date.</p>
          </div>

          <div>
            <Label>Reason</Label>
            <Input placeholder="e.g. Annual uplift, Promotion, Role change" value={reason} onChange={(e) => setReason(e.target.value)} />
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
