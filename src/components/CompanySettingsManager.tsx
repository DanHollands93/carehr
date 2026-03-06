
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Camera, CalendarCheck, ArrowLeftRight, Loader2 } from "lucide-react";
import { useUserCompanyId } from "@/hooks/useUserCompanyId";

interface CompanySetting {
  id: string;
  setting_key: string;
  setting_value: string;
  description: string | null;
}

const SETTING_META: Record<string, { label: string; icon: React.ElementType; category: string }> = {
  geolocation_clock_in: { label: "Require Geolocation on Clock In", icon: MapPin, category: "Time & Attendance" },
  geolocation_clock_out: { label: "Require Geolocation on Clock Out", icon: MapPin, category: "Time & Attendance" },
  photo_clock_in: { label: "Require Photo on Clock In", icon: Camera, category: "Time & Attendance" },
  photo_clock_out: { label: "Require Photo on Clock Out", icon: Camera, category: "Time & Attendance" },
  auto_approve_holidays: { label: "Auto-Approve Holiday Requests", icon: CalendarCheck, category: "Holidays" },
  allow_shift_swap: { label: "Allow Shift Swapping", icon: ArrowLeftRight, category: "Roster" },
};

const CompanySettingsManager = ({ companyId: propCompanyId }: { companyId?: string } = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile-company", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !propCompanyId,
  });

  const companyId = propCompanyId || profile?.company_id;

  const { data: settings, isLoading } = useQuery({
    queryKey: ["company-settings", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .eq("company_id", companyId!);
      if (error) throw error;
      return data as CompanySetting[];
    },
    enabled: !!companyId,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }) => {
      const { error } = await supabase
        .from("company_settings")
        .update({ setting_value: value })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-settings", companyId] });
      toast({ title: "Setting updated", description: "Company setting saved successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update setting", variant: "destructive" });
    },
  });

  const handleToggle = (setting: CompanySetting) => {
    const newValue = setting.setting_value === "true" ? "false" : "true";
    updateMutation.mutate({ id: setting.id, value: newValue });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!companyId) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No company assigned to your account. Contact a platform administrator.
        </CardContent>
      </Card>
    );
  }

  // Group settings by category
  const grouped: Record<string, CompanySetting[]> = {};
  settings?.forEach((s) => {
    const meta = SETTING_META[s.setting_key];
    const cat = meta?.category || "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(s);
  });

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, items]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle>{category}</CardTitle>
            <CardDescription>Toggle features for your company</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((setting) => {
              const meta = SETTING_META[setting.setting_key];
              const Icon = meta?.icon;
              return (
                <div key={setting.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
                    <div>
                      <Label className="text-base">{meta?.label || setting.setting_key}</Label>
                      {setting.description && (
                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={setting.setting_value === "true"}
                    onCheckedChange={() => handleToggle(setting)}
                    disabled={updateMutation.isPending}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {(!settings || settings.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No configurable settings found for your company.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CompanySettingsManager;
