import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Move, Type, Hash, Calendar, Check, List, FileText, Save, FolderOpen } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FormField {
  id: string;
  type: 'text' | 'number' | 'email' | 'date' | 'textarea' | 'select' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  lookupCategory?: string;
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
  const { toast } = useToast();
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [savedForms, setSavedForms] = useState<any[]>([]);
  const [showSavedForms, setShowSavedForms] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [lookupCategories, setLookupCategories] = useState<string[]>([]);

  // Debug component loading
  console.log('FormBuilder component rendered');
  console.log('Current form name:', formName);
  console.log('Current form fields count:', formFields.length);

  const addField = (type: FormField['type']) => {
    console.log('Adding field of type:', type);
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      label: `New ${type} field`,
      required: false,
      options: type === 'select' || type === 'radio' ? ['Option 1', 'Option 2'] : undefined
    };
    const updatedFields = [...formFields, newField];
    console.log('Updated fields:', updatedFields);
    setFormFields(updatedFields);
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

  const loadSavedForms = async () => {
    try {
      console.log('Loading saved forms...');
      
      const { data, error } = await supabase
        .from('custom_forms')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('Load forms result:', { data, error });
      
      if (error) throw error;
      setSavedForms(data || []);
      console.log('Saved forms loaded:', data?.length || 0);
    } catch (error) {
      console.error('Error loading saved forms:', error);
      toast({
        title: "Error",
        description: `Failed to load saved forms: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const loadLookupCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('lookup_lists')
        .select('category')
        .eq('is_active', true);
      
      if (error) throw error;
      
      const uniqueCategories = [...new Set(data?.map(item => item.category) || [])];
      setLookupCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading lookup categories:', error);
    }
  };

  const saveForm = async () => {
    console.log('Save form called');
    console.log('Form name:', formName);
    console.log('Form fields:', formFields);
    
    if (!formName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a form name before saving.",
        variant: "destructive"
      });
      return;
    }

    if (formFields.length === 0) {
      toast({
        title: "Error", 
        description: "Please add at least one field before saving.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Starting save operation...');
      
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Current user:', user);
      
      if (authError) {
        console.error('Auth error:', authError);
        throw new Error('Authentication error: ' + authError.message);
      }
      
      if (!user) {
        console.error('No authenticated user');
        throw new Error('You must be logged in to save forms');
      }

      const formData = {
        name: formName,
        description: formDescription,
        form_fields: formFields,
        created_by: user.id
      };
      
      let data, error;
      
      if (editingFormId) {
        // Update existing form
        console.log('Updating form data:', formData);
        const result = await supabase
          .from('custom_forms')
          .update(formData)
          .eq('id', editingFormId)
          .select();
        data = result.data;
        error = result.error;
        console.log('Update result:', { data, error });
      } else {
        // Create new form
        console.log('Inserting form data:', formData);
        const result = await supabase
          .from('custom_forms')
          .insert(formData)
          .select();
        data = result.data;
        error = result.error;
        console.log('Insert result:', { data, error });
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: editingFormId ? "Form updated successfully!" : "Form saved successfully!"
      });

      // Update parent component with current form data
      onProcessChange({
        name: formName,
        description: formDescription,
        fields: formFields,
        type: 'form',
        createdAt: new Date().toISOString()
      });

      // Reset form
      setFormName("");
      setFormDescription("");
      setFormFields([]);
      setSelectedField(null);
      setEditingFormId(null);
      
      // Reload saved forms
      loadSavedForms();
    } catch (error) {
      console.error('Error saving form:', error);
      toast({
        title: "Error",
        description: `Failed to save form: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const loadForm = (form: any) => {
    setFormName(form.name);
    setFormDescription(form.description || "");
    setFormFields(form.form_fields || []);
    setSelectedField(null);
    setShowSavedForms(false);
    setEditingFormId(form.id);
    
    toast({
      title: "Form Loaded",
      description: `Loaded form: ${form.name}`
    });
  };

  useEffect(() => {
    console.log('FormBuilder useEffect - checking auth and loading forms...');
    
    // Check authentication status
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      console.log('Current user:', user);
      console.log('Auth error:', error);
      if (!user) {
        console.warn('User not authenticated - forms cannot be saved');
      }
    });
    
    loadSavedForms();
    loadLookupCategories();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with Save and Load buttons */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button 
            onClick={(e) => {
              console.log('Save button clicked!', e);
              console.log('Form name length:', formName.trim().length);
              console.log('Form fields length:', formFields.length);
              console.log('Button disabled:', !formName.trim() || formFields.length === 0);
              try {
                saveForm();
              } catch (error) {
                console.error('Error calling saveForm:', error);
              }
            }} 
            disabled={!formName.trim() || formFields.length === 0}
            type="button"
          >
            <Save className="w-4 h-4 mr-2" />
            {editingFormId ? 'Update Form' : 'Save Form'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowSavedForms(!showSavedForms)}
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            {showSavedForms ? 'Hide' : 'Show'} Saved Forms ({savedForms.length})
          </Button>
        </div>
      </div>

      {/* Saved Forms Section */}
      {showSavedForms && (
        <Card>
          <CardHeader>
            <CardTitle>Saved Forms</CardTitle>
          </CardHeader>
          <CardContent>
            {savedForms.length === 0 ? (
              <p className="text-muted-foreground">No saved forms yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedForms.map((form) => (
                  <Card key={form.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => loadForm(form)}>
                    <CardContent className="p-4">
                      <h4 className="font-medium">{form.name}</h4>
                      {form.description && (
                        <p className="text-sm text-muted-foreground mt-1">{form.description}</p>
                      )}
                      <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                        <span>{form.form_fields?.length || 0} fields</span>
                        <span>{new Date(form.created_at).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
          <div className="space-y-4">
            <div>
              <Label htmlFor="form-name">Form Name</Label>
              <Input
                id="form-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter form name"
              />
            </div>
            <div>
              <Label htmlFor="form-description">Form Description</Label>
              <Textarea
                id="form-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Enter form description (optional)"
                rows={3}
              />
            </div>
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
                  onChange={(e) => {
                    updateField(selectedField.id, { label: e.target.value });
                    setSelectedField({ ...selectedField, label: e.target.value });
                  }}
                />
              </div>

              <div>
                <Label htmlFor="field-placeholder">Placeholder</Label>
                <Input
                  id="field-placeholder"
                  value={selectedField.placeholder || ''}
                  onChange={(e) => {
                    updateField(selectedField.id, { placeholder: e.target.value });
                    setSelectedField({ ...selectedField, placeholder: e.target.value });
                  }}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="field-required"
                  checked={selectedField.required}
                  onCheckedChange={(checked) => {
                    updateField(selectedField.id, { required: checked });
                    setSelectedField({ ...selectedField, required: checked });
                  }}
                />
                <Label htmlFor="field-required">Required</Label>
              </div>

              {(selectedField.type === 'select' || selectedField.type === 'radio') && (
                <div>
                  <Label>Options Source</Label>
                  <div className="space-y-4">
                    <Select
                      value={selectedField.lookupCategory || 'manual'}
                      onValueChange={(value) => {
                        const isLookup = value !== 'manual';
                        updateField(selectedField.id, { 
                          lookupCategory: isLookup ? value : undefined,
                          options: isLookup ? [] : selectedField.options || []
                        });
                        setSelectedField({ 
                          ...selectedField, 
                          lookupCategory: isLookup ? value : undefined,
                          options: isLookup ? [] : selectedField.options || []
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose options source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual Options</SelectItem>
                        {lookupCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            Lookup: {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {!selectedField.lookupCategory && (
                      <div>
                        <Label>Manual Options</Label>
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

                    {selectedField.lookupCategory && (
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm text-muted-foreground">
                          Options will be loaded from the <strong>{selectedField.lookupCategory}</strong> lookup list.
                        </p>
                      </div>
                    )}
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
    </div>
  );
};