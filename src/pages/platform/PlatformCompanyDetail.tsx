
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Building2, Eye, Globe, Puzzle, Settings, UserPlus, Users, Sliders } from "lucide-react";
import { useState, useEffect } from "react";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import CompanySettingsManager from "@/components/CompanySettingsManager";
import LookupListsManager from "@/components/LookupListsManager";
import EnhancedPermissionsManager from "@/components/EnhancedPermissionsManager";
import ComplianceTypeManager from "@/components/ComplianceTypeManager";
const SETTING_DEFINITIONS = [
  { key: "clock_in_geolocation", label: "Require Geolocation on Clock-In", description: "Capture staff GPS location when clocking in", module: "time_attendance" },
  { key: "clock_in_photo", label: "Require Photo on Clock-In", description: "Take a photo of staff when clocking in", module: "time_attendance" },
  { key: "require_break_logging", label: "Require Break Logging", description: "Staff must log breaks during shifts", module: "time_attendance" },
  { key: "require_shift_acknowledgement", label: "Require Shift Acknowledgement", description: "Staff must acknowledge upcoming shifts", module: "rostering" },
  { key: "allow_shift_swaps", label: "Allow Shift Swaps", description: "Staff can request to swap shifts with colleagues", module: "rostering" },
  { key: "holiday_auto_deduct", label: "Auto-Deduct Holiday Hours", description: "Automatically deduct from holiday balance on approval", module: "hr" },
];

const PlatformCompanyDetail = () => {
  const { startImpersonating } = useImpersonation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["platform-company", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: modules } = useQuery({
    queryKey: ["platform-modules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("modules").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: companyModules } = useQuery({
    queryKey: ["platform-company-modules", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_modules").select("*").eq("company_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: companySettings } = useQuery({
    queryKey: ["platform-company-settings", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_settings").select("*").eq("company_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: companyUsers } = useQuery({
    queryKey: ["platform-company-users", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, email, first_name, last_name, active").eq("company_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserFirstName, setNewUserFirstName] = useState("");
  const [newUserLastName, setNewUserLastName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("admin");
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    if (company) {
      setEditName(company.name);
      setEditSlug(company.slug);
    }
  }, [company]);

  const updateCompany = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("companies").update({ name: editName, slug: editSlug }).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-company", id] });
      queryClient.invalidateQueries({ queryKey: ["platform-companies"] });
      toast({ title: "Company updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const toggleModule = useMutation({
    mutationFn: async ({ moduleKey, enabled }: { moduleKey: string; enabled: boolean }) => {
      const existing = companyModules?.find((cm) => cm.module_key === moduleKey);
      if (existing) {
        const { error } = await supabase.from("company_modules").update({ is_enabled: enabled }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("company_modules").insert({ company_id: id!, module_key: moduleKey, is_enabled: enabled });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-company-modules", id] });
      toast({ title: "Module updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const toggleSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: boolean }) => {
      const existing = companySettings?.find((cs) => cs.setting_key === key);
      const def = SETTING_DEFINITIONS.find((d) => d.key === key);
      if (existing) {
        const { error } = await supabase.from("company_settings").update({ setting_value: String(value) }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("company_settings").insert({
          company_id: id!,
          setting_key: key,
          setting_value: String(value),
          description: def?.description || "",
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-company-settings", id] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const isModuleEnabled = (key: string) => {
    return companyModules?.some((cm) => cm.module_key === key && cm.is_enabled) ?? false;
  };

  const getSettingValue = (key: string) => {
    const setting = companySettings?.find((cs) => cs.setting_key === key);
    return setting?.setting_value === "true";
  };

  if (companyLoading) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  if (!company) {
    return <div className="text-center py-12 text-muted-foreground">Company not found.</div>;
  }

  // Group settings by their module
  const enabledModuleKeys = companyModules?.filter((cm) => cm.is_enabled).map((cm) => cm.module_key) || [];
  const visibleSettings = SETTING_DEFINITIONS.filter((s) => enabledModuleKeys.includes(s.module));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/platform/companies")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{company.name}</h2>
          <p className="text-muted-foreground">Manage company details, modules, and settings</p>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details"><Building2 className="w-4 h-4 mr-1" />Details</TabsTrigger>
          <TabsTrigger value="modules"><Puzzle className="w-4 h-4 mr-1" />Modules</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-1" />Feature Settings</TabsTrigger>
          <TabsTrigger value="system-settings"><Sliders className="w-4 h-4 mr-1" />System Settings</TabsTrigger>
          <TabsTrigger value="users"><Users className="w-4 h-4 mr-1" />Users</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
              <CardDescription>Update company name and identifier</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={editSlug} onChange={(e) => setEditSlug(e.target.value)} />
              </div>
              <Button onClick={() => updateCompany.mutate()} disabled={updateCompany.isPending}>
                {updateCompany.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules">
          <Card>
            <CardHeader>
              <CardTitle>Module Access</CardTitle>
              <CardDescription>Control which modules this company can access. Users will only see enabled modules.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modules?.map((mod) => (
                  <div key={mod.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{mod.name}</h4>
                      <p className="text-sm text-muted-foreground">{mod.description}</p>
                    </div>
                    <Switch
                      checked={isModuleEnabled(mod.key)}
                      onCheckedChange={(checked) => toggleModule.mutate({ moduleKey: mod.key, enabled: checked })}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Feature Settings</CardTitle>
              <CardDescription>Configure feature toggles for this company. Only settings for enabled modules are shown.</CardDescription>
            </CardHeader>
            <CardContent>
              {visibleSettings.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center">Enable modules first to see available feature settings.</p>
              ) : (
                <div className="space-y-4">
                  {visibleSettings.map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{setting.label}</h4>
                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                      </div>
                      <Switch
                        checked={getSettingValue(setting.key)}
                        onCheckedChange={(checked) => toggleSetting.mutate({ key: setting.key, value: checked })}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system-settings">
          <Tabs defaultValue="company" className="space-y-4">
            <TabsList className="flex-wrap">
              <TabsTrigger value="company">Company</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="lookups">Lookup Lists</TabsTrigger>
            </TabsList>

            <TabsContent value="company">
              <CompanySettingsManager companyId={id} />
            </TabsContent>

            <TabsContent value="permissions">
              <EnhancedPermissionsManager companyId={id} />
            </TabsContent>

            <TabsContent value="lookups">
              <LookupListsManager companyId={id} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Company Users</CardTitle>
                <CardDescription>Users assigned to this company ({companyUsers?.length || 0})</CardDescription>
              </div>
              <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><UserPlus className="w-4 h-4 mr-2" /> Add User</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create User for {company.name}</DialogTitle>
                    <DialogDescription>This user will be assigned to this company automatically.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input value={newUserFirstName} onChange={(e) => setNewUserFirstName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input value={newUserLastName} onChange={(e) => setNewUserLastName(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Password *</Label>
                      <Input type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} placeholder="Min 6 characters" />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={newUserRole} onValueChange={setNewUserRole}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="hr_user">HR User</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateUserOpen(false)}>Cancel</Button>
                    <Button
                      disabled={!newUserEmail.trim() || newUserPassword.length < 6 || creatingUser}
                      onClick={async () => {
                        setCreatingUser(true);
                        try {
                          const { error } = await supabase.functions.invoke("create-user-account", {
                            body: {
                              email: newUserEmail,
                              firstName: newUserFirstName,
                              lastName: newUserLastName,
                              password: newUserPassword,
                              companyId: id,
                              role: newUserRole,
                            },
                          });
                          if (error) throw error;
                          queryClient.invalidateQueries({ queryKey: ["platform-company-users", id] });
                          setCreateUserOpen(false);
                          setNewUserEmail(""); setNewUserFirstName(""); setNewUserLastName(""); setNewUserPassword("");
                          toast({ title: "User created", description: "User has been assigned to this company." });
                        } catch (err: any) {
                          toast({ title: "Error", description: err.message, variant: "destructive" });
                        } finally {
                          setCreatingUser(false);
                        }
                      }}
                    >
                      {creatingUser ? "Creating..." : "Create User"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {!companyUsers?.length ? (
                <p className="text-muted-foreground py-4 text-center">No users assigned to this company yet.</p>
              ) : (
                <div className="space-y-2">
                  {companyUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{user.first_name} {user.last_name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            startImpersonating({
                              id: user.id,
                              email: user.email || "",
                              firstName: user.first_name || "",
                              lastName: user.last_name || "",
                              companyId: id,
                              companyName: company.name,
                            });
                            navigate("/dashboard");
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" /> Impersonate
                        </Button>
                        <Badge variant={user.active ? "default" : "secondary"}>
                          {user.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlatformCompanyDetail;
