
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GripVertical } from "lucide-react";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
}

interface StaffSortingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onSave: (order: string[]) => void;
}

const StaffSortingDialog = ({ 
  isOpen, 
  onClose, 
  employees, 
  onSave 
}: StaffSortingDialogProps) => {
  const [sortedEmployees, setSortedEmployees] = useState<Employee[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    setSortedEmployees([...employees]);
  }, [employees, isOpen]);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === index) return;

    const newEmployees = [...sortedEmployees];
    const draggedEmployee = newEmployees[draggedIndex];
    
    // Remove the dragged employee from its current position
    newEmployees.splice(draggedIndex, 1);
    
    // Insert the dragged employee at the new position
    newEmployees.splice(index, 0, draggedEmployee);
    
    setSortedEmployees(newEmployees);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = () => {
    const order = sortedEmployees.map(emp => emp.id);
    onSave(order);
    onClose();
  };

  const handleCancel = () => {
    setSortedEmployees([...employees]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Custom Staff Order</DialogTitle>
          <DialogDescription>
            Drag and drop staff members to set a custom order for the roster.
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-96 overflow-y-auto space-y-2">
          {sortedEmployees.map((employee, index) => (
            <Card
              key={employee.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className="cursor-move hover:shadow-md transition-shadow"
              style={{
                opacity: draggedIndex === index ? 0.5 : 1
              }}
            >
              <CardContent className="p-3 flex items-center space-x-3">
                <GripVertical className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <div className="font-medium">
                    {employee.first_name} {employee.last_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {employee.department}
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  #{index + 1}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Apply Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StaffSortingDialog;
