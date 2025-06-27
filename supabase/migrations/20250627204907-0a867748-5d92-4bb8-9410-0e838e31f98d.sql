
-- Create template assignments table (links employees to shifts in templates)
CREATE TABLE public.roster_template_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roster_template_id UUID NOT NULL REFERENCES public.roster_templates(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  day_of_period INTEGER NOT NULL, -- 0-6 for weekly, 0-13 for bi-weekly, 0-30 for monthly, etc.
  shift_template_id UUID NOT NULL REFERENCES public.shift_templates(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create applied roster templates table (tracks when templates are applied to actual schedules)
CREATE TABLE public.applied_roster_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roster_template_id UUID NOT NULL REFERENCES public.roster_templates(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  applied_by UUID REFERENCES auth.users(id)
);

-- Update the existing roster_templates table to add missing columns
ALTER TABLE public.roster_templates 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS repeat_type TEXT DEFAULT 'weekly',
ADD COLUMN IF NOT EXISTS repeat_interval INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add check constraint for repeat_type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'roster_templates_repeat_type_check' 
        AND table_name = 'roster_templates'
    ) THEN
        ALTER TABLE public.roster_templates 
        ADD CONSTRAINT roster_templates_repeat_type_check 
        CHECK (repeat_type IN ('weekly', 'bi_weekly', 'monthly', 'custom'));
    END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE public.roster_template_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applied_roster_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables
CREATE POLICY "Authenticated users can view template assignments" 
  ON public.roster_template_assignments FOR SELECT 
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage template assignments" 
  ON public.roster_template_assignments FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view applied templates" 
  ON public.applied_roster_templates FOR SELECT 
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage applied templates" 
  ON public.applied_roster_templates FOR ALL
  TO authenticated USING (true) WITH CHECK (true);
