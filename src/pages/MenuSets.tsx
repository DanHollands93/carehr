
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Link as LinkIcon } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

// Sample data structure
interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  processId?: string;
  children?: MenuItem[];
}

interface MenuSet {
  id: string;
  name: string;
  description: string;
  items: MenuItem[];
}

const MenuSets = () => {
  const { toast } = useToast();
  const [menuSets, setMenuSets] = useState<MenuSet[]>([
    {
      id: "1",
      name: "Employee Self Service",
      description: "Menu for employee self-service portal",
      items: [
        { id: "1-1", label: "Personal Info", processId: "form-1" },
        { id: "1-2", label: "Leave Requests", processId: "list-1" },
        { id: "1-3", label: "Payslips", processId: "list-2" }
      ]
    },
    {
      id: "2",
      name: "HR Admin Portal",
      description: "Administrative functions for HR team",
      items: [
        { id: "2-1", label: "Employee Directory", processId: "list-3" },
        { id: "2-2", label: "Onboarding", processId: "form-2" },
        { 
          id: "2-3", 
          label: "Reports", 
          children: [
            { id: "2-3-1", label: "Attendance", processId: "list-4" },
            { id: "2-3-2", label: "Performance", processId: "list-5" }
          ]
        }
      ]
    }
  ]);
  
  const [isNewMenuDialogOpen, setIsNewMenuDialogOpen] = useState(false);
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuDescription, setNewMenuDescription] = useState("");
  const [editingMenuSet, setEditingMenuSet] = useState<MenuSet | null>(null);
  
  const handleCreateMenuSet = () => {
    if (!newMenuName.trim()) {
      toast({
        title: "Error",
        description: "Menu set name is required",
        variant: "destructive"
      });
      return;
    }
    
    const newMenuSet: MenuSet = {
      id: `menu-${Date.now()}`,
      name: newMenuName,
      description: newMenuDescription,
      items: []
    };
    
    setMenuSets([...menuSets, newMenuSet]);
    setNewMenuName("");
    setNewMenuDescription("");
    setIsNewMenuDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Menu set created successfully"
    });
  };
  
  const deleteMenuSet = (id: string) => {
    setMenuSets(menuSets.filter(menu => menu.id !== id));
    toast({
      title: "Success",
      description: "Menu set deleted successfully"
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Menu Sets</h2>
          <p className="text-muted-foreground mt-2">Create and manage navigation menus</p>
        </div>
        <Dialog open={isNewMenuDialogOpen} onOpenChange={setIsNewMenuDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Menu Set
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Menu Set</DialogTitle>
              <DialogDescription>
                Create a new menu set for your HR system. You can add menu items after creation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  value={newMenuName} 
                  onChange={(e) => setNewMenuName(e.target.value)} 
                  placeholder="e.g. Employee Dashboard"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  value={newMenuDescription} 
                  onChange={(e) => setNewMenuDescription(e.target.value)} 
                  placeholder="e.g. Main navigation for employees"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewMenuDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateMenuSet}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {menuSets.map((menuSet) => (
          <Card key={menuSet.id} className="hr-card">
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span>{menuSet.name}</span>
                <div className="flex space-x-1">
                  <Button size="icon" variant="ghost">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-destructive"
                    onClick={() => deleteMenuSet(menuSet.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>{menuSet.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Menu Items ({menuSet.items.length})</p>
                <ScrollArea className="h-[120px] rounded-md border p-2">
                  <ul className="space-y-1">
                    {menuSet.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted">
                        <span>{item.label}</span>
                        {item.processId && <LinkIcon className="h-3 w-3 text-muted-foreground" />}
                      </li>
                    ))}
                    {menuSet.items.length === 0 && (
                      <li className="text-sm text-muted-foreground py-2 px-2">No menu items added yet</li>
                    )}
                  </ul>
                </ScrollArea>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" size="sm">Edit Items</Button>
                <Button size="sm">Assign to Users</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        <Card className="hr-card border-dashed flex flex-col items-center justify-center h-[240px] cursor-pointer hover:border-accent hover:bg-accent/5">
          <DialogTrigger asChild>
            <Button variant="ghost" className="h-full w-full flex flex-col items-center justify-center gap-2" onClick={() => setIsNewMenuDialogOpen(true)}>
              <div className="rounded-full bg-muted p-3">
                <Plus className="h-6 w-6" />
              </div>
              <span className="font-medium">Add New Menu Set</span>
              <p className="text-xs text-muted-foreground">Create a new navigation menu</p>
            </Button>
          </DialogTrigger>
        </Card>
      </div>
    </div>
  );
};

export default MenuSets;
