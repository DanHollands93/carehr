import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface RosterSection {
  id: string;
  roster_template_id: string;
  name: string;
  sort_order: number;
  company_id: string | null;
  created_at: string;
}

export interface SectionRoleRule {
  id: string;
  section_id: string;
  job_role_id: string;
  company_id: string | null;
}

export const useRosterSections = (templateId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sections } = useQuery({
    queryKey: ['roster-sections', templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roster_template_sections')
        .select('*')
        .eq('roster_template_id', templateId!)
        .order('sort_order');
      if (error) throw error;
      return data as RosterSection[];
    },
    enabled: !!templateId
  });

  const { data: roleRules } = useQuery({
    queryKey: ['section-role-rules', templateId],
    queryFn: async () => {
      if (!sections || sections.length === 0) return [];
      const sectionIds = sections.map(s => s.id);
      const { data, error } = await supabase
        .from('roster_section_role_rules')
        .select('*')
        .in('section_id', sectionIds);
      if (error) throw error;
      return data as SectionRoleRule[];
    },
    enabled: !!sections && sections.length > 0
  });

  const createSection = useMutation({
    mutationFn: async ({ name, sortOrder }: { name: string; sortOrder: number }) => {
      const { data, error } = await supabase
        .from('roster_template_sections')
        .insert([{ roster_template_id: templateId, name, sort_order: sortOrder }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-sections', templateId] });
      toast({ title: "Section created" });
    },
    onError: (error) => {
      toast({ title: "Error creating section", description: error.message, variant: "destructive" });
    }
  });

  const updateSection = useMutation({
    mutationFn: async ({ id, name, sortOrder }: { id: string; name: string; sortOrder?: number }) => {
      const updateData: any = { name };
      if (sortOrder !== undefined) updateData.sort_order = sortOrder;
      const { error } = await supabase
        .from('roster_template_sections')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-sections', templateId] });
    }
  });

  const deleteSection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('roster_template_sections')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-sections', templateId] });
      toast({ title: "Section deleted" });
    },
    onError: (error) => {
      toast({ title: "Error deleting section", description: error.message, variant: "destructive" });
    }
  });

  const reorderSections = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) =>
        supabase.from('roster_template_sections').update({ sort_order: index }).eq('id', id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-sections', templateId] });
    }
  });

  const addRoleRule = useMutation({
    mutationFn: async ({ sectionId, jobRoleId }: { sectionId: string; jobRoleId: string }) => {
      const { error } = await supabase
        .from('roster_section_role_rules')
        .insert([{ section_id: sectionId, job_role_id: jobRoleId }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['section-role-rules', templateId] });
    }
  });

  const removeRoleRule = useMutation({
    mutationFn: async (ruleId: string) => {
      const { error } = await supabase
        .from('roster_section_role_rules')
        .delete()
        .eq('id', ruleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['section-role-rules', templateId] });
    }
  });

  // Get the section a staff member should be in based on their job roles
  const getSectionForEmployee = (employeeJobRoleIds: string[]): string | null => {
    if (!roleRules || !sections || sections.length === 0) return null;
    
    for (const section of sections) {
      const sectionRules = roleRules.filter(r => r.section_id === section.id);
      if (sectionRules.length === 0) continue;
      
      const hasMatchingRole = sectionRules.some(rule => 
        employeeJobRoleIds.includes(rule.job_role_id)
      );
      if (hasMatchingRole) return section.id;
    }
    return null;
  };

  // Get the section for a specific job role ID (shift-based assignment)
  const getSectionForJobRole = (jobRoleId: string | null): string | null => {
    if (!jobRoleId || !roleRules || !sections || sections.length === 0) return null;
    
    for (const section of sections) {
      const sectionRules = roleRules.filter(r => r.section_id === section.id);
      if (sectionRules.some(rule => rule.job_role_id === jobRoleId)) return section.id;
    }
    return null;
  };

  // Group employees into sections based on their shifts' job roles
  const groupEmployeesByShiftRoles = <T extends { employee_id: string; job_role_id?: string | null }>(
    employees: { id: string }[],
    shiftsData: T[]
  ): { sectionId: string | null; sectionName: string; employeeIds: string[] }[] => {
    if (!sections || sections.length === 0) return [];

    const groups: { sectionId: string | null; sectionName: string; employeeIds: string[] }[] = [];
    const assignedToSection = new Set<string>();

    for (const section of sections) {
      const sectionRuleJobRoleIds = (roleRules || [])
        .filter(r => r.section_id === section.id)
        .map(r => r.job_role_id);
      
      if (sectionRuleJobRoleIds.length === 0) {
        groups.push({ sectionId: section.id, sectionName: section.name, employeeIds: [] });
        continue;
      }

      // Find employees who have at least one shift with a job_role matching this section
      const matchingEmployeeIds = new Set<string>();
      for (const emp of employees) {
        const empShifts = shiftsData.filter(s => s.employee_id === emp.id);
        const hasMatchingShift = empShifts.some(s => 
          s.job_role_id && sectionRuleJobRoleIds.includes(s.job_role_id)
        );
        if (hasMatchingShift) {
          matchingEmployeeIds.add(emp.id);
          assignedToSection.add(emp.id);
        }
      }
      groups.push({ sectionId: section.id, sectionName: section.name, employeeIds: Array.from(matchingEmployeeIds) });
    }

    // Unsectioned employees
    const unsectioned = employees.filter(e => !assignedToSection.has(e.id)).map(e => e.id);
    if (unsectioned.length > 0) {
      groups.push({ sectionId: null, sectionName: 'Other Staff', employeeIds: unsectioned });
    }

    return groups;
  };

  const getRulesForSection = (sectionId: string) => {
    return roleRules?.filter(r => r.section_id === sectionId) || [];
  };

  return {
    sections: sections || [],
    roleRules: roleRules || [],
    createSection,
    updateSection,
    deleteSection,
    reorderSections,
    addRoleRule,
    removeRoleRule,
    getSectionForEmployee,
    getRulesForSection
  };
};
