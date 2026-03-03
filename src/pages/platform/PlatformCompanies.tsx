
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Building2, Settings, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CompanyOnboardingWizard from "@/components/platform/CompanyOnboardingWizard";
import SuperAdminImpersonation from "@/components/platform/SuperAdminImpersonation";

const PlatformCompanies = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showWizard, setShowWizard] = useState(false);

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

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("companies").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-companies"] });
    },
  });

  if (showWizard) {
    return (
      <div className="space-y-6 animate-fade-in">
        <CompanyOnboardingWizard
          onComplete={(companyId) => {
            setShowWizard(false);
            navigate(`/platform/companies/${companyId}`);
          }}
          onCancel={() => setShowWizard(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Companies</h2>
          <p className="text-muted-foreground mt-1">Manage your customer companies and their access</p>
        </div>
        <Button onClick={() => setShowWizard(true)}>
          <Plus className="w-4 h-4 mr-2" />New Company
        </Button>
      </div>

      <SuperAdminImpersonation />

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading companies...</div>
      ) : !companies?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No companies yet</h3>
            <p className="text-muted-foreground mb-4">Create your first company to get started.</p>
            <Button onClick={() => setShowWizard(true)}><Plus className="w-4 h-4 mr-2" />Create Company</Button>
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
