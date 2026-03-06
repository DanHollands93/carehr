import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GripVertical, MapPin, User } from "lucide-react";
import { AllocationLocation } from "@/hooks/useAllocationLocations";
import { DailyAllocation } from "@/hooks/useDailyAllocations";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
}

interface Shift {
  employee_id: string;
  job_role_id?: string;
  position?: string;
  start_time: string;
  end_time: string;
}

interface AllocationAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  dateLabel: string;
  locations: AllocationLocation[];
  employees: Employee[];
  shiftsForDay: Shift[];
  existingAllocations: DailyAllocation[];
  jobRoles?: { id: string; title: string }[];
  onSave: (assignments: { employeeId: string; locationId: string }[]) => void;
}

const AllocationAssignmentDialog = ({
  isOpen,
  onClose,
  date,
  dateLabel,
  locations,
  employees,
  shiftsForDay,
  existingAllocations,
  jobRoles = [],
  onSave
}: AllocationAssignmentDialogProps) => {
  // State: locationId -> employeeId[]
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [draggedEmployee, setDraggedEmployee] = useState<string | null>(null);

  // Initialize from existing allocations
  useEffect(() => {
    if (!isOpen) return;
    const initial: Record<string, string[]> = {};
    locations.forEach(loc => { initial[loc.id] = []; });
    initial['unassigned'] = [];

    const assignedEmployees = new Set<string>();
    existingAllocations.forEach(alloc => {
      if (initial[alloc.allocation_location_id]) {
        initial[alloc.allocation_location_id].push(alloc.employee_id);
        assignedEmployees.add(alloc.employee_id);
      }
    });

    // Working employees not yet assigned
    const workingEmployeeIds = [...new Set(shiftsForDay.map(s => s.employee_id))];
    workingEmployeeIds.forEach(empId => {
      if (!assignedEmployees.has(empId)) {
        initial['unassigned'].push(empId);
      }
    });

    setAssignments(initial);
  }, [isOpen, existingAllocations, shiftsForDay, locations]);

  const getEmployeeName = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown';
  };

  const getEmployeeShiftInfo = (empId: string) => {
    const empShifts = shiftsForDay.filter(s => s.employee_id === empId);
    if (empShifts.length === 0) return null;
    const shift = empShifts[0];
    const role = jobRoles.find(r => r.id === shift.job_role_id);
    return {
      time: `${shift.start_time} - ${shift.end_time}`,
      role: role?.title || shift.position || ''
    };
  };

  const handleDragStart = (employeeId: string) => {
    setDraggedEmployee(employeeId);
  };

  const handleDrop = (targetLocationId: string) => {
    if (!draggedEmployee) return;

    setAssignments(prev => {
      const next = { ...prev };
      // Remove from current location
      for (const key of Object.keys(next)) {
        next[key] = next[key].filter(id => id !== draggedEmployee);
      }
      // Add to target
      if (!next[targetLocationId]) next[targetLocationId] = [];
      next[targetLocationId].push(draggedEmployee);
      return next;
    });
    setDraggedEmployee(null);
  };

  const handleSave = () => {
    const result: { employeeId: string; locationId: string }[] = [];
    for (const [locationId, empIds] of Object.entries(assignments)) {
      if (locationId === 'unassigned') continue;
      empIds.forEach(empId => {
        result.push({ employeeId: empId, locationId });
      });
    }
    onSave(result);
    onClose();
  };

  const renderEmployeeCard = (empId: string) => {
    const shiftInfo = getEmployeeShiftInfo(empId);
    return (
      <div
        key={empId}
        draggable
        onDragStart={() => handleDragStart(empId)}
        className="flex items-center gap-2 p-2 rounded-md border bg-card cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow"
      >
        <GripVertical className="w-3 h-3 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{getEmployeeName(empId)}</div>
          {shiftInfo && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{shiftInfo.time}</span>
              {shiftInfo.role && (
                <Badge variant="outline" className="text-[10px] px-1 py-0">
                  {shiftInfo.role}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const workingCount = [...new Set(shiftsForDay.map(s => s.employee_id))].length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Assign Allocations — {dateLabel}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {workingCount} staff working. Drag and drop to assign to locations.
          </p>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-4">
            {/* Unassigned pool */}
            <Card
              className="border-dashed"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop('unassigned')}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Unassigned</span>
                  <Badge variant="secondary" className="text-xs">
                    {assignments['unassigned']?.length || 0}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(assignments['unassigned'] || []).map(empId => renderEmployeeCard(empId))}
                  {(assignments['unassigned'] || []).length === 0 && (
                    <p className="text-xs text-muted-foreground col-span-2 py-2 text-center">
                      All staff assigned
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Location buckets */}
            {locations.map(location => (
              <Card
                key={location.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(location.id)}
                className="transition-colors"
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">{location.name}</span>
                    <Badge variant="default" className="text-xs">
                      {assignments[location.id]?.length || 0}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-h-[40px]">
                    {(assignments[location.id] || []).map(empId => renderEmployeeCard(empId))}
                    {(assignments[location.id] || []).length === 0 && (
                      <p className="text-xs text-muted-foreground col-span-2 py-2 text-center border-2 border-dashed border-border/40 rounded">
                        Drop staff here
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Allocations</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AllocationAssignmentDialog;
