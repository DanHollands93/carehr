
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
    }
  }, [effectiveUserId]);

  const loadUserPermissions = async () => {
    if (!effectiveUserId) return;

    console.log('Loading permissions for user:', effectiveUserId);

    // Load permissions from role assignments (permission groups)
    const { data: roleData, error: roleError } = await supabase
      .from('user_role_assignments')
      .select(`
        id,
        user_id,
        permission_group_id,
        location,
        permission_groups!inner(
          id,
          name,
          permission_group_permissions(
            permission_id,
            location,
            permissions!inner(
              id,
              name,
              description,
              category
            )
          )
        )
      `)
      .eq('user_id', effectiveUserId)
      .eq('is_active', true);

    if (roleError) {
      console.error('Error loading role permissions:', roleError);
    }

    // Also load direct user permission overrides
    const { data: directData, error: directError } = await supabase
      .from('user_permissions')
      .select(`
        id,
        user_id,
        permission_id,
        location,
        override_type,
        permissions!inner(
          id,
          name,
          description,
          category
        )
      `)
      .eq('user_id', effectiveUserId);

    if (directError) {
      console.error('Error loading direct permissions:', directError);
    }

    // Transform role-based permissions
    const rolePermissions: UserPermission[] = [];
    if (roleData) {
      roleData.forEach((roleAssignment: any) => {
        const permissionGroup = roleAssignment.permission_groups;
        if (permissionGroup && permissionGroup.permission_group_permissions) {
          permissionGroup.permission_group_permissions.forEach((pgp: any) => {
            if (pgp.permissions) {
              rolePermissions.push({
                id: `role-${roleAssignment.id}-${pgp.permission_id}`,
                user_id: effectiveUserId,
                permission_id: pgp.permission_id,
                location: pgp.location || roleAssignment.location,
                permission: pgp.permissions
              });
            }
          });
        }
      });
    }

    // Transform direct permissions
    const directPermissions: UserPermission[] = (directData || [])
      .filter(item => item.override_type === 'grant') // Only include grants
      .map(item => ({
        id: item.id,
        user_id: item.user_id,
        permission_id: item.permission_id,
        location: item.location,
        permission: Array.isArray(item.permissions) ? item.permissions[0] : item.permissions
      }));

    // Combine all permissions
    const allPermissions = [...rolePermissions, ...directPermissions];
    
    console.log('Loaded role permissions:', rolePermissions);
    console.log('Loaded direct permissions:', directPermissions);
    console.log('All permissions:', allPermissions);
    console.log('Permission names:', allPermissions.map(p => p.permission.name));
    
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
