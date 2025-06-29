
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
  const [selectedJobRoleId, setSelectedJobRoleId] = useState<string>('');

  // Use the employee job roles hook instead of career history
  const { data: employeeJobRoles, isLoading, error } = useEmployeeJobRoles(employeeId);

  console.log('ShiftCreationPopup - Employee ID:', employeeId);
  console.log('ShiftCreationPopup - Employee Job Roles:', employeeJobRoles);
  console.log('ShiftCreationPopup - Loading:', isLoading);
  console.log('ShiftCreationPopup - Error:', error);

  useEffect(() => {
    if (existingShift) {
      setStartTime(existingShift.start_time);
      setEndTime(existingShift.end_time);
      setSelectedJobRoleId(existingShift.job_role_id);
      
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
      setSelectedJobRoleId('');
      
      // Auto-select job role if employee has only one active position
      if (employeeJobRoles && employeeJobRoles.length === 1) {
        setSelectedJobRoleId(employeeJobRoles[0].job_role_id);
      }
    }
  }, [existingShift, shiftTemplates, isOpen, employeeJobRoles]);

  const handleTemplateSelect = (templateId: string) => {
    const template = shiftTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setStartTime(template.start_time);
      setEndTime(template.end_time);
    }
  };

  const handleSubmit = () => {
    console.log('Submit clicked');
    console.log('Selected job role ID:', selectedJobRoleId);
    console.log('Employee job roles:', employeeJobRoles);
    
    if (!startTime || !endTime || !selectedJobRoleId) {
      console.log('Missing required fields:', { startTime, endTime, selectedJobRoleId });
      return;
    }

    // Find the selected employee job role
    const selectedJobRole = employeeJobRoles?.find(role => role.job_role_id === selectedJobRoleId);
    console.log('Selected job role:', selectedJobRole);
    
    if (!selectedJobRole) {
      console.log('No selected job role found for job_role_id:', selectedJobRoleId);
      return;
    }

    const shiftData = {
      start_time: startTime,
      end_time: endTime,
      position: selectedJobRole.job_roles.title,
      job_role_id: selectedJobRoleId,
      pay_rate: selectedJobRole.pay_rate || 0
    };
    
    console.log('Creating shift with data:', shiftData);
    onCreateShift(shiftData);
  };

  const handleClose = () => {
    setSelectedTemplate('');
    setStartTime('09:00');
    setEndTime('17:00');
    setSelectedJobRoleId('');
    onClose();
  };

  const selectedJobRole = employeeJobRoles?.find(role => role.job_role_id === selectedJobRoleId);

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

          {/* Employee Job Roles Selection */}
          {!isLoading && employeeJobRoles && employeeJobRoles.length > 0 && (
            <div className="space-y-2">
              <Label>Job Position * (From Employee Job Roles)</Label>
              <Select value={selectedJobRoleId} onValueChange={setSelectedJobRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job position" />
                </SelectTrigger>
                <SelectContent>
                  {employeeJobRoles.map((role) => (
                    <SelectItem key={role.id} value={role.job_role_id}>
                      {role.job_roles.title} - £{role.pay_rate.toFixed(2)}/hr
                      {role.is_primary && ' (Primary)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedJobRole && (
                <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                  <strong>Position:</strong> {selectedJobRole.job_roles.title}
                  <br />
                  <strong>Pay Rate:</strong> £{selectedJobRole.pay_rate.toFixed(2)}/hr ({selectedJobRole.currency || 'GBP'})
                  <br />
                  <strong>Department:</strong> {selectedJobRole.job_roles.department}
                  {selectedJobRole.is_primary && (
                    <>
                      <br />
                      <strong>Primary Role:</strong> Yes
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* No Job Roles Warning */}
          {!isLoading && (!employeeJobRoles || employeeJobRoles.length === 0) && employeeId && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              This employee has no active job role assignments. Please assign them to a job role in the Employee Job Roles section before creating shifts.
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
                disabled={!startTime || !endTime || !selectedJobRoleId || isLoading}
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
