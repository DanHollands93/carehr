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
import { Plus, ChevronDown, ChevronRight, TrendingUp, Briefcase, Pencil, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useAllPositionPayRates,
  useAddPositionPayRate,
  useUpdatePositionPayRate,
  useDeletePositionPayRate,
  type PositionPayRate,
} from "@/hooks/usePositionPayRates";
import { toast } from "sonner";

// Fetch positions from lookup_lists
const usePositions = () => {
  return useQuery({
    queryKey: ['lookup-lists', 'positions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lookup_lists')
        .select('*')
        .eq('category', 'positions')
        .eq('is_active', true)
        .order('sort_order')
        .order('value');
      if (error) throw error;
      return data || [];
    },
  });
};

const PositionPayRatesSection = ({ position, rates }: { position: string; rates: PositionPayRate[] }) => {
  const addRate = useAddPositionPayRate();
  const updateRate = useUpdatePositionPayRate();
  const deleteRate = useDeletePositionPayRate();
  const [isOpen, setIsOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingRate, setEditingRate] = useState<PositionPayRate | null>(null);
  const [newRate, setNewRate] = useState({
    name: '',
    pay_rate: '',
    pay_type: 'hourly',
  });

  const activeRates = rates.filter(r => r.is_active);

  const handleAdd = async () => {
    if (!newRate.name || !newRate.pay_rate || Number(newRate.pay_rate) <= 0) {
      toast.error("Name and a valid rate are required");
      return;
    }
    try {
      await addRate.mutateAsync({
        position,
        name: newRate.name,
        pay_rate: Number(newRate.pay_rate),
        pay_type: newRate.pay_type,
      });
      toast.success("Pay rate added");
      setShowAddDialog(false);
      setNewRate({ name: '', pay_rate: '', pay_type: 'hourly' });
    } catch {
      toast.error("Failed to add pay rate");
    }
  };

  const handleUpdate = async () => {
    if (!editingRate) return;
    try {
      await updateRate.mutateAsync({
        id: editingRate.id,
        name: editingRate.name,
        pay_rate: editingRate.pay_rate,
        pay_type: editingRate.pay_type,
      });
      toast.success("Pay rate updated");
      setEditingRate(null);
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRate.mutateAsync(id);
      toast.success("Pay rate removed");
    } catch {
      toast.error("Failed to remove");
    }
  };

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="border rounded-lg">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left">
              <div className="flex items-center gap-3">
                {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                <span className="font-medium">{position}</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {activeRates.length} rate{activeRates.length !== 1 ? 's' : ''}
              </Badge>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t px-4 pb-4 pt-2 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Pay Rates</span>
                <Button size="sm" variant="outline" onClick={() => setShowAddDialog(true)}>
                  <Plus className="w-3 h-3 mr-1" /> Add Rate
                </Button>
              </div>
              {activeRates.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeRates.map((rate) => (
                      <TableRow key={rate.id}>
                        <TableCell className="font-medium">{rate.name}</TableCell>
                        <TableCell>£{Number(rate.pay_rate).toFixed(2)}</TableCell>
                        <TableCell className="capitalize">{rate.pay_type}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingRate({ ...rate })}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(rate.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-3 text-muted-foreground text-sm">
                  No pay rates for this position. Add one to get started.
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Add dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Pay Rate — {position}</DialogTitle>
            <DialogDescription>Create a named pay rate tier for this position.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rate Name *</Label>
              <Input placeholder="e.g. Standard, Weekend, Night" value={newRate.name} onChange={(e) => setNewRate(p => ({ ...p, name: e.target.value }))} />
            </div>
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
                <Label>{newRate.pay_type === 'hourly' ? 'Hourly Rate (£) *' : 'Annual Salary (£) *'}</Label>
                <Input type="number" step="0.01" min="0.01" value={newRate.pay_rate} onChange={(e) => setNewRate(p => ({ ...p, pay_rate: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={addRate.isPending}>
                {addRate.isPending ? 'Adding...' : 'Add Rate'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingRate} onOpenChange={(open) => !open && setEditingRate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pay Rate</DialogTitle>
            <DialogDescription>Update this pay rate tier.</DialogDescription>
          </DialogHeader>
          {editingRate && (
            <div className="space-y-4">
              <div>
                <Label>Rate Name *</Label>
                <Input value={editingRate.name} onChange={(e) => setEditingRate({ ...editingRate, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Pay Type</Label>
                  <Select value={editingRate.pay_type} onValueChange={(v) => setEditingRate({ ...editingRate, pay_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="salary">Salary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Rate (£) *</Label>
                  <Input type="number" step="0.01" min="0.01" value={editingRate.pay_rate} onChange={(e) => setEditingRate({ ...editingRate, pay_rate: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditingRate(null)}>Cancel</Button>
                <Button onClick={handleUpdate} disabled={updateRate.isPending}>
                  {updateRate.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const BulkUpliftDialog = ({ positions, rates, open, onOpenChange }: { positions: string[]; rates: PositionPayRate[]; open: boolean; onOpenChange: (v: boolean) => void }) => {
  const updateRate = useUpdatePositionPayRate();
  const queryClient = useQueryClient();
  const [upliftType, setUpliftType] = useState<'percentage' | 'fixed'>('percentage');
  const [upliftValue, setUpliftValue] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [applying, setApplying] = useState(false);

  const activeRates = rates.filter(r => r.is_active);

  const toggleRate = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const selectAll = () => {
    setSelectedIds(prev => prev.length === activeRates.length ? [] : activeRates.map(r => r.id));
  };

  const handleApply = async () => {
    if (!upliftValue || Number(upliftValue) <= 0 || selectedIds.length === 0) {
      toast.error("Enter a value and select at least one rate");
      return;
    }
    setApplying(true);
    try {
      for (const id of selectedIds) {
        const rate = activeRates.find(r => r.id === id);
        if (!rate) continue;
        const newPayRate = upliftType === 'percentage'
          ? rate.pay_rate * (1 + Number(upliftValue) / 100)
          : rate.pay_rate + Number(upliftValue);
        await updateRate.mutateAsync({ id, pay_rate: Math.round(newPayRate * 100) / 100 });
      }
      toast.success(`Uplift applied to ${selectedIds.length} rate(s)`);
      onOpenChange(false);
      setSelectedIds([]);
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
          <DialogDescription>Increase pay rates across selected position rates.</DialogDescription>
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
            <div className="flex justify-between items-center mb-2">
              <Label>Select Rates</Label>
              <Button variant="ghost" size="sm" onClick={selectAll}>
                {selectedIds.length === activeRates.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div className="border rounded-md max-h-48 overflow-y-auto divide-y">
              {activeRates.map(rate => {
                const selected = selectedIds.includes(rate.id);
                const newPayRate = upliftType === 'percentage'
                  ? rate.pay_rate * (1 + Number(upliftValue || 0) / 100)
                  : rate.pay_rate + Number(upliftValue || 0);
                return (
                  <label key={rate.id} className="flex items-center justify-between p-2 cursor-pointer hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={selected} onChange={() => toggleRate(rate.id)} className="rounded" />
                      <span className="text-sm">{rate.position} — {rate.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      £{rate.pay_rate.toFixed(2)} → <span className="font-medium text-foreground">£{newPayRate.toFixed(2)}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleApply} disabled={applying}>
              {applying ? 'Applying...' : `Apply Uplift (${selectedIds.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const JobRolePayRateManager = () => {
  const { data: positions = [], isLoading: loadingPositions } = usePositions();
  const { data: allRates = [], isLoading: loadingRates } = useAllPositionPayRates();
  const [showUplift, setShowUplift] = useState(false);

  const positionNames = positions.map(p => p.value);
  const ratesByPosition = positionNames.reduce((acc, pos) => {
    acc[pos] = allRates.filter(r => r.position === pos);
    return acc;
  }, {} as Record<string, PositionPayRate[]>);

  const isLoading = loadingPositions || loadingRates;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Position Pay Rates
            </CardTitle>
            <CardDescription>
              Manage pay rate tiers for each position. You can add multiple named rates per position (e.g. Standard, Weekend, Night).
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => setShowUplift(true)} disabled={allRates.length === 0}>
            <TrendingUp className="w-4 h-4 mr-1" /> Bulk Uplift
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-muted-foreground text-sm">Loading...</div>
        ) : positionNames.length > 0 ? (
          <div className="space-y-2">
            {positionNames.map(pos => (
              <PositionPayRatesSection key={pos} position={pos} rates={ratesByPosition[pos] || []} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No positions found. Add positions via Settings → Lookup Lists first.
          </div>
        )}
      </CardContent>

      <BulkUpliftDialog
        positions={positionNames}
        rates={allRates}
        open={showUplift}
        onOpenChange={setShowUplift}
      />
    </Card>
  );
};

export default JobRolePayRateManager;
