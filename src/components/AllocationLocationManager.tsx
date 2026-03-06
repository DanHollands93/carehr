import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, X, MapPin } from "lucide-react";
import { useAllocationLocations } from "@/hooks/useAllocationLocations";

interface AllocationLocationManagerProps {
  templateId: string;
  allowAllocations: boolean;
  onToggleAllocations: (enabled: boolean) => void;
}

const AllocationLocationManager = ({ templateId, allowAllocations, onToggleAllocations }: AllocationLocationManagerProps) => {
  const { locations, addLocation, removeLocation } = useAllocationLocations(templateId);
  const [newLocationName, setNewLocationName] = useState("");

  const handleAddLocation = () => {
    if (!newLocationName.trim()) return;
    addLocation.mutate({ name: newLocationName.trim(), sortOrder: locations.length });
    setNewLocationName("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Enable Allocations</Label>
          <p className="text-xs text-muted-foreground">
            Allow assigning staff to units, floors or wings each day
          </p>
        </div>
        <Switch
          checked={allowAllocations}
          onCheckedChange={onToggleAllocations}
        />
      </div>

      {allowAllocations && (
        <div className="space-y-3 pl-1 border-l-2 border-primary/20 ml-2">
          <div className="pl-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Allocation Locations
            </Label>
            
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="e.g. Floor 1, Wing A..."
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
                className="h-8 text-sm"
              />
              <Button size="sm" variant="outline" onClick={handleAddLocation} disabled={!newLocationName.trim()}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {locations.map(location => (
                <Badge key={location.id} variant="secondary" className="flex items-center gap-1 pr-1">
                  <MapPin className="w-3 h-3" />
                  {location.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1 hover:bg-destructive/20"
                    onClick={() => removeLocation.mutate(location.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
              {locations.length === 0 && (
                <p className="text-xs text-muted-foreground">No locations added yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllocationLocationManager;
