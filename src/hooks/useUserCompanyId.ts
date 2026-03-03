
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useUserCompanyId = () => {
  const { user } = useAuth();

  const { data: companyId, isLoading } = useQuery({
    queryKey: ["user-company-id", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data?.company_id;
    },
    enabled: !!user?.id,
  });

  return { companyId, isLoading };
};
