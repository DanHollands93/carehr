
-- Add missing columns to roster_template_assignments
ALTER TABLE public.roster_template_assignments
  ADD COLUMN IF NOT EXISTS day_of_period INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shift_template_id UUID REFERENCES public.shift_templates(id) ON DELETE SET NULL;

-- Add missing columns to applied_roster_templates
ALTER TABLE public.applied_roster_templates
  ADD COLUMN IF NOT EXISTS start_date TEXT,
  ADD COLUMN IF NOT EXISTS end_date TEXT;

-- Add FK from roster_templates to roster_categories
ALTER TABLE public.roster_templates
  ADD CONSTRAINT roster_templates_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES public.roster_categories(id) ON DELETE SET NULL;

-- Add missing columns to time_segments
ALTER TABLE public.time_segments
  ADD COLUMN IF NOT EXISTS minutes_worked NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS minutes_paid NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pay_status TEXT DEFAULT 'pending';

-- Add missing columns to time_clock_records
ALTER TABLE public.time_clock_records
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_minutes_paid NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS early_minutes_paid NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS late_minutes_paid NUMERIC DEFAULT 0;
