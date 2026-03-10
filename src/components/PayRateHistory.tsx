import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, PoundSterling } from "lucide-react";
import { usePayRates, useAddPayRate } from "@/hooks/usePayRates";
import { toast } from "sonner";

interface PayRateHistoryProps {
  employeeId: string;
  canEdit: boolean;
}

const PayRateHistory = ({ employeeId, canEdit }: PayRateHistoryProps) => {
  const { data: payRates = [], isLoading } = usePayRates(employeeId);
  const addPayRate = useAddPayRate();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newRate, setNewRate] = useState({
    pay_rate: '',
    pay_type: 'hourly',
    currency: 'GBP',
    effective_from: new Date().toISOString().split('T')[0],
    reason: '',
  });

  const handleAdd = async () => {
    if (!newRate.pay_rate || Number(newRate.pay_rate) <= 0) {
      toast.error("Pay rate must be greater than 0");
      return;
    }
    try {
      await addPayRate.mutateAsync({
        employee_id: employeeId,
        pay_rate: Number(newRate.pay_rate),
        pay_type: newRate.pay_type,
        currency: newRate.currency,
        effective_from: newRate.effective_from,
        reason: newRate.reason || undefined,
      });
      toast.success("Pay rate added successfully");
      setShowAddDialog(false);
      setNewRate({ pay_rate: '', pay_type: 'hourly', currency: 'GBP', effective_from: new Date().toISOString().split('T')[0], reason: '' });
    } catch {
      toast.error("Failed to add pay rate");
    }
  };

  const formatDate = (d: string) => {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString('en-GB'); } catch { return d; }
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading pay history...</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-base flex items-center gap-2">
            <PoundSterling className="w-4 h-4" />
            Pay Rate History
          </CardTitle>
          {canEdit && (
            <Button size="sm" variant="outline" onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add Rate
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
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
          <div className="text-center py-4 text-muted-foreground text-sm">No pay rate history recorded</div>
        )}
      </CardContent>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Pay Rate</DialogTitle>
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
              <Input placeholder="e.g. Annual uplift, Promotion" value={newRate.reason} onChange={(e) => setNewRate(p => ({ ...p, reason: e.target.value }))} />
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
    </Card>
  );
};

export default PayRateHistory;
