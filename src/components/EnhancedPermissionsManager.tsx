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
import { useEnhancedPermissions } from "@/hooks/useEnhancedPermissions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { User, Users, Shield, Settings, Plus, Edit, Trash2, Lock, ArrowLeft } from "lucide-react";
import PermissionGroupManager from "./PermissionGroupManager";

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

const EnhancedPermissionsManager = () => {
  const { toast } = useToast();
  const {
    permissionGroups,
    userRoleAssignments,
    userPermissionOverrides,
    loading,
    createPermissionGroup,
    updatePermissionGroup,
    assignRoleToUser,
    removeRoleFromUser,
    addPermissionOverride,
    removePermissionOverride,
    assignPermissionToGroup,
    removePermissionFromGroup,
    refetch
  } = useEnhancedPermissions();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  
  // Dialog and view states
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [selectedGroupForConfig, setSelectedGroupForConfig] = useState<any>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  useEffect(() => {
    loadProfiles();
    loadPermissions();
    loadLocations();
  }, []);

  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .order('email');
    
    if (error) {
      console.error('Error loading profiles:', error);
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

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    
    try {
      const newGroup = await createPermissionGroup(newGroupName.trim(), newGroupDescription.trim());
      setNewGroupName('');
      setNewGroupDescription('');
      setShowCreateGroupDialog(false);
      
      // Automatically open the permission configuration for the new group
      setSelectedGroupForConfig(newGroup);
      
      toast({
        title: "Success",
        description: "Permission group created successfully. Now configure its permissions."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create permission group",
        variant: "destructive"
      });
    }
  };

  const handleAssignRole = async (userId: string, groupId: string, location?: string) => {
    try {
      await assignRoleToUser(userId, groupId, location);
      toast({
        title: "Success",
        description: "Role assigned successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign role",
        variant: "destructive"
      });
    }
  };

  const handleRemoveRole = async (assignmentId: string, groupName: string) => {
    // Prevent removal of default user group
    if (groupName === 'Default User') {
      toast({
        title: "Cannot Remove",
        description: "The Default User group cannot be removed from users",
        variant: "destructive"
      });
      return;
    }

    try {
      await removeRoleFromUser(assignmentId);
      toast({
        title: "Success",
        description: "Role removed successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove role",
        variant: "destructive"
      });
    }
  };

  // If we're configuring a specific group, show the configuration view
  if (selectedGroupForConfig) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedGroupForConfig(null)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Groups
              </Button>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Configure {selectedGroupForConfig.name}
                </CardTitle>
                <CardDescription>
                  Assign permissions to this group
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <PermissionGroupManager 
          permissionGroup={selectedGroupForConfig}
          onUpdate={() => {
            refetch();
            // Keep the group selected to continue configuration
          }}
        />
      </div>
    );
  }

  const selectedProfile = profiles.find(p => p.id === selectedUserId);
  const selectedGroup = permissionGroups.find(g => g.id === selectedGroupId);
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
            Enhanced Permission Management
          </CardTitle>
          <CardDescription>
            Manage permission groups, assign roles, and configure individual overrides
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="groups" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="groups">Permission Groups</TabsTrigger>
          <TabsTrigger value="assignments">Role Assignments</TabsTrigger>
          <TabsTrigger value="overrides">Individual Overrides</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Management</TabsTrigger>
        </TabsList>

        <TabsContent value="groups">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Permission Groups
                  </CardTitle>
                  <CardDescription>
                    Create and manage reusable permission groups
                  </CardDescription>
                </div>
                <Dialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Group
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Permission Group</DialogTitle>
                      <DialogDescription>
                        Create a new permission group to organize related permissions
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="group-name">Group Name</Label>
                        <Input
                          id="group-name"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          placeholder="e.g., Care Manager"
                        />
                      </div>
                      <div>
                        <Label htmlFor="group-description">Description</Label>
                        <Textarea
                          id="group-description"
                          value={newGroupDescription}
                          onChange={(e) => setNewGroupDescription(e.target.value)}
                          placeholder="Describe what this group is for..."
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowCreateGroupDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateGroup}>
                          Create & Configure
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {permissionGroups.map(group => (
                  <Card key={group.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{group.name}</h4>
                            {group.name === 'Default User' && (
                              <div className="flex items-center gap-1">
                                <Lock className="w-4 h-4 text-muted-foreground" />
                                <Badge variant="secondary" className="text-xs">
                                  System Default
                                </Badge>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{group.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {userRoleAssignments.filter(r => r.permission_group_id === group.id).length} users
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedGroupForConfig(group)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Configure
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Role Assignments
              </CardTitle>
              <CardDescription>
                Assign permission groups to users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="user-select">Select User</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user" />
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
                  <div className="space-y-4">
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

                    <div className="space-y-4">
                      <h4 className="font-medium">Current Role Assignments</h4>
                      {userRoleAssignments
                        .filter(assignment => assignment.user_id === selectedUserId)
                        .map(assignment => (
                          <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{assignment.permission_group.name}</p>
                                  {assignment.permission_group.name === 'Default User' && (
                                    <Lock className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {assignment.location || 'All locations'}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveRole(assignment.id, assignment.permission_group.name)}
                              disabled={assignment.permission_group.name === 'Default User'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Assign New Role</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="group-select">Permission Group</Label>
                          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a group" />
                            </SelectTrigger>
                            <SelectContent>
                              {permissionGroups
                                .filter(group => group.name !== 'Default User') // Don't allow manual assignment of default group
                                .map(group => (
                                <SelectItem key={group.id} value={group.id}>
                                  {group.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="location-select">Location (Optional)</Label>
                          <Select onValueChange={(value) => {
                            if (selectedGroupId) {
                              handleAssignRole(selectedUserId, selectedGroupId, value === 'all' ? undefined : value);
                            }
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="All locations" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All locations</SelectItem>
                              {locations.map(location => (
                                <SelectItem key={location} value={location}>
                                  {location}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overrides">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Individual Overrides
              </CardTitle>
              <CardDescription>
                Fine-tune permissions for specific users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Individual permission overrides will be implemented here.
                This allows granting additional permissions or denying specific permissions for individual users.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Bulk Management
              </CardTitle>
              <CardDescription>
                Apply roles to multiple users at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Bulk management tools will be implemented here.
                This allows assigning roles to multiple users simultaneously.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedPermissionsManager;
