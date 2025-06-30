
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, UserPlus, UserMinus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRosterCategories } from "@/hooks/useRosterCategories";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
}

interface StaffAssignmentManagerProps {
  categoryId: string;
  categoryName: string;
}

const StaffAssignmentManager = ({ categoryId, categoryName }: StaffAssignmentManagerProps) => {
  const { assignStaff, removeStaff, getAssignedEmployees, getExplicitlyAssignedEmployees } = useRosterCategories();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: allEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, department')
        .order('first_name');
      
      if (error) throw error;
      return data as Employee[];
    }
  });

  const assignedEmployeeIds = getAssignedEmployees(categoryId);
  const explicitlyAssignedEmployeeIds = getExplicitlyAssignedEmployees(categoryId);
  const assignedEmployees = allEmployees?.filter(emp => assignedEmployeeIds.includes(emp.id)) || [];
  const unassignedEmployees = allEmployees?.filter(emp => !assignedEmployeeIds.includes(emp.id)) || [];

  const filteredUnassignedEmployees = unassignedEmployees.filter(emp =>
    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssignEmployee = (employeeId: string) => {
    assignStaff.mutate({ categoryId, employeeId });
  };

  const handleRemoveEmployee = (employeeId: string) => {
    // For "All Staff" category, only allow removal if explicitly assigned
    if (categoryName === 'All Staff' && !explicitlyAssignedEmployeeIds.includes(employeeId)) {
      // Can't remove from "All Staff" if not explicitly assigned
      return;
    }
    removeStaff.mutate({ categoryId, employeeId });
  };

  const isAllStaffCategory = categoryName === 'All Staff';
  const hasExplicitAssignments = explicitlyAssignedEmployeeIds.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Staff for {categoryName}
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Staff to {categoryName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredUnassignedEmployees.map((employee) => (
                    <div key={employee.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                      <Checkbox
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleAssignEmployee(employee.id);
                          }
                        }}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{employee.first_name} {employee.last_name}</div>
                        <div className="text-sm text-gray-500">{employee.department}</div>
                      </div>
                    </div>
                  ))}
                  {filteredUnassignedEmployees.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      {searchTerm ? 'No employees found matching search' : 'All employees are already assigned'}
                    </p>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isAllStaffCategory && !hasExplicitAssignments && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>All Staff</strong> category includes all employees by default. You can add specific staff assignments if needed.
            </p>
          </div>
        )}
        
        {assignedEmployees.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No staff assigned to this category
          </p>
        ) : (
          <div className="space-y-2">
            {assignedEmployees.map((employee) => {
              const isExplicitlyAssigned = explicitlyAssignedEmployeeIds.includes(employee.id);
              const canRemove = !isAllStaffCategory || isExplicitlyAssigned;
              
              return (
                <div key={employee.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="font-medium">{employee.first_name} {employee.last_name}</div>
                    <div className="text-sm text-gray-500">
                      {employee.department}
                      {isAllStaffCategory && !isExplicitlyAssigned && (
                        <span className="ml-2 text-xs text-blue-600">(Default)</span>
                      )}
                    </div>
                  </div>
                  {canRemove && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveEmployee(employee.id)}
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-4 pt-4 border-t">
          <Badge variant="secondary">
            {assignedEmployees.length} staff member{assignedEmployees.length !== 1 ? 's' : ''}
            {isAllStaffCategory && !hasExplicitAssignments && " (All employees)"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default StaffAssignmentManager;
