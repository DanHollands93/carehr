
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, MapPin } from "lucide-react";

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
  location: string | null;
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
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPermissions();
    loadLocations();
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

  const loadLocations = async () => {
    const { data, error } = await supabase
      .from('lookup_lists')
      .select('value')
      .eq('category', 'locations')
      .eq('is_active', true)
      .order('value');
    
    if (error) {
      console.error('Error loading locations:', error);
    } else {
      setLocations(data?.map(item => item.value) || []);
    }
  };

  const loadGroupPermissions = async () => {
    const { data, error } = await supabase
      .from('permission_group_permissions')
      .select(`
        *,
        permissions!inner(*)
      `)
      .eq('permission_group_id', permissionGroup.id);
    
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

  const hasPermission = (permissionId: string, location: string | null = null) => {
    return groupPermissions.some(
      gp => gp.permission_id === permissionId && gp.location === location
    );
  };

  const togglePermission = async (permissionId: string, location: string | null = null) => {
    setLoading(true);
    
    const existing = groupPermissions.find(
      gp => gp.permission_id === permissionId && gp.location === location
    );
    
    if (existing) {
      // Remove permission
      const { error } = await supabase
        .from('permission_group_permissions')
        .delete()
        .eq('id', existing.id);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to remove permission",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Permission removed from group"
        });
        loadGroupPermissions();
        onUpdate();
      }
    } else {
      // Add permission
      const { error } = await supabase
        .from('permission_group_permissions')
        .insert({
          permission_group_id: permissionGroup.id,
          permission_id: permissionId,
          location: location
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
          description: "Permission added to group"
        });
        loadGroupPermissions();
        onUpdate();
      }
    }
    
    setLoading(false);
  };

  const permissionsByCategory = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          {permissionGroup.name} Permissions
        </CardTitle>
        <CardDescription>
          Configure permissions for this group
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
            <div key={category} className="space-y-4">
              <h4 className="font-medium capitalize">{category} Permissions</h4>
              {categoryPermissions.map(permission => (
                <div key={permission.id} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{permission.name}</p>
                      <p className="text-sm text-muted-foreground">{permission.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Global</span>
                      <Switch
                        checked={hasPermission(permission.id, null)}
                        onCheckedChange={() => togglePermission(permission.id, null)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  {locations.length > 0 && (
                    <div className="ml-4 space-y-2">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Location-specific access:
                      </p>
                      <div className="grid gap-2">
                        {locations.map(location => (
                          <div key={`${permission.id}-${location}`} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="text-sm">{location}</span>
                            <Switch
                              checked={hasPermission(permission.id, location)}
                              onCheckedChange={() => togglePermission(permission.id, location)}
                              disabled={loading}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PermissionGroupManager;
