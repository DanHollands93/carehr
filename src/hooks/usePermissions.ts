import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface UserPermission {
  id: string;
  user_id: string;
  permission_id: string;
  location: string | null;
  permission: Permission;
}

interface UserLocationPermission {
  id: string;
  user_id: string;
  location: string;
}

export const usePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [locationPermissions, setLocationPermissions] = useState<UserLocationPermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserPermissions();
      loadUserLocationPermissions();
    }
  }, [user]);

  const loadUserPermissions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_permissions')
      .select(`
        id,
        user_id,
        permission_id,
        location,
        permissions!inner(
          id,
          name,
          description,
          category
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading user permissions:', error);
    } else {
      // Transform the data to match our interface
      const transformedData = data?.map(item => ({
        id: item.id,
        user_id: item.user_id,
        permission_id: item.permission_id,
        location: item.location,
        permission: item.permissions
      })) || [];
      setPermissions(transformedData);
    }
    setLoading(false);
  };

  const loadUserLocationPermissions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_location_permissions')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading user location permissions:', error);
    } else {
      setLocationPermissions(data || []);
    }
  };

  const hasPermission = (permissionName: string, location?: string) => {
    return permissions.some(up => 
      up.permission.name === permissionName && 
      (up.location === null || up.location === location || !location)
    );
  };

  const hasLocationAccess = (location: string) => {
    return locationPermissions.some(ulp => ulp.location === location);
  };

  const getUserLocations = () => {
    return locationPermissions.map(ulp => ulp.location);
  };

  const getPermissionsByCategory = (category: string) => {
    return permissions.filter(up => up.permission.category === category);
  };

  return {
    permissions,
    locationPermissions,
    loading,
    hasPermission,
    hasLocationAccess,
    getUserLocations,
    getPermissionsByCategory,
    refetch: () => {
      loadUserPermissions();
      loadUserLocationPermissions();
    }
  };
};
