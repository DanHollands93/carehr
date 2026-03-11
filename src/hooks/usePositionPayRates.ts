import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PositionPayRate {
  id: string;
  company_id: string | null;
  position: string;
  name: string;
  pay_rate: number;
  pay_type: string;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const usePositionPayRates = (position?: string) => {
  return useQuery({
    queryKey: ['position-pay-rates', position],
    queryFn: async () => {
      let query = supabase
        .from('position_pay_rates')
        .select('*')
        .eq('is_active', true)
        .order('position')
        .order('name');

      if (position) {
        query = query.eq('position', position);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PositionPayRate[];
    },
  });
};

export const useAllPositionPayRates = () => {
  return useQuery({
    queryKey: ['position-pay-rates-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('position_pay_rates')
        .select('*')
        .order('position')
        .order('name');
      if (error) throw error;
      return (data || []) as PositionPayRate[];
    },
  });
};

export const useAddPositionPayRate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rate: {
      position: string;
      name: string;
      pay_rate: number;
      pay_type?: string;
      currency?: string;
    }) => {
      const { data, error } = await supabase
        .from('position_pay_rates')
        .insert({
          position: rate.position,
          name: rate.name,
          pay_rate: rate.pay_rate,
          pay_type: rate.pay_type || 'hourly',
          currency: rate.currency || 'GBP',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['position-pay-rates'] });
      queryClient.invalidateQueries({ queryKey: ['position-pay-rates-all'] });
    },
  });
};

export const useUpdatePositionPayRate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; pay_rate?: number; name?: string; pay_type?: string; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('position_pay_rates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['position-pay-rates'] });
      queryClient.invalidateQueries({ queryKey: ['position-pay-rates-all'] });
    },
  });
};

export const useDeletePositionPayRate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('position_pay_rates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['position-pay-rates'] });
      queryClient.invalidateQueries({ queryKey: ['position-pay-rates-all'] });
    },
  });
};
