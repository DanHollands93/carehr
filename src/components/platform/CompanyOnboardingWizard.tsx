
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, Puzzle, UserPlus, CheckCircle, ArrowRight, ArrowLeft, Globe } from "lucide-react";

interface CompanyOnboardingWizardProps {
  onComplete: (companyId: string) => void;
  onCancel: () => void;
}

const STEPS = ["Company Details", "Modules", "Create Admin", "Complete"];

const CompanyOnboardingWizard = ({ onComplete, onCancel }: CompanyOnboardingWizardProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  
  // Step 1: Company
  const [companyName, setCompanyName] = useState("");
  const [companySlug, setCompanySlug] = useState("");
  const [companySubdomain, setCompanySubdomain] = useState("");
  
  // Step 2: Modules
  const [enabledModules, setEnabledModules] = useState<Record<string, boolean>>({});
  
  // Step 3: Admin user
  const [adminEmail, setAdminEmail] = useState("");
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminRole, setAdminRole] = useState<string>("admin");
  
  // Created company ID
  const [createdCompanyId, setCreatedCompanyId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: modules } = useQuery({
    queryKey: ["platform-modules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("modules").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const autoSlug = (name: string) => {
    setCompanyName(name);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    setCompanySlug(slug);
    setCompanySubdomain(slug);
  };

  const handleCreateCompany = async () => {
    setIsCreating(true);
    try {
      // Step 1: Create company
      const { data: company, error: compError } = await supabase
        .from("companies")
        .insert({
          name: companyName,
          slug: companySlug,
          subdomain: companySubdomain || companySlug,
        })
        .select()
        .single();

      if (compError) throw compError;

      const companyId = company.id;
      setCreatedCompanyId(companyId);

      // Step 2: Assign modules
      const moduleInserts = Object.entries(enabledModules)
        .filter(([, enabled]) => enabled)
        .map(([moduleKey]) => ({
          company_id: companyId,
          module_key: moduleKey,
          is_enabled: true,
        }));

      if (moduleInserts.length > 0) {
        const { error: modError } = await supabase.from("company_modules").insert(moduleInserts);
        if (modError) console.error("Module assignment error:", modError);
      }

      // Step 3: Seed default settings
      const defaultSettings = [
        { company_id: companyId, setting_key: "clock_in_geolocation", setting_value: "false", description: "Require geolocation on clock-in" },
        { company_id: companyId, setting_key: "clock_in_photo", setting_value: "false", description: "Require photo on clock-in" },
        { company_id: companyId, setting_key: "auto_approve_holidays", setting_value: "false", description: "Auto-approve holiday requests" },
        { company_id: companyId, setting_key: "allow_shift_swap", setting_value: "false", description: "Allow staff to swap shifts" },
      ];

      const { error: settingsError } = await supabase.from("company_settings").insert(defaultSettings);
      if (settingsError) console.error("Settings seed error:", settingsError);

      // Step 4: Create admin user via edge function
      if (adminEmail) {
        const { data: fnData, error: fnError } = await supabase.functions.invoke("create-user-account", {
          body: {
            email: adminEmail,
            firstName: adminFirstName,
            lastName: adminLastName,
            password: adminPassword || undefined,
            companyId,
            role: adminRole,
          },
        });

        if (fnError) {
          console.error("Admin creation error:", fnError);
          toast({ title: "Company created but admin user failed", description: fnError.message, variant: "destructive" });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["platform-companies"] });
      setStep(3); // Complete step
      toast({ title: "Company onboarded!", description: `${companyName} is ready to go.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return companyName.trim().length > 0;
      case 1: return true; // modules are optional
      case 2: return adminEmail.trim().length > 0 && adminPassword.length >= 6;
      default: return true;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              i < step ? "bg-primary text-primary-foreground" 
              : i === step ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
              : "bg-muted text-muted-foreground"
            }`}>
              {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-sm hidden sm:inline ${i === step ? "font-semibold" : "text-muted-foreground"}`}>{label}</span>
            {i < STEPS.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground mx-2" />}
          </div>
        ))}
      </div>

      {/* Step 0: Company Details */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" /> Company Details</CardTitle>
            <CardDescription>Set up the new company's identity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input value={companyName} onChange={(e) => autoSlug(e.target.value)} placeholder="e.g. Sunrise Care Home" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={companySlug} onChange={(e) => setCompanySlug(e.target.value)} placeholder="sunrise-care-home" />
              <p className="text-xs text-muted-foreground">Used internally for identification</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Globe className="w-4 h-4" /> Subdomain</Label>
              <div className="flex items-center gap-2">
                <Input value={companySubdomain} onChange={(e) => setCompanySubdomain(e.target.value)} placeholder="sunrise" />
                <span className="text-sm text-muted-foreground whitespace-nowrap">.your-domain.com</span>
              </div>
              <p className="text-xs text-muted-foreground">Custom subdomain for this company (DNS setup required later)</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Modules */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Puzzle className="w-5 h-5" /> Enable Modules</CardTitle>
            <CardDescription>Choose which modules this company has access to</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {modules?.map((mod) => (
              <div key={mod.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{mod.name}</h4>
                  <p className="text-sm text-muted-foreground">{mod.description}</p>
                </div>
                <Switch
                  checked={enabledModules[mod.key] ?? false}
                  onCheckedChange={(checked) => setEnabledModules(prev => ({ ...prev, [mod.key]: checked }))}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Create Admin */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5" /> Create Admin User</CardTitle>
            <CardDescription>Create the first admin user for this company</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={adminFirstName} onChange={(e) => setAdminFirstName(e.target.value)} placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={adminLastName} onChange={(e) => setAdminLastName(e.target.value)} placeholder="Smith" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@company.com" />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Min 6 characters" />
              <p className="text-xs text-muted-foreground">The admin can change this after first login</p>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={adminRole} onValueChange={setAdminRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="hr_user">HR User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Complete */}
      {step === 3 && (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-primary mx-auto" />
            <h3 className="text-2xl font-bold">Company Onboarded!</h3>
            <p className="text-muted-foreground">
              <strong>{companyName}</strong> has been set up with{" "}
              {Object.values(enabledModules).filter(Boolean).length} modules and an admin user.
            </p>
            {companySubdomain && (
              <Badge variant="outline" className="text-sm">
                <Globe className="w-3 h-3 mr-1" /> {companySubdomain}.your-domain.com (DNS setup required)
              </Badge>
            )}
            <div className="flex gap-3 justify-center pt-4">
              <Button variant="outline" onClick={() => onComplete(createdCompanyId!)}>
                Back to Companies
              </Button>
              <Button onClick={() => onComplete(createdCompanyId!)}>
                Manage Company
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      {step < 3 && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={step === 0 ? onCancel : () => setStep(s => s - 1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />{step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < 2 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleCreateCompany} disabled={!canProceed() || isCreating}>
              {isCreating ? "Creating..." : "Create Company"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default CompanyOnboardingWizard;
