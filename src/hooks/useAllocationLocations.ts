import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AllocationLocation {
  id: string;
  roster_template_id: string;
  name: string;
  sort_order: number;
  company_id: string | null;
}

export const useAllocationLocations = (templateId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: locations } = useQuery({
    queryKey: ['allocation-locations', templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roster_allocation_locations')
        .select('*')
        .eq('roster_template_id', templateId!)
        .order('sort_order');
      if (error) throw error;
      return data as AllocationLocation[];
    },
    enabled: !!templateId
  });

  const addLocation = useMutation({
    mutationFn: async ({ name, sortOrder }: { name: string; sortOrder: number }) => {
      const { error } = await supabase
        .from('roster_allocation_locations')
        .insert([{ roster_template_id: templateId, name, sort_order: sortOrder }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocation-locations', templateId] });
      toast({ title: "Location added" });
    },
    onError: (error) => {
      toast({ title: "Error adding location", description: error.message, variant: "destructive" });
    }
  });

  const removeLocation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('roster_allocation_locations')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocation-locations', templateId] });
      toast({ title: "Location removed" });
    },
    onError: (error) => {
      toast({ title: "Error removing location", description: error.message, variant: "destructive" });
    }
  });

  const updateLocation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from('roster_allocation_locations')
        .update({ name })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocation-locations', templateId] });
    }
  });

  return {
    locations: locations || [],
    addLocation,
    removeLocation,
    updateLocation
  };
};
