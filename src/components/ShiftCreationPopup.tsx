
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ShiftTemplate {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  color: string;
  position: string;
  pay_value: number;
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
  shiftTemplates: ShiftTemplate[];
  employeeName: string;
  date: string;
}

const ShiftCreationPopup = ({
  isOpen,
  onClose,
  onCreateShift,
  shiftTemplates,
  employeeName,
  date
}: ShiftCreationPopupProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ShiftTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    start_time: "",
    end_time: "",
    color: "#3B82F6",
    position: "",
    unpaid_break: 0
  });

  // Calculate total hours from start and end time
  const calculateTotalHours = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 0;
    
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    
    // Handle overnight shifts
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    const diffMs = end.getTime() - start.getTime();
    return diffMs / (1000 * 60 * 60); // Convert to hours
  };

  const totalHours = calculateTotalHours(formData.start_time, formData.end_time);
  const payHours = Math.max(0, totalHours - formData.unpaid_break);

  const handleTemplateSelect = (template: ShiftTemplate) => {
    setSelectedTemplate(template);
  };

  const handleCreateFromTemplate = () => {
    if (selectedTemplate) {
      onCreateShift({
        start_time: selectedTemplate.start_time,
        end_time: selectedTemplate.end_time,
        position: selectedTemplate.position,
        pay_value: selectedTemplate.pay_value,
        color: selectedTemplate.color
      });
      onClose();
      setSelectedTemplate(null);
    }
  };

  const handleCreateCustom = () => {
    if (formData.start_time && formData.end_time && formData.position) {
      onCreateShift({
        start_time: formData.start_time,
        end_time: formData.end_time,
        position: formData.position,
        pay_value: payHours,
        color: formData.color
      });
      onClose();
      setFormData({
        name: "",
        start_time: "",
        end_time: "",
        color: "#3B82F6",
        position: "",
        unpaid_break: 0
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Group shift templates by position
  const groupedTemplates = shiftTemplates?.reduce((acc, template) => {
    if (!acc[template.position]) {
      acc[template.position] = [];
    }
    acc[template.position].push(template);
    return acc;
  }, {} as Record<string, ShiftTemplate[]>) || {};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Shift for {employeeName}</DialogTitle>
          <p className="text-sm text-gray-600">{formatDate(date)}</p>
        </DialogHeader>

        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates">Use Template</TabsTrigger>
            <TabsTrigger value="custom">Create Custom</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-6">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.entries(groupedTemplates).map(([position, templates]) => (
                <div key={position} className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-700 border-b pb-1">{position}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {templates.map((template) => (
                      <Card
                        key={template.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedTemplate?.id === template.id
                            ? 'ring-2 ring-blue-500 bg-blue-50'
                            : 'hover:ring-1 hover:ring-gray-300'
                        }`}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <CardContent className="p-4">
                          <div
                            className="w-full h-3 rounded mb-3"
                            style={{
                              backgroundColor: template.color
                            }}
                          />
                          <div className="space-y-1">
                            <div className="font-medium text-sm">{template.name}</div>
                            <div className="text-xs text-gray-600">
                              {template.start_time} - {template.end_time}
                            </div>
                            <div className="text-xs text-gray-600">
                              {template.pay_value} hours
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleCreateFromTemplate} disabled={!selectedTemplate}>
                Add Shift
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            <form className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Morning Shift"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  placeholder="e.g., Server, Cook, Manager"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="unpaid_break">Unpaid Break (hours)</Label>
                  <Input
                    id="unpaid_break"
                    type="number"
                    step="0.25"
                    value={formData.unpaid_break}
                    onChange={(e) => setFormData({ ...formData, unpaid_break: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 0.5"
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
              </div>

              {/* Calculated hours display */}
              <div className="bg-gray-50 p-3 rounded space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Total Shift Hours:</span> {totalHours.toFixed(2)} hrs
                </div>
                <div className="text-sm">
                  <span className="font-medium">Pay Hours:</span> {payHours.toFixed(2)} hrs
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleCreateCustom}
                  disabled={!formData.start_time || !formData.end_time || !formData.position}
                >
                  Create Template
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ShiftCreationPopup;
