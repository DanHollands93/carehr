import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserCompanyId } from "@/hooks/useUserCompanyId";

export const useCompanyClockSettings = () => {
  const { companyId } = useUserCompanyId();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['company-clock-settings', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('setting_key, setting_value')
        .eq('company_id', companyId!)
        .in('setting_key', [
          'geolocation_clock_in',
          'geolocation_clock_out',
          'photo_clock_in',
          'photo_clock_out',
        ]);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const isEnabled = (key: string) =>
    settings?.find(s => s.setting_key === key)?.setting_value === 'true';

  return {
    isLoading,
    requireGeoClockIn: isEnabled('geolocation_clock_in'),
    requireGeoClockOut: isEnabled('geolocation_clock_out'),
    requirePhotoClockIn: isEnabled('photo_clock_in'),
    requirePhotoClockOut: isEnabled('photo_clock_out'),
  };
};
