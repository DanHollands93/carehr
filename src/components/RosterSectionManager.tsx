import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, GripVertical, Trash2, Edit, Tag, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRosterSections } from "@/hooks/useRosterSections";
import { useUserCompanyId } from "@/hooks/useUserCompanyId";

interface RosterSectionManagerProps {
  templateId: string;
}

const RosterSectionManager = ({ templateId }: RosterSectionManagerProps) => {
  const {
    sections,
    roleRules,
    createSection,
    updateSection,
    deleteSection,
    reorderSections,
    addRoleRule,
    removeRoleRule,
    getRulesForSection
  } = useRosterSections(templateId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [sectionName, setSectionName] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [addingRuleToSection, setAddingRuleToSection] = useState<string | null>(null);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);

  // Fetch job roles
  const { data: jobRoles } = useQuery({
    queryKey: ['job-roles-for-sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_roles')
        .select('id, title, department')
        .order('title');
      if (error) throw error;
      return data;
    }
  });

  const handleCreateSection = () => {
    if (!sectionName.trim()) return;
    createSection.mutate({
      name: sectionName.trim(),
      sortOrder: sections.length
    });
    setSectionName("");
    setIsCreateOpen(false);
  };

  const handleUpdateSection = (id: string) => {
    if (!sectionName.trim()) return;
    updateSection.mutate({ id, name: sectionName.trim() });
    setSectionName("");
    setEditingSection(null);
  };

  const handleAddRoleRule = (sectionId: string) => {
    if (!selectedRoleId) return;
    addRoleRule.mutate({ sectionId, jobRoleId: selectedRoleId });
    setSelectedRoleId("");
    setAddingRuleToSection(null);
  };

  const handleDragStart = (sectionId: string) => {
    setDraggedSectionId(sectionId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetSectionId: string) => {
    if (!draggedSectionId || draggedSectionId === targetSectionId) return;

    const currentOrder = sections.map(s => s.id);
    const dragIdx = currentOrder.indexOf(draggedSectionId);
    const dropIdx = currentOrder.indexOf(targetSectionId);

    const newOrder = [...currentOrder];
    newOrder.splice(dragIdx, 1);
    newOrder.splice(dropIdx, 0, draggedSectionId);

    reorderSections.mutate(newOrder);
    setDraggedSectionId(null);
  };

  // Get role IDs already assigned to any section in this template
  const assignedRoleIds = new Set(roleRules.map(r => r.job_role_id));

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">Roster Sections</CardTitle>
          <Button size="sm" onClick={() => { setSectionName(""); setIsCreateOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" />
            Add Section
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Create sections to group staff. Assign job roles so staff auto-sort into the right section.
        </p>
      </CardHeader>
      <CardContent>
        {sections.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No sections created. Staff will appear in a single list.
          </p>
        ) : (
          <div className="space-y-3">
            {sections.map((section) => {
              const sectionRules = getRulesForSection(section.id);

              return (
                <div
                  key={section.id}
                  draggable
                  onDragStart={() => handleDragStart(section.id)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(section.id)}
                  className="border rounded-lg p-3 bg-card hover:shadow-sm transition-shadow cursor-move"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{section.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          setSectionName(section.name);
                          setEditingSection(section.id);
                        }}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => deleteSection.mutate(section.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Role rules */}
                  <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                    <Tag className="w-3 h-3 text-muted-foreground" />
                    {sectionRules.length === 0 ? (
                      <span className="text-xs text-muted-foreground">No auto-assign rules</span>
                    ) : (
                      sectionRules.map((rule) => {
                        const role = jobRoles?.find(r => r.id === rule.job_role_id);
                        return (
                          <Badge key={rule.id} variant="secondary" className="text-xs gap-1">
                            {role?.title || 'Unknown'}
                            <button
                              onClick={() => removeRoleRule.mutate(rule.id)}
                              className="ml-0.5 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        );
                      })
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs px-2"
                      onClick={() => {
                        setSelectedRoleId("");
                        setAddingRuleToSection(section.id);
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Role
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Create Section Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Section</DialogTitle>
            <DialogDescription>Add a new section to group staff in the roster.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Section Name</Label>
              <Input
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                placeholder="e.g., Care Team Leaders"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateSection()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateSection} disabled={!sectionName.trim()}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Section Dialog */}
      <Dialog open={!!editingSection} onOpenChange={(open) => !open && setEditingSection(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Section Name</Label>
              <Input
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && editingSection && handleUpdateSection(editingSection)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingSection(null)}>Cancel</Button>
              <Button onClick={() => editingSection && handleUpdateSection(editingSection)} disabled={!sectionName.trim()}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Role Rule Dialog */}
      <Dialog open={!!addingRuleToSection} onOpenChange={(open) => !open && setAddingRuleToSection(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Auto-Assign Rule</DialogTitle>
            <DialogDescription>
              Staff with this job role will automatically appear in this section.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Job Role</Label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a job role..." />
                </SelectTrigger>
                <SelectContent>
                  {jobRoles
                    ?.filter(r => !assignedRoleIds.has(r.id))
                    .map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.title} {role.department ? `(${role.department})` : ''}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddingRuleToSection(null)}>Cancel</Button>
              <Button
                onClick={() => addingRuleToSection && handleAddRoleRule(addingRuleToSection)}
                disabled={!selectedRoleId}
              >
                Add Rule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default RosterSectionManager;
