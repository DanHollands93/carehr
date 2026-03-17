import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserCompanyId } from "@/hooks/useUserCompanyId";

export interface DiscrepancyReason {
  id: string;
  name: string;
  is_paid: boolean;
  context: string;
  is_active: boolean;
  sort_order: number;
}

export const useDiscrepancyReasons = () => {
  const { companyId } = useUserCompanyId();

  return useQuery({
    queryKey: ['discrepancy-reasons', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discrepancy_reasons')
        .select('*')
        .eq('company_id', companyId!)
        .eq('is_active', true)
        .order('context')
        .order('sort_order');
      if (error) throw error;
      return data as DiscrepancyReason[];
    },
    enabled: !!companyId,
  });
};

/**
 * Map a discrepancy segment type to the context values used in discrepancy_reasons.
 */
export const segmentTypeToContext = (type: string): string[] => {
  switch (type) {
    case 'early_start': return ['early_clock_in', 'any'];
    case 'late_start': return ['late_clock_in', 'any'];
    case 'early_end': return ['early_clock_out', 'any'];
    case 'late_end': return ['late_clock_out', 'any'];
    case 'no_show': return ['no_show', 'any'];
    default: return ['any'];
  }
};

/**
 * Filter reasons relevant to a specific segment type.
 */
export const getReasonsForSegment = (
  reasons: DiscrepancyReason[],
  segmentType: string
): DiscrepancyReason[] => {
  const contexts = segmentTypeToContext(segmentType);
  return reasons.filter(r => contexts.includes(r.context));
};
