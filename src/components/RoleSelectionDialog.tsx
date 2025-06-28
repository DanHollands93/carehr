
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface JobRole {
  id: string;
  title: string;
  department: string;
  pay_rate: number;
  currency: string;
}

interface RoleSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (roleId: string, payRate: number) => void;
  employeeName: string;
  jobRoles: JobRole[];
}

const RoleSelectionDialog = ({ 
  isOpen, 
  onClose, 
  onSelectRole, 
  employeeName, 
  jobRoles 
}: RoleSelectionDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Job Role for {employeeName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This employee has multiple job roles. Please select which role this shift should be assigned to:
          </p>
          <div className="space-y-2">
            {jobRoles.map((role) => (
              <Button
                key={role.id}
                variant="outline"
                className="w-full justify-between p-4 h-auto"
                onClick={() => onSelectRole(role.id, role.pay_rate)}
              >
                <div className="text-left">
                  <div className="font-medium">{role.title}</div>
                  <div className="text-sm text-gray-500">{role.department}</div>
                </div>
                <Badge variant="secondary">
                  £{role.pay_rate.toFixed(2)}/hr
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoleSelectionDialog;
