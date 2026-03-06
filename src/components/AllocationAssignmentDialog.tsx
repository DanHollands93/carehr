import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GripVertical, MapPin, User, Printer, Users } from "lucide-react";
import { AllocationLocation } from "@/hooks/useAllocationLocations";
import { DailyAllocation } from "@/hooks/useDailyAllocations";
import { RosterSection } from "@/hooks/useRosterSections";

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
  sections?: RosterSection[];
  sectionRoleRules?: { id: string; section_id: string; job_role_id: string }[];
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
  sections = [],
  sectionRoleRules = [],
  onSave
}: AllocationAssignmentDialogProps) => {
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [draggedEmployee, setDraggedEmployee] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

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

  const getEmployeeSection = (empId: string): string | null => {
    if (sections.length === 0) return null;
    const empShifts = shiftsForDay.filter(s => s.employee_id === empId);
    for (const shift of empShifts) {
      if (!shift.job_role_id) continue;
      for (const section of sections) {
        const rules = sectionRoleRules.filter(r => r.section_id === section.id);
        if (rules.some(r => r.job_role_id === shift.job_role_id)) {
          return section.id;
        }
      }
    }
    return null;
  };

  const handleDragStart = (employeeId: string) => {
    setDraggedEmployee(employeeId);
  };

  const handleDrop = (targetLocationId: string) => {
    if (!draggedEmployee) return;
    setAssignments(prev => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = next[key].filter(id => id !== draggedEmployee);
      }
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

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Allocations — ${dateLabel}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h1 { font-size: 18px; margin-bottom: 4px; }
            h2 { font-size: 15px; margin: 16px 0 6px; padding: 4px 8px; background: #f0f0f0; border-radius: 4px; }
            h3 { font-size: 13px; margin: 8px 0 4px; color: #666; padding-left: 8px; border-left: 3px solid #ddd; }
            .emp { padding: 3px 8px 3px 16px; font-size: 12px; }
            .emp-role { color: #888; font-size: 11px; margin-left: 8px; }
            .empty { color: #aaa; font-style: italic; padding: 3px 8px 3px 16px; font-size: 12px; }
            .subtitle { font-size: 13px; color: #666; margin-bottom: 16px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>Allocations — ${dateLabel}</h1>
          <p class="subtitle">${workingCount} staff working</p>
          ${locations.map(loc => {
            const locEmps = assignments[loc.id] || [];
            const grouped = groupBySection(locEmps);
            return `
              <h2>📍 ${loc.name} (${locEmps.length})</h2>
              ${grouped.map(g => `
                <h3>${g.sectionName}</h3>
                ${g.employeeIds.length === 0 
                  ? '<div class="empty">No staff assigned</div>'
                  : g.employeeIds.map(id => {
                    const info = getEmployeeShiftInfo(id);
                    return `<div class="emp">${getEmployeeName(id)}${info?.role ? `<span class="emp-role">${info.role}</span>` : ''}</div>`;
                  }).join('')
                }
              `).join('')}
            `;
          }).join('')}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const groupBySection = (empIds: string[]) => {
    if (sections.length === 0) {
      return [{ sectionId: null, sectionName: 'Staff', employeeIds: empIds }];
    }

    const groups: { sectionId: string | null; sectionName: string; employeeIds: string[] }[] = [];
    const placed = new Set<string>();

    for (const section of sections) {
      const sectionEmpIds = empIds.filter(id => {
        const sec = getEmployeeSection(id);
        return sec === section.id;
      });
      groups.push({ sectionId: section.id, sectionName: section.name, employeeIds: sectionEmpIds });
      sectionEmpIds.forEach(id => placed.add(id));
    }

    const remaining = empIds.filter(id => !placed.has(id));
    if (remaining.length > 0) {
      groups.push({ sectionId: null, sectionName: 'Other Staff', employeeIds: remaining });
    }

    return groups;
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
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Assign Allocations — {dateLabel}
            </DialogTitle>
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1">
              <Printer className="w-4 h-4" />
              Print
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {workingCount} staff working. Drag and drop to assign to locations.
          </p>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-4" ref={printRef}>
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

            {/* Location buckets with sections */}
            {locations.map(location => {
              const locEmps = assignments[location.id] || [];
              const sectionGroups = groupBySection(locEmps);

              return (
                <Card
                  key={location.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(location.id)}
                  className="transition-colors"
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold">{location.name}</span>
                      <Badge variant="default" className="text-xs">
                        {locEmps.length}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {sectionGroups.map((group, idx) => (
                        <div key={group.sectionId || `other-${idx}`} className="pl-2 border-l-2 border-border/60">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Users className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              {group.sectionName}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              {group.employeeIds.length}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-h-[32px]">
                            {group.employeeIds.map(empId => renderEmployeeCard(empId))}
                            {group.employeeIds.length === 0 && (
                              <p className="text-xs text-muted-foreground col-span-2 py-1.5 text-center border border-dashed border-border/40 rounded">
                                —
                              </p>
                            )}
                          </div>
                        </div>
                      ))}

                      {sectionGroups.length === 0 && locEmps.length === 0 && (
                        <p className="text-xs text-muted-foreground py-2 text-center border-2 border-dashed border-border/40 rounded">
                          Drop staff here
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
