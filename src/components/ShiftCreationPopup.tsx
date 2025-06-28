import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { format, isValid } from "date-fns";

interface ShiftTemplate {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  color: string;
  position: string;
  pay_value: number;
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
    pay_value?: number;
    color?: string;
  }) => void;
  onDeleteShift?: () => void;
  shiftTemplates: ShiftTemplate[];
  employeeName: string;
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
  date,
  existingShift
}: ShiftCreationPopupProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [customShift, setCustomShift] = useState({
    start_time: "",
    end_time: "",
    position: "",
    pay_value: 0
  });
  const [useCustom, setUseCustom] = useState(false);

  useEffect(() => {
    if (existingShift) {
      // Pre-populate with existing shift data
      setCustomShift({
        start_time: existingShift.start_time,
        end_time: existingShift.end_time,
        position: existingShift.position,
        pay_value: 0
      });
      setUseCustom(true);
      setSelectedTemplate("");
    } else {
      // Reset for new shift
      setCustomShift({
        start_time: "",
        end_time: "",
        position: "",
        pay_value: 0
      });
      setUseCustom(false);
      setSelectedTemplate("");
    }
  }, [existingShift, isOpen]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = shiftTemplates.find(t => t.id === templateId);
    if (template) {
      setCustomShift({
        start_time: template.start_time,
        end_time: template.end_time,
        position: template.position,
        pay_value: template.pay_value
      });
    }
    setUseCustom(false);
  };

  const handleCustomToggle = () => {
    setUseCustom(!useCustom);
    if (!useCustom) {
      setSelectedTemplate("");
    }
  };

  const handleSubmit = () => {
    const template = selectedTemplate ? shiftTemplates.find(t => t.id === selectedTemplate) : null;
    
    onCreateShift({
      start_time: customShift.start_time,
      end_time: customShift.end_time,
      position: customShift.position,
      pay_value: customShift.pay_value,
      color: template?.color
    });
    
    onClose();
  };

  const handleDelete = () => {
    if (onDeleteShift) {
      onDeleteShift();
    }
  };

  const isFormValid = customShift.start_time && customShift.end_time && customShift.position;

  const formatDateDisplay = (dateString: string) => {
    // Check if it's a template day format (e.g., "Day 1")
    if (dateString.startsWith('Day ')) {
      return dateString;
    }
    
    // Try to parse as a regular date
    const parsedDate = new Date(dateString);
    if (isValid(parsedDate)) {
      return format(parsedDate, 'EEEE, MMMM dd, yyyy');
    }
    
    // Fallback to the original string
    return dateString;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {existingShift ? 'Edit Shift' : 'Create Shift'} for {employeeName}
          </DialogTitle>
          <p className="text-sm text-gray-500">
            {formatDateDisplay(date)}
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          {!existingShift && (
            <>
              <div className="space-y-2">
                <Label>Select from Template</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a shift template..." />
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

              <div className="flex items-center justify-center">
                <span className="text-sm text-gray-500">or</span>
              </div>

              <Button
                variant="outline"
                onClick={handleCustomToggle}
                className="w-full"
              >
                {useCustom ? 'Use Template Instead' : 'Create Custom Shift'}
              </Button>
            </>
          )}

          {(useCustom || existingShift) && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={customShift.start_time}
                    onChange={(e) => setCustomShift(prev => ({ ...prev, start_time: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={customShift.end_time}
                    onChange={(e) => setCustomShift(prev => ({ ...prev, end_time: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={customShift.position}
                  onChange={(e) => setCustomShift(prev => ({ ...prev, position: e.target.value }))}
                  placeholder="Enter position name..."
                />
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            {existingShift && onDeleteShift && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                size="sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Shift
              </Button>
            )}
            
            <div className="flex space-x-2 ml-auto">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!isFormValid}
              >
                {existingShift ? 'Update Shift' : 'Create Shift'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShiftCreationPopup;
