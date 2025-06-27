import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, MapPin, Shield, Users } from "lucide-react";

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

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

const PermissionsManager = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [userLocationPermissions, setUserLocationPermissions] = useState<UserLocationPermission[]>([]);
  const [loading, setLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    loadProfiles();
    loadPermissions();
    loadLocations();
  }, []);

  // Load user permissions when user is selected
  useEffect(() => {
    if (selectedUserId) {
      loadUserPermissions();
      loadUserLocationPermissions();
    }
  }, [selectedUserId]);

  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .order('email');
    
    if (error) {
      console.error('Error loading profiles:', error);
      toast({
        title: "Error",
        description: "Failed to load user profiles",
        variant: "destructive"
      });
    } else {
      setProfiles(data || []);
    }
  };

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

  const loadUserPermissions = async () => {
    if (!selectedUserId) return;
    
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
      .eq('user_id', selectedUserId);
    
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
      setUserPermissions(transformedData);
    }
  };

  const loadUserLocationPermissions = async () => {
    if (!selectedUserId) return;
    
    const { data, error } = await supabase
      .from('user_location_permissions')
      .select('*')
      .eq('user_id', selectedUserId);
    
    if (error) {
      console.error('Error loading user location permissions:', error);
    } else {
      setUserLocationPermissions(data || []);
    }
  };

  const togglePermission = async (permissionId: string, location: string | null = null) => {
    if (!selectedUserId) return;
    
    setLoading(true);
    
    // Check if permission already exists
    const existingPermission = userPermissions.find(
      up => up.permission_id === permissionId && up.location === location
    );
    
    if (existingPermission) {
      // Remove permission
      const { error } = await supabase
        .from('user_permissions')
        .delete()
        .eq('id', existingPermission.id);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to remove permission",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Permission removed successfully"
        });
        loadUserPermissions();
      }
    } else {
      // Add permission
      const { error } = await supabase
        .from('user_permissions')
        .insert({
          user_id: selectedUserId,
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
          description: "Permission added successfully"
        });
        loadUserPermissions();
      }
    }
    
    setLoading(false);
  };

  const toggleLocationAccess = async (location: string) => {
    if (!selectedUserId) return;
    
    setLoading(true);
    
    const existingAccess = userLocationPermissions.find(ulp => ulp.location === location);
    
    if (existingAccess) {
      // Remove location access
      const { error } = await supabase
        .from('user_location_permissions')
        .delete()
        .eq('id', existingAccess.id);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to remove location access",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Location access removed successfully"
        });
        loadUserLocationPermissions();
      }
    } else {
      // Add location access
      const { error } = await supabase
        .from('user_location_permissions')
        .insert({
          user_id: selectedUserId,
          location: location
        });
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to add location access",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Location access added successfully"
        });
        loadUserLocationPermissions();
      }
    }
    
    setLoading(false);
  };

  const hasPermission = (permissionId: string, location: string | null = null) => {
    return userPermissions.some(
      up => up.permission_id === permissionId && up.location === location
    );
  };

  const hasLocationAccess = (location: string) => {
    return userLocationPermissions.some(ulp => ulp.location === location);
  };

  const selectedProfile = profiles.find(p => p.id === selectedUserId);
  const permissionsByCategory = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Custom Permissions Management
          </CardTitle>
          <CardDescription>
            Assign location and permission access to users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-select">Select User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user to manage permissions" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{profile.email}</span>
                        {profile.first_name && profile.last_name && (
                          <span className="text-muted-foreground">
                            ({profile.first_name} {profile.last_name})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProfile && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  <div>
                    <p className="font-medium">{selectedProfile.email}</p>
                    {selectedProfile.first_name && selectedProfile.last_name && (
                      <p className="text-sm text-muted-foreground">
                        {selectedProfile.first_name} {selectedProfile.last_name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedUserId && (
        <Tabs defaultValue="locations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="locations">Location Access</TabsTrigger>
            <TabsTrigger value="permissions">Job Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="locations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Location Access
                </CardTitle>
                <CardDescription>
                  Control which locations this user can access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {locations.length === 0 ? (
                    <p className="text-muted-foreground">
                      No locations available. Add locations in the Lookup Lists section first.
                    </p>
                  ) : (
                    <div className="grid gap-4">
                      {locations.map(location => (
                        <div key={location} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span className="font-medium">{location}</span>
                          </div>
                          <Switch
                            checked={hasLocationAccess(location)}
                            onCheckedChange={() => toggleLocationAccess(location)}
                            disabled={loading}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions">
            <div className="space-y-6">
              {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 capitalize">
                      <Shield className="w-5 h-5" />
                      {category} Permissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {categoryPermissions.map(permission => (
                        <div key={permission.id} className="space-y-2">
                          <div className="flex items-center justify-between p-4 border rounded-lg">
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
                              <p className="text-sm font-medium text-muted-foreground">Location-specific access:</p>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default PermissionsManager;
