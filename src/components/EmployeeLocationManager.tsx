import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Plus, X, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserCompanyId } from "@/hooks/useUserCompanyId";
import { toast } from "sonner";

interface EmployeeLocationManagerProps {
  employeeId: string;
  editable?: boolean;
}

const EmployeeLocationManager = ({ employeeId, editable = true }: EmployeeLocationManagerProps) => {
  const { companyId } = useUserCompanyId();
  const queryClient = useQueryClient();
  const [selectedLocation, setSelectedLocation] = useState("");

  const { data: employeeLocations = [], isLoading } = useQuery({
    queryKey: ['employee-locations', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_locations')
        .select('*')
        .eq('employee_id', employeeId)
        .order('is_primary', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!employeeId,
  });

  const { data: availableLocations = [] } = useQuery({
    queryKey: ['lookup-locations', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lookup_lists')
        .select('value')
        .eq('category', 'locations')
        .eq('is_active', true)
        .eq('company_id', companyId!)
        .order('value');
      if (error) throw error;
      return data.map(d => d.value);
    },
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: async (location: string) => {
      const { error } = await supabase.from('employee_locations').insert({
        employee_id: employeeId,
        location,
        is_primary: employeeLocations.length === 0,
        company_id: companyId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-locations', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employee-locations-map'] });
      setSelectedLocation("");
      toast.success("Location added");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employee_locations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-locations', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employee-locations-map'] });
      toast.success("Location removed");
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (id: string) => {
      // Clear all primary flags first
      await supabase.from('employee_locations').update({ is_primary: false }).eq('employee_id', employeeId);
      // Set the new primary
      const { error } = await supabase.from('employee_locations').update({ is_primary: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-locations', employeeId] });
    },
  });

  const unassignedLocations = availableLocations.filter(
    loc => !employeeLocations.some(el => el.location === loc)
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <MapPin className="w-4 h-4 text-muted-foreground" />
        Locations
      </div>

      <div className="flex flex-wrap gap-2">
        {employeeLocations.map(el => (
          <Badge key={el.id} variant={el.is_primary ? "default" : "secondary"} className="gap-1 pr-1">
            {el.is_primary && <Star className="w-3 h-3" />}
            {el.location}
            {editable && (
              <div className="flex items-center gap-0.5 ml-1">
                {!el.is_primary && (
                  <button
                    onClick={() => setPrimaryMutation.mutate(el.id)}
                    className="hover:text-foreground p-0.5 rounded"
                    title="Set as primary"
                  >
                    <Star className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => removeMutation.mutate(el.id)}
                  className="hover:text-destructive p-0.5 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </Badge>
        ))}
        {employeeLocations.length === 0 && !isLoading && (
          <span className="text-sm text-muted-foreground">No locations assigned</span>
        )}
      </div>

      {editable && unassignedLocations.length > 0 && (
        <div className="flex gap-2 items-center">
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-48 h-8 text-sm">
              <SelectValue placeholder="Add location..." />
            </SelectTrigger>
            <SelectContent>
              {unassignedLocations.map(loc => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            disabled={!selectedLocation || addMutation.isPending}
            onClick={() => selectedLocation && addMutation.mutate(selectedLocation)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmployeeLocationManager;
