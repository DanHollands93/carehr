
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield } from "lucide-react";

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
}

interface GroupPermission {
  id: string;
  permission_group_id: string;
  permission_id: string;
  permission: Permission;
}

interface PermissionGroupManagerProps {
  permissionGroup: PermissionGroup;
  onUpdate: () => void;
}

const PermissionGroupManager: React.FC<PermissionGroupManagerProps> = ({
  permissionGroup,
  onUpdate
}) => {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [groupPermissions, setGroupPermissions] = useState<GroupPermission[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPermissions();
    loadGroupPermissions();
  }, [permissionGroup.id]);

  const loadPermissions = async () => {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('category, name');
    
    if (error) {
      console.error('Error loading permissions:', error);
    } else {
      setPermissions(data || []);
    }
  };

  const loadGroupPermissions = async () => {
    const { data, error } = await supabase
      .from('permission_group_permissions')
      .select(`
        *,
        permissions!inner(*)
      `)
      .eq('permission_group_id', permissionGroup.id)
      .is('location', null);
    
    if (error) {
      console.error('Error loading group permissions:', error);
    } else {
      const transformedData = data?.map(item => ({
        ...item,
        permission: Array.isArray(item.permissions) ? item.permissions[0] : item.permissions
      })) || [];
      setGroupPermissions(transformedData);
    }
  };

  const hasPermission = (permissionId: string) => {
    return groupPermissions.some(gp => gp.permission_id === permissionId);
  };

  const togglePermission = async (permissionId: string) => {
    setLoading(true);
    
    if (hasPermission(permissionId)) {
      // Remove permission
      const permissionToRemove = groupPermissions.find(gp => gp.permission_id === permissionId);
      
      if (permissionToRemove) {
        const { error } = await supabase
          .from('permission_group_permissions')
          .delete()
          .eq('id', permissionToRemove.id);
        
        if (error) {
          toast({
            title: "Error",
            description: "Failed to remove permission",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Success",
            description: "Permission removed"
          });
        }
      }
    } else {
      // Add permission (without location - global)
      const { error } = await supabase
        .from('permission_group_permissions')
        .insert({
          permission_group_id: permissionGroup.id,
          permission_id: permissionId,
          location: null
        });
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to add permission",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Permission added"
        });
      }
    }
    
    loadGroupPermissions();
    onUpdate();
    setLoading(false);
  };

  const formatPermissionName = (name: string) => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatCategoryName = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Sort permissions with personal at the top, then time_management
  const permissionsByCategory = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Ensure personal and time_management categories come first
  const sortedCategories = Object.keys(permissionsByCategory).sort((a, b) => {
    if (a === 'personal') return -1;
    if (b === 'personal') return 1;
    if (a === 'time_management') return -1;
    if (b === 'time_management') return 1;
    return a.localeCompare(b);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          {permissionGroup.name} Permissions
        </CardTitle>
        <CardDescription>
          Configure permissions for this group. Location access will be determined when assigning roles to users.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sortedCategories.map((category) => (
            <div key={category} className="space-y-4">
              <h4 className="font-medium">{formatCategoryName(category)} Permissions</h4>
              {permissionsByCategory[category].map(permission => {
                const isActive = hasPermission(permission.id);
                
                return (
                  <div key={permission.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{formatPermissionName(permission.name)}</p>
                          <p className="text-sm text-muted-foreground">{permission.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                      <Switch
                        checked={isActive}
                        onCheckedChange={() => togglePermission(permission.id)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PermissionGroupManager;
