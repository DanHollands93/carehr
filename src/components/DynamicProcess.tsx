
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { processService, Process } from "@/services/processService";
import { FileText, FormInput, List, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DynamicProcessProps {
  processId: string;
}

const DynamicProcess = ({ processId }: DynamicProcessProps) => {
  const [process, setProcess] = useState<Process | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    const loadProcess = async () => {
      try {
        const processData = await processService.getProcessById(processId);
        setProcess(processData);
      } catch (error) {
        console.error("Error loading process:", error);
        toast({
          title: "Error",
          description: "Failed to load process",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadProcess();
  }, [processId, toast]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Success",
      description: "Form submitted successfully",
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getProcessIcon = (type: string) => {
    switch (type) {
      case "form":
        return <FormInput className="h-5 w-5" />;
      case "list":
        return <List className="h-5 w-5" />;
      case "dashboard":
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!process) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Process not found</p>
        </CardContent>
      </Card>
    );
  }

  const renderFormProcess = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {getProcessIcon(process.type)}
          <CardTitle>{process.name}</CardTitle>
          <Badge variant="outline">{process.type}</Badge>
        </div>
        <CardDescription>{process.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {process.name.toLowerCase().includes("personal") && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName || ""}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName || ""}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
            </>
          )}
          
          {process.name.toLowerCase().includes("leave") && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate || ""}
                    onChange={(e) => handleInputChange("startDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate || ""}
                    onChange={(e) => handleInputChange("endDate", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  value={formData.reason || ""}
                  onChange={(e) => handleInputChange("reason", e.target.value)}
                  placeholder="Enter reason for leave"
                />
              </div>
            </>
          )}
          
          <Button type="submit" className="w-full">
            Submit {process.name}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderListProcess = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {getProcessIcon(process.type)}
          <CardTitle>{process.name}</CardTitle>
          <Badge variant="outline">{process.type}</Badge>
        </div>
        <CardDescription>{process.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {process.name.toLowerCase().includes("leave") ? (
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-4 p-3 bg-muted rounded-lg font-medium">
                <span>Start Date</span>
                <span>End Date</span>
                <span>Status</span>
                <span>Days</span>
              </div>
              <div className="grid grid-cols-4 gap-4 p-3 border rounded-lg">
                <span>2025-07-15</span>
                <span>2025-07-19</span>
                <Badge variant="secondary">Pending</Badge>
                <span>5 days</span>
              </div>
              <div className="grid grid-cols-4 gap-4 p-3 border rounded-lg">
                <span>2025-06-01</span>
                <span>2025-06-03</span>
                <Badge className="bg-green-100 text-green-800">Approved</Badge>
                <span>3 days</span>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>No data available for this list view</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderDashboardProcess = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {getProcessIcon(process.type)}
          <CardTitle>{process.name}</CardTitle>
          <Badge variant="outline">{process.type}</Badge>
        </div>
        <CardDescription>{process.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">15</div>
            <div className="text-sm text-muted-foreground">Days Remaining</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-600">8</div>
            <div className="text-sm text-muted-foreground">Days Used</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-orange-600">2</div>
            <div className="text-sm text-muted-foreground">Pending Requests</div>
          </Card>
        </div>
      </CardContent>
    </Card>
  );

  switch (process.type) {
    case "form":
      return renderFormProcess();
    case "list":
      return renderListProcess();
    case "dashboard":
      return renderDashboardProcess();
    default:
      return renderFormProcess();
  }
};

export default DynamicProcess;
