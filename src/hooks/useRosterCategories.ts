
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RosterCategory {
  id: string;
  name: string;
  description: string;
  department: string;
  is_active: boolean;
  created_at: string;
}

interface RosterStaffAssignment {
  id: string;
  roster_category_id: string;
  employee_id: string;
  is_active: boolean;
  created_at: string;
}

export const useRosterCategories = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ['roster-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roster_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as RosterCategory[];
    }
  });

  const { data: staffAssignments } = useQuery({
    queryKey: ['roster-staff-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roster_staff_assignments')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      return data as RosterStaffAssignment[];
    }
  });

  // Query to get all employees for the "All Staff" category fallback
  const { data: allEmployees } = useQuery({
    queryKey: ['all-employees-roster'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id')
        .order('first_name');
      
      if (error) throw error;
      return data?.map(emp => emp.id) || [];
    }
  });

  const createCategory = useMutation({
    mutationFn: async (categoryData: Omit<RosterCategory, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('roster_categories')
        .insert([categoryData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-categories'] });
      toast({ title: "Category created successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error creating category", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const assignStaff = useMutation({
    mutationFn: async ({ categoryId, employeeId }: { categoryId: string; employeeId: string }) => {
      const { error } = await supabase
        .from('roster_staff_assignments')
        .insert([{
          roster_category_id: categoryId,
          employee_id: employeeId,
          is_active: true
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-staff-assignments'] });
    },
    onError: (error) => {
      toast({ 
        title: "Error assigning staff", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const removeStaff = useMutation({
    mutationFn: async ({ categoryId, employeeId }: { categoryId: string; employeeId: string }) => {
      const { error } = await supabase
        .from('roster_staff_assignments')
        .delete()
        .match({
          roster_category_id: categoryId,
          employee_id: employeeId
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-staff-assignments'] });
    },
    onError: (error) => {
      toast({ 
        title: "Error removing staff", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const getAssignedEmployees = (categoryId: string) => {
    // Find the category to check if it's the "All Staff" category
    const category = categories?.find(cat => cat.id === categoryId);
    
    // If it's the "All Staff" category and no specific assignments exist, return all employees
    if (category?.name === 'All Staff') {
      const specificAssignments = staffAssignments?.filter(assignment => 
        assignment.roster_category_id === categoryId
      );
      
      // If no specific assignments for "All Staff", return all employees
      if (!specificAssignments || specificAssignments.length === 0) {
        return allEmployees || [];
      }
    }
    
    // For other categories or when specific assignments exist, return the assigned employees
    return staffAssignments?.filter(assignment => 
      assignment.roster_category_id === categoryId
    ).map(assignment => assignment.employee_id) || [];
  };

  return {
    categories,
    staffAssignments,
    allEmployees,
    createCategory,
    assignStaff,
    removeStaff,
    getAssignedEmployees
  };
};
