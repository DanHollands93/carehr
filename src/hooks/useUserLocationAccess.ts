import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useUserLocationAccess = () => {
  const { user, userRole } = useAuth();

  const { data: locationPermissions = [], isLoading } = useQuery({
    queryKey: ['user-location-access', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_location_permissions')
        .select('location')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data.map(d => d.location);
    },
    enabled: !!user?.id,
  });

  // Admins and super_admins bypass location filtering
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const hasLocationRestrictions = !isAdmin && locationPermissions.length > 0;
  // If a non-admin has NO location permissions assigned, they see everything (backwards compatible)
  const shouldFilterByLocation = hasLocationRestrictions;

  const hasAccessToLocation = (location: string | null | undefined): boolean => {
    if (isAdmin) return true;
    if (!location) return true; // No location = visible to all
    if (locationPermissions.length === 0) return true; // No restrictions assigned
    return locationPermissions.includes(location);
  };

  const filterByLocation = <T extends { location?: string | null }>(items: T[]): T[] => {
    if (!shouldFilterByLocation) return items;
    return items.filter(item => hasAccessToLocation(item.location));
  };

  return {
    locationPermissions,
    isAdmin,
    shouldFilterByLocation,
    hasAccessToLocation,
    filterByLocation,
    isLoading,
  };
};
