
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';

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
  const impersonation = useImpersonation();
  const effectiveUserId = impersonation.effectiveUserId ?? user?.id ?? null;
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [locationPermissions, setLocationPermissions] = useState<UserLocationPermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (effectiveUserId) {
      loadUserPermissions();
      loadUserLocationPermissions();
    } else {
      setPermissions([]);
      setLocationPermissions([]);
      setLoading(false);
    }
  }, [effectiveUserId]);

  const loadUserPermissions = async () => {
    if (!effectiveUserId) return;

    console.log('Loading permissions for user:', effectiveUserId);

    // Use the SECURITY DEFINER RPC to compute effective permissions.
    // This bypasses RLS on permission_groups / permissions / permission_group_permissions,
    // which otherwise can silently hide a basic user's role-based permissions when
    // the nested !inner joins get filtered out.
    const { data, error } = await supabase.rpc('get_effective_user_permissions', {
      p_user_id: effectiveUserId,
    });

    if (error) {
      console.error('Error loading effective permissions:', error);
      setPermissions([]);
      setLoading(false);
      return;
    }

    const allPermissions: UserPermission[] = (data || []).map((row: any, idx: number) => ({
      id: `eff-${idx}-${row.permission_name}-${row.location ?? 'null'}`,
      user_id: effectiveUserId,
      permission_id: row.permission_name, // name used as stable id downstream
      location: row.location ?? null,
      permission: {
        id: row.permission_name,
        name: row.permission_name,
        description: '',
        category: row.permission_category,
      },
    }));

    console.log('Effective permission names:', allPermissions.map(p => p.permission.name));

    setPermissions(allPermissions);
    setLoading(false);
  };

  const loadUserLocationPermissions = async () => {
    if (!effectiveUserId) return;

    const { data, error } = await supabase
      .from('user_location_permissions')
      .select('*')
      .eq('user_id', effectiveUserId);

    if (error) {
      console.error('Error loading user location permissions:', error);
    } else {
      setLocationPermissions(data || []);
    }
  };

  const hasPermission = (permissionName: string, location?: string) => {
    console.log('Checking permission:', permissionName, 'for location:', location);
    console.log('Available permissions:', permissions.map(p => ({ name: p.permission.name, location: p.location })));
    
    const result = permissions.some(up => 
      up.permission.name === permissionName && 
      (up.location === null || up.location === location || !location)
    );
    
    console.log('Permission check result:', result);
    return result;
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
