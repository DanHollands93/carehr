
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SystemSetting {
  setting_key: string;
  setting_value: string;
  description: string;
}

export const useTimeClockSettings = () => {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .in('setting_key', [
          'early_clock_in_minutes',
          'late_clock_in_minutes', 
          'early_clock_out_minutes',
          'late_clock_out_minutes'
        ]);
      
      if (error) throw error;
      return data as SystemSetting[];
    }
  });

  const getSettingValue = (key: string, defaultValue: number = 15): number => {
    const setting = settings?.find(s => s.setting_key === key);
    return setting ? parseInt(setting.setting_value) : defaultValue;
  };

  return {
    settings,
    isLoading,
    earlyClockInMinutes: getSettingValue('early_clock_in_minutes'),
    lateClockInMinutes: getSettingValue('late_clock_in_minutes'),
    earlyClockOutMinutes: getSettingValue('early_clock_out_minutes'),
    lateClockOutMinutes: getSettingValue('late_clock_out_minutes')
  };
};
