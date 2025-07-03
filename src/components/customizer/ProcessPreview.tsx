import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Eye, Play } from "lucide-react";

interface ProcessPreviewProps {
  process: any;
}

export const ProcessPreview = ({ process }: ProcessPreviewProps) => {
  if (!process) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No process selected for preview</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderFormField = (field: any) => {
    const commonProps = {
      id: field.id,
      placeholder: field.placeholder,
      required: field.required
    };

    switch (field.type) {
      case 'text':
      case 'email':
        return <Input {...commonProps} type={field.type} />;
      
      case 'number':
        return <Input {...commonProps} type="number" />;
      
      case 'date':
        return <Input {...commonProps} type="date" />;
      
      case 'textarea':
        return <Textarea {...commonProps} />;
      
      case 'select':
        return (
          <Select>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string, index: number) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox id={field.id} />
            <Label htmlFor={field.id}>{field.label}</Label>
          </div>
        );
      
      case 'radio':
        return (
          <RadioGroup>
            {field.options?.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}_${index}`} />
                <Label htmlFor={`${field.id}_${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      
      default:
        return <Input {...commonProps} />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Process Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Preview */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Form Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {process.formFields?.map((field: any) => (
                    <div key={field.id} className="space-y-2">
                      {field.type !== 'checkbox' && (
                        <Label htmlFor={field.id}>
                          {field.label}
                          {field.required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                      )}
                      {renderFormField(field)}
                    </div>
                  ))}
                  
                  {process.formFields?.length > 0 && (
                    <div className="pt-4">
                      <Button className="w-full">
                        <Play className="h-4 w-4 mr-2" />
                        Submit Form
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Workflow Preview */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Workflow Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  {process.workflows?.length > 0 ? (
                    <div className="space-y-4">
                      {process.workflows.map((workflow: any) => (
                        <div key={workflow.id} className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">{workflow.name}</h4>
                          <div className="text-sm text-muted-foreground mb-3">
                            Trigger: {workflow.trigger.name}
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Actions:</div>
                            {workflow.actions.map((action: any, index: number) => (
                              <div key={action.id} className="flex items-center gap-2 text-sm">
                                <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">
                                  {index + 1}
                                </span>
                                <span>{action.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No workflows configured</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Reports Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  {process.reports?.length > 0 ? (
                    <div className="space-y-3">
                      {process.reports.map((report: any) => (
                        <div key={report.id} className="border rounded-lg p-3">
                          <div className="font-medium">{report.name}</div>
                          <div className="text-sm text-muted-foreground">{report.description}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Chart Type: {report.chartType}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No reports configured</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};