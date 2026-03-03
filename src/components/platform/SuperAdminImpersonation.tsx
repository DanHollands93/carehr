
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Building2 } from "lucide-react";

const SuperAdminImpersonation = () => {
  const { userRole } = useAuth();
  const { startImpersonating, stopImpersonating, isImpersonating, impersonatedUser } = useImpersonation();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  if (userRole !== "super_admin") return null;

  const { data: companies } = useQuery({
    queryKey: ["all-companies-impersonation"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("id, name, slug").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: users } = useQuery({
    queryKey: ["company-users-impersonation", selectedCompanyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, company_id")
        .eq("company_id", selectedCompanyId)
        .eq("active", true);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompanyId,
  });

  const handleImpersonate = (user: any) => {
    const company = companies?.find(c => c.id === user.company_id);
    startImpersonating({
      id: user.id,
      email: user.email || "",
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      companyId: user.company_id,
      companyName: company?.name || "",
    });
  };

  if (isImpersonating) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-destructive" />
            <div>
              <p className="font-medium">
                Impersonating: {impersonatedUser?.firstName} {impersonatedUser?.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                {impersonatedUser?.email} • {(impersonatedUser as any)?.companyName}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={stopImpersonating}>
            <EyeOff className="w-4 h-4 mr-2" /> Stop
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5" /> Impersonate User</CardTitle>
        <CardDescription>View the system as any user across all companies</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a company..." />
            </SelectTrigger>
            <SelectContent>
              {companies?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" /> {c.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCompanyId && users && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No users in this company</p>
            ) : (
              users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{user.first_name} {user.last_name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleImpersonate(user)}>
                    <Eye className="w-4 h-4 mr-1" /> Impersonate
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SuperAdminImpersonation;
