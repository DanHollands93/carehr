
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserCompanyId } from "@/hooks/useUserCompanyId";

interface SystemSetting {
  setting_key: string;
  setting_value: string;
  description: string;
}

export const useTimeClockSettings = () => {
  const { companyId } = useUserCompanyId();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings', companyId],
    queryFn: async () => {
      const query = supabase
        .from('system_settings')
        .select('*')
        .in('setting_key', [
          'early_clock_in_minutes',
          'late_clock_in_minutes', 
          'early_clock_out_minutes',
          'late_clock_out_minutes',
          'early_clock_in_auto_action',
          'late_clock_in_auto_action',
          'early_clock_out_auto_action',
          'late_clock_out_auto_action'
        ]);
      
      if (companyId) {
        query.eq('company_id', companyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SystemSetting[];
    },
    enabled: !!companyId,
  });

  const getSettingValue = (key: string, defaultValue: number = 15): number => {
    const setting = settings?.find(s => s.setting_key === key);
    return setting ? parseInt(setting.setting_value) : defaultValue;
  };

  const getSettingString = (key: string, defaultValue: string = 'unpaid'): string => {
    const setting = settings?.find(s => s.setting_key === key);
    return setting?.setting_value || defaultValue;
  };

  return {
    settings,
    isLoading,
    earlyClockInMinutes: getSettingValue('early_clock_in_minutes'),
    lateClockInMinutes: getSettingValue('late_clock_in_minutes'),
    earlyClockOutMinutes: getSettingValue('early_clock_out_minutes'),
    lateClockOutMinutes: getSettingValue('late_clock_out_minutes'),
    earlyClockInAutoAction: getSettingString('early_clock_in_auto_action', 'unpaid') as 'paid' | 'unpaid',
    lateClockInAutoAction: getSettingString('late_clock_in_auto_action', 'unpaid') as 'paid' | 'unpaid',
    earlyClockOutAutoAction: getSettingString('early_clock_out_auto_action', 'unpaid') as 'paid' | 'unpaid',
    lateClockOutAutoAction: getSettingString('late_clock_out_auto_action', 'unpaid') as 'paid' | 'unpaid',
  };
};
