
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface ConsolidatedPermission {
  permission_name: string;
  permission_category: string;
  locations: string[];
  sources: string[];
}

export const useConsolidatedPermissions = (userId?: string) => {
  const { user } = useAuth();
  const [consolidatedPermissions, setConsolidatedPermissions] = useState<ConsolidatedPermission[]>([]);
  const [loading, setLoading] = useState(true);

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (targetUserId) {
      loadConsolidatedPermissions();
    }
  }, [targetUserId]);

  const loadConsolidatedPermissions = async () => {
    if (!targetUserId) return;

    setLoading(true);
    try {
      // Get all effective permissions for the user
      const { data, error } = await supabase
        .rpc('get_effective_user_permissions', { p_user_id: targetUserId });
      
      if (error) {
        console.error('Error loading effective permissions:', error);
        return;
      }

      // Consolidate permissions by name, collecting all locations and sources
      const permissionMap = new Map<string, ConsolidatedPermission>();
      
      data?.forEach((perm: any) => {
        const key = perm.permission_name;
        
        if (permissionMap.has(key)) {
          const existing = permissionMap.get(key)!;
          
          // Add location if not already present
          if (perm.location && !existing.locations.includes(perm.location)) {
            existing.locations.push(perm.location);
          }
          
          // Add source if not already present
          if (!existing.sources.includes(perm.source)) {
            existing.sources.push(perm.source);
          }
        } else {
          permissionMap.set(key, {
            permission_name: perm.permission_name,
            permission_category: perm.permission_category,
            locations: perm.location ? [perm.location] : [],
            sources: [perm.source]
          });
        }
      });

      // Convert map to array and sort by category and name
      const consolidated = Array.from(permissionMap.values()).sort((a, b) => {
        if (a.permission_category !== b.permission_category) {
          return a.permission_category.localeCompare(b.permission_category);
        }
        return a.permission_name.localeCompare(b.permission_name);
      });

      setConsolidatedPermissions(consolidated);
    } catch (error) {
      console.error('Exception loading consolidated permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasConsolidatedPermission = (permissionName: string, location?: string) => {
    const permission = consolidatedPermissions.find(p => p.permission_name === permissionName);
    if (!permission) return false;
    
    // If no location specified, return true if permission exists at all
    if (!location) return true;
    
    // If permission has no location restrictions, it applies everywhere
    if (permission.locations.length === 0) return true;
    
    // Check if permission applies to the specific location
    return permission.locations.includes(location);
  };

  const getPermissionSources = (permissionName: string) => {
    const permission = consolidatedPermissions.find(p => p.permission_name === permissionName);
    return permission?.sources || [];
  };

  const getPermissionLocations = (permissionName: string) => {
    const permission = consolidatedPermissions.find(p => p.permission_name === permissionName);
    return permission?.locations || [];
  };

  return {
    consolidatedPermissions,
    loading,
    hasConsolidatedPermission,
    getPermissionSources,
    getPermissionLocations,
    refetch: loadConsolidatedPermissions
  };
};
