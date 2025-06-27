
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [customShift, setCustomShift] = useState({
    name: '',
    start_time: '',
    end_time: '',
    position: '',
    pay_value: 0,
    color: '#3B82F6',
    description: '',
    break_duration: 0,
    deduct_break: false
  });

  // Calculate hours between start and end time
  const calculateHours = (startTime: string, endTime: string, breakDuration: number = 0) => {
    if (!startTime || !endTime) return 0;
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;
    
    // Handle overnight shifts
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }
    
    const totalMinutes = endMinutes - startMinutes - breakDuration;
    return Math.max(0, totalMinutes / 60);
  };

  // Auto-calculate pay value when times change
  useEffect(() => {
    if (customShift.start_time && customShift.end_time) {
      const breakMinutes = customShift.deduct_break ? customShift.break_duration : 0;
      const hours = calculateHours(customShift.start_time, customShift.end_time, breakMinutes);
      setCustomShift(prev => ({
        ...prev,
        pay_value: parseFloat(hours.toFixed(2))
      }));
    }
  }, [customShift.start_time, customShift.end_time, customShift.break_duration, customShift.deduct_break]);

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
    if (customShift.start_time && customShift.end_time && customShift.position) {
      onCreateShift({
        start_time: customShift.start_time,
        end_time: customShift.end_time,
        position: customShift.position,
        pay_value: customShift.pay_value,
        color: customShift.color
      });
      onClose();
      setCustomShift({
        name: '',
        start_time: '',
        end_time: '',
        position: '',
        pay_value: 0,
        color: '#3B82F6',
        description: '',
        break_duration: 0,
        deduct_break: false
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto px-[20px]">
        <DialogHeader>
          <DialogTitle>Add Shift for {employeeName}</DialogTitle>
          <p className="text-sm text-gray-600">{formatDate(date)}</p>
        </DialogHeader>

        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates">Shift Templates</TabsTrigger>
            <TabsTrigger value="custom">Custom Shift</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.entries(groupedTemplates).map(([position, templates]) => (
                <div key={position} className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">{position}</h4>
                  <div className="grid grid-cols-2 gap-2 px-[5px]">
                    {templates.map((template) => (
                      <Card
                        key={template.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedTemplate?.id === template.id
                            ? 'ring-2 ring-blue-500'
                            : 'hover:ring-1 hover:ring-gray-300'
                        }`}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <CardContent className="p-3">
                          <div
                            className="w-full h-2 rounded mb-2"
                            style={{
                              backgroundColor: template.color
                            }}
                          />
                          <div className="font-medium text-sm">{template.name}</div>
                          <div className="text-xs text-gray-600">
                            {template.start_time} - {template.end_time}
                          </div>
                          <div className="text-xs text-gray-600">
                            {template.pay_value} hrs
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleCreateFromTemplate} disabled={!selectedTemplate}>
                Add Shift
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Shift Name</Label>
                <Input
                  id="name"
                  placeholder="Enter shift name"
                  value={customShift.name}
                  onChange={(e) => setCustomShift(prev => ({
                    ...prev,
                    name: e.target.value
                  }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={customShift.start_time}
                    onChange={(e) => setCustomShift(prev => ({
                      ...prev,
                      start_time: e.target.value
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={customShift.end_time}
                    onChange={(e) => setCustomShift(prev => ({
                      ...prev,
                      end_time: e.target.value
                    }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  placeholder="Enter position"
                  value={customShift.position}
                  onChange={(e) => setCustomShift(prev => ({
                    ...prev,
                    position: e.target.value
                  }))}
                />
              </div>

              {/* Break Section */}
              <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="deduct_break"
                    checked={customShift.deduct_break}
                    onCheckedChange={(checked) => setCustomShift(prev => ({
                      ...prev,
                      deduct_break: checked as boolean
                    }))}
                  />
                  <Label htmlFor="deduct_break" className="text-sm font-medium">
                    Deduct break time from pay
                  </Label>
                </div>
                
                {customShift.deduct_break && (
                  <div className="space-y-2">
                    <Label htmlFor="break_duration">Break Duration (minutes)</Label>
                    <Input
                      id="break_duration"
                      type="number"
                      min="0"
                      step="15"
                      placeholder="30"
                      value={customShift.break_duration}
                      onChange={(e) => setCustomShift(prev => ({
                        ...prev,
                        break_duration: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pay_value">Pay Value (hours)</Label>
                  <Input
                    id="pay_value"
                    type="number"
                    step="0.25"
                    min="0"
                    value={customShift.pay_value}
                    onChange={(e) => setCustomShift(prev => ({
                      ...prev,
                      pay_value: parseFloat(e.target.value) || 0
                    }))}
                    className="bg-gray-50"
                    title="This is automatically calculated based on start/end times and break deduction"
                  />
                  <p className="text-xs text-gray-500">
                    Auto-calculated from shift times
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="color"
                      type="color"
                      value={customShift.color}
                      onChange={(e) => setCustomShift(prev => ({
                        ...prev,
                        color: e.target.value
                      }))}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      type="text"
                      value={customShift.color}
                      onChange={(e) => setCustomShift(prev => ({
                        ...prev,
                        color: e.target.value
                      }))}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Enter shift description"
                  value={customShift.description}
                  onChange={(e) => setCustomShift(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateCustom}
                disabled={!customShift.start_time || !customShift.end_time || !customShift.position}
              >
                Create Custom Shift
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ShiftCreationPopup;
