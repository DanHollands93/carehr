import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserCompanyId } from "@/hooks/useUserCompanyId";

/**
 * Fetches lookup list items for a given category, merging system defaults
 * (company_id IS NULL) with company-specific items. Also respects hidden defaults.
 */
export const useLookupItems = (category: string, options?: { activeOnly?: boolean }) => {
  const { companyId } = useUserCompanyId();
  const activeOnly = options?.activeOnly ?? true;

  const { data: hiddenIds = [] } = useQuery({
    queryKey: ['hidden-defaults', 'lookup_lists', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_hidden_defaults')
        .select('record_id')
        .eq('company_id', companyId!)
        .eq('table_name', 'lookup_lists');
      if (error) throw error;
      return (data || []).map(d => d.record_id);
    },
    enabled: !!companyId,
  });

  return useQuery({
    queryKey: ['lookup-merged', category, companyId, activeOnly, hiddenIds],
    queryFn: async () => {
      // Company items
      let companyQuery = supabase
        .from('lookup_lists')
        .select('*')
        .eq('category', category)
        .eq('company_id', companyId!);
      if (activeOnly) companyQuery = companyQuery.eq('is_active', true);
      const { data: companyData, error: e1 } = await companyQuery.order('sort_order');
      if (e1) throw e1;

      // System defaults
      let systemQuery = supabase
        .from('lookup_lists')
        .select('*')
        .eq('category', category)
        .is('company_id', null);
      if (activeOnly) systemQuery = systemQuery.eq('is_active', true);
      const { data: systemData, error: e2 } = await systemQuery.order('sort_order');
      if (e2) throw e2;

      const visibleSystem = (systemData || []).filter(item => !hiddenIds.includes(item.id));
      return [...visibleSystem, ...(companyData || [])];
    },
    enabled: !!companyId,
  });
};
