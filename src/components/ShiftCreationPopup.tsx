
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { useEmployeeJobRoles } from "@/hooks/useEmployeeJobRoles";

interface ShiftTemplate {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  color: string;
  position: string;
  pay_value?: number;
}

interface Shift {
  id: string;
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  position: string;
  job_role_id: string;
}

interface ShiftCreationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateShift: (shiftData: {
    start_time: string;
    end_time: string;
    position: string;
    job_role_id: string;
    pay_rate: number;
  }) => void;
  onDeleteShift?: () => void;
  shiftTemplates: ShiftTemplate[];
  employeeName: string;
  employeeId?: string;
  date: string;
  existingShift?: Shift;
}

const ShiftCreationPopup = ({
  isOpen,
  onClose,
  onCreateShift,
  onDeleteShift,
  shiftTemplates,
  employeeName,
  employeeId,
  date,
  existingShift
}: ShiftCreationPopupProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [selectedJobRole, setSelectedJobRole] = useState<string>('');
  const [position, setPosition] = useState<string>('');

  // Get employee's job roles - only fetch if employeeId is provided
  const { data: employeeJobRoles, isLoading, error } = useEmployeeJobRoles(employeeId);

  console.log('ShiftCreationPopup - Employee ID:', employeeId);
  console.log('ShiftCreationPopup - Job Roles:', employeeJobRoles);
  console.log('ShiftCreationPopup - Loading:', isLoading);
  console.log('ShiftCreationPopup - Error:', error);

  useEffect(() => {
    if (existingShift) {
      setStartTime(existingShift.start_time);
      setEndTime(existingShift.end_time);
      setPosition(existingShift.position);
      setSelectedJobRole(existingShift.job_role_id);
      
      // Find matching template
      const matchingTemplate = shiftTemplates.find(t => 
        t.start_time === existingShift.start_time &&
        t.end_time === existingShift.end_time &&
        t.position === existingShift.position
      );
      if (matchingTemplate) {
        setSelectedTemplate(matchingTemplate.id);
      }
    } else {
      // Reset form for new shift
      setSelectedTemplate('');
      setStartTime('09:00');
      setEndTime('17:00');
      setSelectedJobRole('');
      setPosition('');
      
      // Auto-select job role if employee has only one
      if (employeeJobRoles && employeeJobRoles.length === 1) {
        const role = employeeJobRoles[0];
        setSelectedJobRole(role.job_role_id);
        setPosition(role.job_roles?.title || '');
      } else if (employeeJobRoles && employeeJobRoles.length > 1) {
        // Find primary role
        const primaryRole = employeeJobRoles.find(role => role.is_primary);
        if (primaryRole) {
          setSelectedJobRole(primaryRole.job_role_id);
          setPosition(primaryRole.job_roles?.title || '');
        }
      }
    }
  }, [existingShift, shiftTemplates, isOpen, employeeJobRoles]);

  const handleTemplateSelect = (templateId: string) => {
    const template = shiftTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setStartTime(template.start_time);
      setEndTime(template.end_time);
      // Don't override position if we have a selected job role
      if (!selectedJobRole) {
        setPosition(template.position);
      }
    }
  };

  const handleJobRoleSelect = (jobRoleId: string) => {
    setSelectedJobRole(jobRoleId);
    const selectedRole = employeeJobRoles?.find(role => role.job_role_id === jobRoleId);
    if (selectedRole?.job_roles?.title) {
      setPosition(selectedRole.job_roles.title);
    }
  };

  const handleSubmit = () => {
    if (!startTime || !endTime || !selectedJobRole) return;

    const selectedRole = employeeJobRoles?.find(role => role.job_role_id === selectedJobRole);
    if (!selectedRole) return;

    onCreateShift({
      start_time: startTime,
      end_time: endTime,
      position: position || selectedRole.job_roles?.title || 'Unknown',
      job_role_id: selectedJobRole,
      pay_rate: selectedRole.pay_rate || 0
    });
  };

  const handleClose = () => {
    setSelectedTemplate('');
    setStartTime('09:00');
    setEndTime('17:00');
    setSelectedJobRole('');
    setPosition('');
    onClose();
  };

  const selectedRole = employeeJobRoles?.find(role => role.job_role_id === selectedJobRole);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingShift ? 'Edit Shift' : 'Create Shift'} - {employeeName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Date: {date}
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Shift Template (Optional)</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template or create custom" />
              </SelectTrigger>
              <SelectContent>
                {shiftTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} ({template.start_time} - {template.end_time})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              Loading employee job roles...
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              Error loading job roles: {error.message}
            </div>
          )}

          {/* Job Role Selection */}
          {!isLoading && employeeJobRoles && employeeJobRoles.length > 0 && (
            <div className="space-y-2">
              <Label>Job Role *</Label>
              <Select value={selectedJobRole} onValueChange={handleJobRoleSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job role" />
                </SelectTrigger>
                <SelectContent>
                  {employeeJobRoles.map((role) => (
                    <SelectItem key={role.job_role_id} value={role.job_role_id}>
                      {role.job_roles?.title || 'Unknown'} - £{role.pay_rate.toFixed(2)}/hr
                      {role.is_primary && <span className="text-xs text-blue-600 ml-2">(Primary)</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRole && (
                <div className="text-sm text-gray-600">
                  Pay Rate: £{selectedRole.pay_rate.toFixed(2)}/hr ({selectedRole.currency || 'GBP'})
                  <br />
                  Department: {selectedRole.job_roles?.department || 'Unknown'}
                </div>
              )}
            </div>
          )}

          {/* No Job Roles Warning */}
          {!isLoading && (!employeeJobRoles || employeeJobRoles.length === 0) && employeeId && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              This employee has no active job roles assigned. Please assign a job role before creating shifts.
            </div>
          )}

          {/* No Employee ID Warning */}
          {!employeeId && (
            <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded">
              Employee ID not provided. Job role selection unavailable.
            </div>
          )}

          {/* Time Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Position Display */}
          <div className="space-y-2">
            <Label>Position</Label>
            <Input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Position will be set from job role"
              className={selectedRole ? "bg-gray-50" : ""}
            />
            {selectedRole && (
              <div className="text-xs text-gray-500">
                Position automatically set from selected job role
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <div>
              {existingShift && onDeleteShift && (
                <Button
                  variant="destructive"
                  onClick={onDeleteShift}
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!startTime || !endTime || !selectedJobRole || isLoading}
              >
                {existingShift ? 'Update' : 'Create'} Shift
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShiftCreationPopup;
