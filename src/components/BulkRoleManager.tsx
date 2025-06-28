
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Plus, Users, Briefcase } from "lucide-react";

interface Position {
  id: string;
  value: string;
}

interface PermissionGroup {
  id: string;
  name: string;
  description: string;
}

interface BulkRoleRule {
  id: string;
  position: string;
  permission_group_id: string;
  created_at: string;
  permission_groups: PermissionGroup;
}

const BulkRoleManager = () => {
  const { toast } = useToast();
  const [positions, setPositions] = useState<Position[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [bulkRules, setBulkRules] = useState<BulkRoleRule[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [selectedPermissionGroupId, setSelectedPermissionGroupId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPositions();
    loadPermissionGroups();
    loadBulkRules();
  }, []);

  const loadPositions = async () => {
    try {
      const { data, error } = await supabase
        .from('lookup_lists')
        .select('id, value')
        .eq('category', 'positions')
        .eq('is_active', true)
        .order('value');
      
      if (error) {
        console.error('Error loading positions:', error);
        toast({
          title: "Error",
          description: "Failed to load positions",
          variant: "destructive"
        });
      } else {
        console.log('Loaded positions:', data);
        setPositions(data || []);
      }
    } catch (error) {
      console.error('Exception loading positions:', error);
    }
  };

  const loadPermissionGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('permission_groups')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        console.error('Error loading permission groups:', error);
      } else {
        setPermissionGroups(data || []);
      }
    } catch (error) {
      console.error('Exception loading permission groups:', error);
    }
  };

  const loadBulkRules = async () => {
    try {
      // For now, we'll create a temporary table structure
      // Later we'll need to create a proper bulk_position_rules table
      setBulkRules([]);
    } catch (error) {
      console.error('Exception loading bulk rules:', error);
    }
  };

  const handleCreateRule = async () => {
    if (!selectedPosition || !selectedPermissionGroupId) {
      toast({
        title: "Error",
        description: "Please select both a position and permission group",
        variant: "destructive"
      });
      return;
    }

    // For now, show a placeholder message
    toast({
      title: "Feature Coming Soon",
      description: "Position-based bulk role assignment will be implemented once the database structure is updated",
      variant: "default"
    });
  };

  const handleDeleteRule = async (ruleId: string) => {
    // Placeholder for delete functionality
    toast({
      title: "Feature Coming Soon",
      description: "Delete functionality will be available once the database structure is updated",
      variant: "default"
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Create Bulk Position Rule
          </CardTitle>
          <CardDescription>
            Automatically assign permission groups to users based on their position. 
            Found {positions.length} positions and {permissionGroups.length} permission groups.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Position</label>
              <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select from ${positions.length} positions`} />
                </SelectTrigger>
                <SelectContent>
                  {positions.map(position => (
                    <SelectItem key={position.id} value={position.value}>
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        <span>{position.value}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Permission Group</label>
              <Select value={selectedPermissionGroupId} onValueChange={setSelectedPermissionGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select from ${permissionGroups.length} groups`} />
                </SelectTrigger>
                <SelectContent>
                  {permissionGroups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={handleCreateRule} 
            disabled={loading || !selectedPosition || !selectedPermissionGroupId}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Position Rule
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Position-Based Rules</CardTitle>
          <CardDescription>
            These rules automatically assign permission groups when users are assigned to positions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bulkRules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-2">No position-based rules configured yet.</p>
                <p className="text-sm">Database structure needs to be updated to support position-based bulk assignments.</p>
              </div>
            ) : (
              bulkRules.map(rule => (
                <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Briefcase className="w-4 h-4" />
                        <span className="font-medium">{rule.position}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">gets assigned</span>
                        <Badge variant="secondary">{rule.permission_groups.name}</Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkRoleManager;
