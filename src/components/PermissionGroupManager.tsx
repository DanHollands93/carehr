
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, MapPin, Plus, X } from "lucide-react";

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
  const [userLocation, setUserLocation] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPermissions();
    loadLocations();
    loadGroupPermissions();
    loadUserLocation();
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

  const loadUserLocation = async () => {
    // For now, we'll use the first location as default user location
    // In a real app, this would come from the user's profile
    const { data, error } = await supabase
      .from('lookup_lists')
      .select('value')
      .eq('category', 'locations')
      .eq('is_active', true)
      .order('value')
      .limit(1);
    
    if (data && data.length > 0) {
      setUserLocation(data[0].value);
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

  const isPermissionActive = (permissionId: string) => {
    return groupPermissions.some(gp => gp.permission_id === permissionId);
  };

  const getPermissionLocations = (permissionId: string) => {
    return groupPermissions
      .filter(gp => gp.permission_id === permissionId)
      .map(gp => gp.location)
      .filter(location => location !== null);
  };

  const togglePermissionActive = async (permissionId: string) => {
    setLoading(true);
    
    if (isPermissionActive(permissionId)) {
      // Remove all permissions for this permission ID
      const permissionsToRemove = groupPermissions.filter(gp => gp.permission_id === permissionId);
      
      for (const perm of permissionsToRemove) {
        const { error } = await supabase
          .from('permission_group_permissions')
          .delete()
          .eq('id', perm.id);
        
        if (error) {
          toast({
            title: "Error",
            description: "Failed to remove permission",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
      }
      
      toast({
        title: "Success",
        description: "Permission deactivated"
      });
    } else {
      // Add permission for user's location
      const { error } = await supabase
        .from('permission_group_permissions')
        .insert({
          permission_group_id: permissionGroup.id,
          permission_id: permissionId,
          location: userLocation
        });
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to activate permission",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: `Permission activated for ${userLocation}`
        });
      }
    }
    
    loadGroupPermissions();
    onUpdate();
    setLoading(false);
  };

  const addLocationToPermission = async (permissionId: string, location: string) => {
    setLoading(true);
    
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
        description: "Failed to add location permission",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: `Permission added for ${location}`
      });
      loadGroupPermissions();
      onUpdate();
    }
    
    setLoading(false);
  };

  const removeLocationFromPermission = async (permissionId: string, location: string) => {
    setLoading(true);
    
    const permissionToRemove = groupPermissions.find(
      gp => gp.permission_id === permissionId && gp.location === location
    );
    
    if (permissionToRemove) {
      const { error } = await supabase
        .from('permission_group_permissions')
        .delete()
        .eq('id', permissionToRemove.id);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to remove location permission",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: `Permission removed from ${location}`
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

  const getAvailableLocations = (permissionId: string) => {
    const assignedLocations = getPermissionLocations(permissionId);
    return locations.filter(location => !assignedLocations.includes(location));
  };

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
              {categoryPermissions.map(permission => {
                const isActive = isPermissionActive(permission.id);
                const permissionLocations = getPermissionLocations(permission.id);
                const availableLocations = getAvailableLocations(permission.id);
                
                return (
                  <div key={permission.id} className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{permission.name}</p>
                        <p className="text-sm text-muted-foreground">{permission.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                        <Switch
                          checked={isActive}
                          onCheckedChange={() => togglePermissionActive(permission.id)}
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    {isActive ? (
                      <div className="ml-4 space-y-3">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Active locations:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {permissionLocations.map(location => (
                            <Badge key={location} variant="secondary" className="flex items-center gap-1">
                              {location}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => removeLocationFromPermission(permission.id, location)}
                                disabled={loading}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                        
                        {availableLocations.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Select onValueChange={(location) => addLocationToPermission(permission.id, location)}>
                              <SelectTrigger className="w-48">
                                <SelectValue placeholder="Add location..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableLocations.map(location => (
                                  <SelectItem key={location} value={location}>
                                    {location}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="ml-4">
                        <p className="text-sm text-muted-foreground">
                          Turning this on will allow users to {permission.name.toLowerCase()} at their location ({userLocation})
                        </p>
                      </div>
                    )}
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
