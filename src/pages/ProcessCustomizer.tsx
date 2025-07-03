import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormBuilder } from "@/components/customizer/FormBuilder";
import { WorkflowDesigner } from "@/components/customizer/WorkflowDesigner";
import { ReportBuilder } from "@/components/customizer/ReportBuilder";
import { ProcessPreview } from "@/components/customizer/ProcessPreview";
import { Button } from "@/components/ui/button";
import { Save, Eye, Code, Database, Workflow } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ProcessCustomizer = () => {
  const { toast } = useToast();
  const [activeProcess, setActiveProcess] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const handleSaveProcess = () => {
    toast({
      title: "Process Saved",
      description: "Your custom process has been saved successfully."
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Process Customizer</h1>
          <p className="text-muted-foreground mt-2">Build custom forms, workflows, and reports</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {previewMode ? "Edit" : "Preview"}
          </Button>
          <Button onClick={handleSaveProcess}>
            <Save className="w-4 h-4 mr-2" />
            Save Process
          </Button>
        </div>
      </div>

      {previewMode ? (
        <ProcessPreview process={activeProcess} />
      ) : (
        <Tabs defaultValue="forms" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="forms" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Form Builder
            </TabsTrigger>
            <TabsTrigger value="workflows" className="flex items-center gap-2">
              <Workflow className="h-4 w-4" />
              Workflow Designer
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Report Builder
            </TabsTrigger>
          </TabsList>

          <TabsContent value="forms" className="space-y-6">
            <FormBuilder 
              onProcessChange={setActiveProcess}
              process={activeProcess}
            />
          </TabsContent>

          <TabsContent value="workflows" className="space-y-6">
            <WorkflowDesigner 
              onProcessChange={setActiveProcess}
              process={activeProcess}
            />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <ReportBuilder 
              onProcessChange={setActiveProcess}
              process={activeProcess}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ProcessCustomizer;