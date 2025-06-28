
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Plus, Users, Briefcase } from "lucide-react";

interface JobRole {
  id: string;
  title: string;
  department: string;
  location: string;
}

interface PermissionGroup {
  id: string;
  name: string;
  description: string;
}

interface BulkRoleRule {
  id: string;
  job_role_id: string;
  permission_group_id: string;
  created_at: string;
  job_roles: JobRole;
  permission_groups: PermissionGroup;
}

const BulkRoleManager = () => {
  const { toast } = useToast();
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [bulkRules, setBulkRules] = useState<BulkRoleRule[]>([]);
  const [selectedJobRoleId, setSelectedJobRoleId] = useState<string>('');
  const [selectedPermissionGroupId, setSelectedPermissionGroupId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadJobRoles();
    loadPermissionGroups();
    loadBulkRules();
  }, []);

  const loadJobRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('job_roles')
        .select('id, title, department, location')
        .order('title');
      
      if (error) {
        console.error('Error loading job roles:', error);
        toast({
          title: "Error",
          description: "Failed to load job roles",
          variant: "destructive"
        });
      } else {
        console.log('Loaded job roles:', data);
        setJobRoles(data || []);
      }
    } catch (error) {
      console.error('Exception loading job roles:', error);
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
      const { data, error } = await supabase
        .from('bulk_role_rules')
        .select(`
          *,
          job_roles!inner(id, title, department, location),
          permission_groups!inner(id, name, description)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading bulk rules:', error);
      } else {
        setBulkRules(data || []);
      }
    } catch (error) {
      console.error('Exception loading bulk rules:', error);
    }
  };

  const handleCreateRule = async () => {
    if (!selectedJobRoleId || !selectedPermissionGroupId) {
      toast({
        title: "Error",
        description: "Please select both a job role and permission group",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Check if rule already exists
      const existingRule = bulkRules.find(
        rule => rule.job_role_id === selectedJobRoleId && rule.permission_group_id === selectedPermissionGroupId
      );
      
      if (existingRule) {
        toast({
          title: "Error",
          description: "A rule already exists for this job role and permission group combination",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Create the bulk rule
      const { error: ruleError } = await supabase
        .from('bulk_role_rules')
        .insert({
          job_role_id: selectedJobRoleId,
          permission_group_id: selectedPermissionGroupId
        });

      if (ruleError) throw ruleError;

      // Apply the rule to existing users
      await applyRuleToExistingUsers(selectedJobRoleId, selectedPermissionGroupId);

      setSelectedJobRoleId('');
      setSelectedPermissionGroupId('');
      loadBulkRules();
      
      toast({
        title: "Success",
        description: "Bulk role rule created and applied to existing users"
      });
    } catch (error) {
      console.error('Error creating bulk rule:', error);
      toast({
        title: "Error",
        description: "Failed to create bulk role rule",
        variant: "destructive"
      });
    }
    
    setLoading(false);
  };

  const applyRuleToExistingUsers = async (jobRoleId: string, permissionGroupId: string) => {
    try {
      // Get all employees with this job role
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id')
        .eq('job_role_id', jobRoleId);

      if (employeesError) {
        console.error('Error getting employees:', employeesError);
        return;
      }

      if (!employees || employees.length === 0) {
        return;
      }

      // Get user IDs for these employees
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .in('employee_id', employees.map(e => e.id));

      if (profilesError) {
        console.error('Error getting profiles:', profilesError);
        return;
      }

      if (!profiles || profiles.length === 0) {
        return;
      }

      // Assign the permission group to these users
      const assignments = profiles.map(profile => ({
        user_id: profile.id,
        permission_group_id: permissionGroupId,
        assigned_by: null, // System assignment
        location: null // Apply to all locations for bulk rules
      }));

      const { error: assignmentError } = await supabase
        .from('user_role_assignments')
        .upsert(assignments, { 
          onConflict: 'user_id,permission_group_id,location',
          ignoreDuplicates: true 
        });

      if (assignmentError) {
        console.error('Error assigning roles:', assignmentError);
      }
    } catch (error) {
      console.error('Exception applying rule to existing users:', error);
    }
  };

  const handleDeleteRule = async (ruleId: string, jobRoleId: string, permissionGroupId: string) => {
    setLoading(true);
    
    try {
      // Delete the bulk rule
      const { error: deleteError } = await supabase
        .from('bulk_role_rules')
        .delete()
        .eq('id', ruleId);

      if (deleteError) throw deleteError;

      // Remove the permission group from users who got it through this bulk rule
      await removeRuleFromExistingUsers(jobRoleId, permissionGroupId);

      loadBulkRules();
      
      toast({
        title: "Success",
        description: "Bulk role rule deleted and removed from existing users"
      });
    } catch (error) {
      console.error('Error deleting bulk rule:', error);
      toast({
        title: "Error",
        description: "Failed to delete bulk role rule",
        variant: "destructive"
      });
    }
    
    setLoading(false);
  };

  const removeRuleFromExistingUsers = async (jobRoleId: string, permissionGroupId: string) => {
    try {
      // Get all employees with this job role
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id')
        .eq('job_role_id', jobRoleId);

      if (employeesError) {
        console.error('Error getting employees:', employeesError);
        return;
      }

      if (!employees || employees.length === 0) {
        return;
      }

      // Get user IDs for these employees
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .in('employee_id', employees.map(e => e.id));

      if (profilesError) {
        console.error('Error getting profiles:', profilesError);
        return;
      }

      if (!profiles || profiles.length === 0) {
        return;
      }

      // Remove the permission group assignments (only system-assigned ones)
      const { error: removeError } = await supabase
        .from('user_role_assignments')
        .delete()
        .eq('permission_group_id', permissionGroupId)
        .in('user_id', profiles.map(p => p.id))
        .is('assigned_by', null); // Only remove system assignments

      if (removeError) {
        console.error('Error removing role assignments:', removeError);
      }
    } catch (error) {
      console.error('Exception removing rule from existing users:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Create Bulk Role Rule
          </CardTitle>
          <CardDescription>
            Automatically assign permission groups to users based on their job role. 
            Found {jobRoles.length} job roles and {permissionGroups.length} permission groups.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Job Role</label>
              <Select value={selectedJobRoleId} onValueChange={setSelectedJobRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select from ${jobRoles.length} job roles`} />
                </SelectTrigger>
                <SelectContent>
                  {jobRoles.map(jobRole => (
                    <SelectItem key={jobRole.id} value={jobRole.id}>
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        <span>{jobRole.title}</span>
                        <span className="text-muted-foreground text-sm">
                          ({jobRole.department}, {jobRole.location})
                        </span>
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
            disabled={loading || !selectedJobRoleId || !selectedPermissionGroupId}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Rule
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Bulk Role Rules</CardTitle>
          <CardDescription>
            These rules automatically assign permission groups when users are assigned to job roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bulkRules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No bulk role rules configured yet. Create one above to get started.
              </div>
            ) : (
              bulkRules.map(rule => (
                <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Briefcase className="w-4 h-4" />
                        <span className="font-medium">{rule.job_roles.title}</span>
                        <span className="text-muted-foreground text-sm">
                          ({rule.job_roles.department}, {rule.job_roles.location})
                        </span>
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
                    onClick={() => handleDeleteRule(rule.id, rule.job_role_id, rule.permission_group_id)}
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
