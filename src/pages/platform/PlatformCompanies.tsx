
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Building2, Settings, Puzzle, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PlatformCompanies = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");

  const { data: companies, isLoading } = useQuery({
    queryKey: ["platform-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: companyModuleCounts } = useQuery({
    queryKey: ["platform-company-module-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_modules")
        .select("company_id, is_enabled");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((cm) => {
        if (cm.is_enabled) {
          counts[cm.company_id] = (counts[cm.company_id] || 0) + 1;
        }
      });
      return counts;
    },
  });

  const createCompany = useMutation({
    mutationFn: async () => {
      const slug = newSlug || newName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const { error } = await supabase.from("companies").insert({
        name: newName,
        slug,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-companies"] });
      setCreateOpen(false);
      setNewName("");
      setNewSlug("");
      toast({ title: "Company created", description: "New company has been created successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("companies").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-companies"] });
    },
  });

  const autoSlug = (name: string) => {
    setNewName(name);
    setNewSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Companies</h2>
          <p className="text-muted-foreground mt-1">Manage your customer companies and their access</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />New Company</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Company</DialogTitle>
              <DialogDescription>Add a new customer company to the platform.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input id="company-name" value={newName} onChange={(e) => autoSlug(e.target.value)} placeholder="e.g. Sunrise Care Home" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-slug">Slug</Label>
                <Input id="company-slug" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="sunrise-care-home" />
                <p className="text-xs text-muted-foreground">Used in URLs. Auto-generated from name.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={() => createCompany.mutate()} disabled={!newName.trim() || createCompany.isPending}>
                {createCompany.isPending ? "Creating..." : "Create Company"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading companies...</div>
      ) : !companies?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No companies yet</h3>
            <p className="text-muted-foreground mb-4">Create your first company to get started.</p>
            <Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 mr-2" />Create Company</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {companies.map((company) => (
            <Card key={company.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{company.name}</h3>
                    <p className="text-sm text-muted-foreground">/{company.slug}</p>
                  </div>
                  <Badge variant={company.is_active ? "default" : "secondary"}>
                    {company.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline">
                    {companyModuleCounts?.[company.id] || 0} modules
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={company.is_active}
                    onCheckedChange={(checked) => toggleActive.mutate({ id: company.id, is_active: checked })}
                  />
                  <Button variant="outline" size="sm" onClick={() => navigate(`/platform/companies/${company.id}`)}>
                    <Settings className="w-4 h-4 mr-1" /> Manage
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlatformCompanies;
