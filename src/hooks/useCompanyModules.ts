
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveCompany } from "@/contexts/ActiveCompanyContext";

export const useCompanyModules = () => {
  const { user, userRole } = useAuth();
  const { activeCompanyId } = useActiveCompany();

  const { data: companyModules, isLoading } = useQuery({
    queryKey: ["company-modules", activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return [];

      const { data, error } = await supabase
        .from("company_modules")
        .select("module_key, is_enabled")
        .eq("company_id", activeCompanyId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!activeCompanyId,
  });

  const hasModule = (moduleKey: string): boolean => {
    // Super admins see everything
    if (userRole === "super_admin") return true;
    // If no company modules configured yet, show everything (backwards compat)
    if (!companyModules || companyModules.length === 0) return true;
    return companyModules.some((m) => m.module_key === moduleKey && m.is_enabled);
  };

  return { hasModule, companyModules, isLoading };
};
