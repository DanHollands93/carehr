
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, FileText, FormInput, List, Plus, Search, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Process types and sample data
type ProcessType = "form" | "list" | "dashboard";

interface Process {
  id: string;
  name: string;
  description: string;
  type: ProcessType;
  createdAt: string;
  menuSetId?: string;
}

const Processes = () => {
  const { toast } = useToast();
  const [processes, setProcesses] = useState<Process[]>([
    {
      id: "form-1",
      name: "Employee Information Form",
      description: "Collect and update employee personal details",
      type: "form",
      createdAt: "2025-05-01",
      menuSetId: "1"
    },
    {
      id: "list-1",
      name: "Leave Requests List",
      description: "Display and manage employee leave requests",
      type: "list",
      createdAt: "2025-05-01",
      menuSetId: "1"
    },
    {
      id: "list-2",
      name: "Department Directory",
      description: "List of all departments with details",
      type: "list",
      createdAt: "2025-05-02"
    },
    {
      id: "form-2",
      name: "Performance Review Form",
      description: "Annual employee performance review form",
      type: "form",
      createdAt: "2025-05-03",
      menuSetId: "2"
    },
    {
      id: "dashboard-1",
      name: "HR Analytics Dashboard",
      description: "Key HR metrics and insights",
      type: "dashboard",
      createdAt: "2025-05-03"
    },
  ]);

  const [isNewProcessDialogOpen, setIsNewProcessDialogOpen] = useState(false);
  const [newProcessName, setNewProcessName] = useState("");
  const [newProcessDescription, setNewProcessDescription] = useState("");
  const [newProcessType, setNewProcessType] = useState<ProcessType>("form");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Filter processes based on search term and active tab
  const filteredProcesses = processes.filter(process => {
    const matchesSearch = process.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        process.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || process.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleCreateProcess = () => {
    if (!newProcessName.trim()) {
      toast({
        title: "Error",
        description: "Process name is required",
        variant: "destructive"
      });
      return;
    }

    const newProcess: Process = {
      id: `${newProcessType}-${Date.now()}`,
      name: newProcessName,
      description: newProcessDescription,
      type: newProcessType,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setProcesses([...processes, newProcess]);
    setNewProcessName("");
    setNewProcessDescription("");
    setNewProcessType("form");
    setIsNewProcessDialogOpen(false);

    toast({
      title: "Success",
      description: "Process created successfully"
    });
  };

  const getProcessIcon = (type: ProcessType) => {
    switch (type) {
      case "form":
        return <FormInput className="h-4 w-4" />;
      case "list":
        return <List className="h-4 w-4" />;
      case "dashboard":
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getProcessTypeLabel = (type: ProcessType) => {
    switch (type) {
      case "form":
        return "Form";
      case "list":
        return "List";
      case "dashboard":
        return "Dashboard";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Processes</h2>
          <p className="text-muted-foreground mt-2">Create and manage forms, lists and other processes</p>
        </div>
        <Dialog open={isNewProcessDialogOpen} onOpenChange={setIsNewProcessDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Process
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Process</DialogTitle>
              <DialogDescription>
                Create a new process like a form or a list view
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="process-type">Process Type</Label>
                <Select
                  value={newProcessType}
                  onValueChange={(value) => setNewProcessType(value as ProcessType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="form">Form</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                    <SelectItem value="dashboard">Dashboard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="process-name">Name</Label>
                <Input
                  id="process-name"
                  value={newProcessName}
                  onChange={(e) => setNewProcessName(e.target.value)}
                  placeholder="e.g. Employee Information Form"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="process-description">Description</Label>
                <Input
                  id="process-description"
                  value={newProcessDescription}
                  onChange={(e) => setNewProcessDescription(e.target.value)}
                  placeholder="e.g. Collect employee personal information"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewProcessDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateProcess}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full md:w-auto"
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="form">Forms</TabsTrigger>
            <TabsTrigger value="list">Lists</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboards</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full md:w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search processes..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProcesses.map((process) => (
          <Card key={process.id} className="hr-card">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getProcessIcon(process.type)}
                  <CardTitle className="text-lg">{process.name}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit Process</DropdownMenuItem>
                    <DropdownMenuItem>Clone Process</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      Delete Process
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription className="line-clamp-2">{process.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between text-sm">
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getProcessIcon(process.type)}
                    {getProcessTypeLabel(process.type)}
                  </Badge>
                  <span className="text-muted-foreground">Created: {process.createdAt}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                  {process.menuSetId ? (
                    <Badge variant="secondary">In Menu</Badge>
                  ) : (
                    <Button size="sm">
                      Add to Menu
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card 
          className="hr-card border-dashed flex flex-col items-center justify-center h-[220px] cursor-pointer hover:border-accent hover:bg-accent/5"
          onClick={() => setIsNewProcessDialogOpen(true)}
        >
          <div className="flex flex-col items-center justify-center gap-2 h-full">
            <div className="rounded-full bg-muted p-3">
              <Plus className="h-6 w-6" />
            </div>
            <span className="font-medium">Create Process</span>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <FormInput className="h-3 w-3" /> Form
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <List className="h-3 w-3" /> List
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <FileText className="h-3 w-3" /> Dashboard
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Processes;
