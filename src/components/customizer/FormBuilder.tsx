import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Move, Type, Hash, Calendar, Check, List, FileText } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

interface FormField {
  id: string;
  type: 'text' | 'number' | 'email' | 'date' | 'textarea' | 'select' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface FormBuilderProps {
  onProcessChange: (process: any) => void;
  process: any;
}

const fieldTypes = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'email', label: 'Email', icon: Type },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'textarea', label: 'Textarea', icon: FileText },
  { value: 'select', label: 'Select', icon: List },
  { value: 'checkbox', label: 'Checkbox', icon: Check },
  { value: 'radio', label: 'Radio', icon: Check },
];

export const FormBuilder = ({ onProcessChange, process }: FormBuilderProps) => {
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formName, setFormName] = useState("");
  const [selectedField, setSelectedField] = useState<FormField | null>(null);

  const addField = (type: FormField['type']) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      label: `New ${type} field`,
      required: false,
      options: type === 'select' || type === 'radio' ? ['Option 1', 'Option 2'] : undefined
    };
    setFormFields([...formFields, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFormFields(fields => 
      fields.map(field => 
        field.id === id ? { ...field, ...updates } : field
      )
    );
  };

  const removeField = (id: string) => {
    setFormFields(fields => fields.filter(field => field.id !== id));
    setSelectedField(null);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(formFields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setFormFields(items);
  };

  const updateOptions = (fieldId: string, options: string[]) => {
    updateField(fieldId, { options });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Field Types Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Fields
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {fieldTypes.map((fieldType) => {
            const Icon = fieldType.icon;
            return (
              <Button
                key={fieldType.value}
                variant="outline"
                className="w-full justify-start"
                onClick={() => addField(fieldType.value as FormField['type'])}
              >
                <Icon className="h-4 w-4 mr-2" />
                {fieldType.label}
              </Button>
            );
          })}
        </CardContent>
      </Card>

      {/* Form Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Form Preview</CardTitle>
          <div className="space-y-2">
            <Label htmlFor="form-name">Form Name</Label>
            <Input
              id="form-name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Enter form name"
            />
          </div>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="form-fields">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {formFields.map((field, index) => (
                    <Draggable key={field.id} draggableId={field.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedField?.id === field.id ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                          onClick={() => setSelectedField(field)}
                        >
                          <div className="flex items-center justify-between">
                            <div {...provided.dragHandleProps} className="flex items-center gap-2">
                              <Move className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{field.label}</span>
                              {field.required && <span className="text-destructive">*</span>}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeField(field.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">
                            Type: {field.type}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </CardContent>
      </Card>

      {/* Field Properties */}
      <Card>
        <CardHeader>
          <CardTitle>Field Properties</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedField ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="field-label">Label</Label>
                <Input
                  id="field-label"
                  value={selectedField.label}
                  onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="field-placeholder">Placeholder</Label>
                <Input
                  id="field-placeholder"
                  value={selectedField.placeholder || ''}
                  onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="field-required"
                  checked={selectedField.required}
                  onCheckedChange={(checked) => updateField(selectedField.id, { required: checked })}
                />
                <Label htmlFor="field-required">Required</Label>
              </div>

              {(selectedField.type === 'select' || selectedField.type === 'radio') && (
                <div>
                  <Label>Options</Label>
                  <div className="space-y-2">
                    {selectedField.options?.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...(selectedField.options || [])];
                            newOptions[index] = e.target.value;
                            updateOptions(selectedField.id, newOptions);
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newOptions = selectedField.options?.filter((_, i) => i !== index) || [];
                            updateOptions(selectedField.id, newOptions);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newOptions = [...(selectedField.options || []), `Option ${(selectedField.options?.length || 0) + 1}`];
                        updateOptions(selectedField.id, newOptions);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Option
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Select a field to edit its properties</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};