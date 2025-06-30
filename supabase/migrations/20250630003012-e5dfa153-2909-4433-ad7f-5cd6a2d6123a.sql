
-- Add end_date column to roster_templates table
ALTER TABLE public.roster_templates 
ADD COLUMN end_date DATE;

-- Add a function to check if a template is currently active
CREATE OR REPLACE FUNCTION public.is_template_active(template_start_date DATE, template_end_date DATE)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN template_end_date IS NULL THEN TRUE
    WHEN template_end_date >= CURRENT_DATE THEN TRUE
    ELSE FALSE
  END;
$$;
