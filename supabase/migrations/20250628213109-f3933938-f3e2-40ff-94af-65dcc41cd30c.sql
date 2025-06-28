
-- Add missing columns to time_clock_records table for discrepancy tracking
ALTER TABLE public.time_clock_records 
ADD COLUMN IF NOT EXISTS discrepancy_type TEXT,
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create system_settings table for time clock tolerances
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default time clock settings
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
('early_clock_in_minutes', '15', 'How many minutes early an employee can clock in'),
('late_clock_in_minutes', '15', 'How many minutes late an employee can clock in'),
('early_clock_out_minutes', '15', 'How many minutes early an employee can clock out'),
('late_clock_out_minutes', '15', 'How many minutes late an employee can clock out')
ON CONFLICT (setting_key) DO NOTHING;
