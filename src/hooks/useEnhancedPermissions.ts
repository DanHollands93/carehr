import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface PermissionGroup {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserRoleAssignment {
  id: string;
  user_id: string;
  permission_group_id: string;
  location: string | null;
  is_active: boolean;
  assigned_at: string;
  permission_group: PermissionGroup;
}

interface UserPermissionOverride {
  id: string;
  user_id: string;
  permission_id: string;
  location: string | null;
  override_type: 'grant' | 'deny';
  permission: Permission;
}

interface EffectivePermission {
  permission_name: string;
  permission_category: string;
  location: string | null;
  source: 'role' | 'override';
}

export const useEnhancedPermissions = () => {
  const { user } = useAuth();
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [userRoleAssignments, setUserRoleAssignments] = useState<UserRoleAssignment[]>([]);
  const [userPermissionOverrides, setUserPermissionOverrides] = useState<UserPermissionOverride[]>([]);
  const [effectivePermissions, setEffectivePermissions] = useState<EffectivePermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadPermissionGroups(),
      loadUserRoleAssignments(),
      loadUserPermissionOverrides(),
      loadEffectivePermissions()
    ]);
    setLoading(false);
  };

  const loadPermissionGroups = async () => {
    const { data, error } = await supabase
      .from('permission_groups')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      console.error('Error loading permission groups:', error);
    } else {
      setPermissionGroups(data || []);
    }
  };

  const loadUserRoleAssignments = async () => {
    // Load all user role assignments, not just for current user
    const { data, error } = await supabase
      .from('user_role_assignments')
      .select(`
        *,
        permission_groups!inner(*)
      `)
      .eq('is_active', true);
    
    if (error) {
      console.error('Error loading user role assignments:', error);
    } else {
      const transformedData = data?.map(item => ({
        ...item,
        permission_group: Array.isArray(item.permission_groups) ? item.permission_groups[0] : item.permission_groups
      })) || [];
      setUserRoleAssignments(transformedData);
    }
  };

  const loadUserPermissionOverrides = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_permissions')
      .select(`
        *,
        permissions!inner(*)
      `)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error loading user permission overrides:', error);
    } else {
      const transformedData = data?.map(item => ({
        ...item,
        permission: Array.isArray(item.permissions) ? item.permissions[0] : item.permissions
      })) || [];
      setUserPermissionOverrides(transformedData as any[]);
    }
  };

  const loadEffectivePermissions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .rpc('get_effective_user_permissions', { p_user_id: user.id });
    
    if (error) {
      console.error('Error loading effective permissions:', error);
    } else {
      setEffectivePermissions((data as any[]) || []);
    }
  };

  const hasEffectivePermission = async (permissionName: string, location?: string) => {
    if (!user) return false;

    const { data, error } = await supabase
      .rpc('user_has_effective_permission', {
        p_user_id: user.id,
        p_permission_name: permissionName,
        p_location: location || null
      });
    
    if (error) {
      console.error('Error checking effective permission:', error);
      return false;
    }
    
    return data || false;
  };

  const assignRoleToUser = async (userId: string, permissionGroupId: string, location?: string) => {
    const { error } = await supabase
      .from('user_role_assignments')
      .insert({
        user_id: userId,
        permission_group_id: permissionGroupId,
        location: location || null,
        assigned_by: user?.id
      });
    
    if (error) {
      throw error;
    }
    
    await loadAllData();
  };

  const removeRoleFromUser = async (assignmentId: string) => {
    const { error } = await supabase
      .from('user_role_assignments')
      .update({ is_active: false })
      .eq('id', assignmentId);
    
    if (error) {
      throw error;
    }
    
    await loadAllData();
  };

  const addPermissionOverride = async (userId: string, permissionId: string, overrideType: 'grant' | 'deny', location?: string) => {
    const { error } = await supabase
      .from('user_permissions')
      .insert({
        user_id: userId,
        permission_id: permissionId,
        override_type: overrideType,
        location: location || null
      });
    
    if (error) {
      throw error;
    }
    
    await loadAllData();
  };

  const removePermissionOverride = async (overrideId: string) => {
    const { error } = await supabase
      .from('user_permissions')
      .delete()
      .eq('id', overrideId);
    
    if (error) {
      throw error;
    }
    
    await loadAllData();
  };

  const createPermissionGroup = async (name: string, description: string) => {
    const { data, error } = await supabase
      .from('permission_groups')
      .insert({ name, description })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    await loadPermissionGroups();
    return data;
  };

  const updatePermissionGroup = async (id: string, updates: Partial<PermissionGroup>) => {
    const { error } = await supabase
      .from('permission_groups')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    await loadPermissionGroups();
  };

  const assignPermissionToGroup = async (permissionGroupId: string, permissionId: string, location?: string) => {
    const { error } = await supabase
      .from('permission_group_permissions')
      .insert({
        permission_group_id: permissionGroupId,
        permission_id: permissionId,
        location: location || null
      });
    
    if (error) {
      throw error;
    }
  };

  const removePermissionFromGroup = async (permissionGroupId: string, permissionId: string, location?: string) => {
    let query = supabase
      .from('permission_group_permissions')
      .delete()
      .eq('permission_group_id', permissionGroupId)
      .eq('permission_id', permissionId);
    
    if (location) {
      query = query.eq('location', location);
    } else {
      query = query.is('location', null);
    }
    
    const { error } = await query;
    
    if (error) {
      throw error;
    }
  };

  return {
    permissionGroups,
    userRoleAssignments,
    userPermissionOverrides,
    effectivePermissions,
    loading,
    hasEffectivePermission,
    assignRoleToUser,
    removeRoleFromUser,
    addPermissionOverride,
    removePermissionOverride,
    createPermissionGroup,
    updatePermissionGroup,
    assignPermissionToGroup,
    removePermissionFromGroup,
    refetch: loadAllData
  };
};
