import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserCompanyId } from "@/hooks/useUserCompanyId";

export const useHiddenDefaults = (tableName: string) => {
  const { companyId } = useUserCompanyId();
  const queryClient = useQueryClient();

  const { data: hiddenIds = [] } = useQuery({
    queryKey: ['hidden-defaults', tableName, companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_hidden_defaults')
        .select('record_id')
        .eq('company_id', companyId!)
        .eq('table_name', tableName);
      if (error) throw error;
      return (data || []).map(d => d.record_id);
    },
    enabled: !!companyId,
  });

  const toggleHiddenMutation = useMutation({
    mutationFn: async ({ recordId, hide }: { recordId: string; hide: boolean }) => {
      if (hide) {
        const { error } = await supabase
          .from('company_hidden_defaults')
          .insert([{ company_id: companyId, table_name: tableName, record_id: recordId }]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('company_hidden_defaults')
          .delete()
          .eq('company_id', companyId!)
          .eq('table_name', tableName)
          .eq('record_id', recordId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hidden-defaults', tableName, companyId] });
    },
  });

  return { hiddenIds, toggleHidden: toggleHiddenMutation.mutate, isToggling: toggleHiddenMutation.isPending };
};
