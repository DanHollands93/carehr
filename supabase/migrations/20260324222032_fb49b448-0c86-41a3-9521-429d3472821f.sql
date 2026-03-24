
-- Add location column to roster_templates
ALTER TABLE public.roster_templates ADD COLUMN IF NOT EXISTS location text;

-- Create employee_locations table for multi-location employee assignments
CREATE TABLE IF NOT EXISTS public.employee_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  company_id UUID REFERENCES public.companies(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, location)
);

ALTER TABLE public.employee_locations ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view their company's employee locations
CREATE POLICY "Users can view company employee locations"
  ON public.employee_locations FOR SELECT
  TO authenticated
  USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid())));

-- RLS: Admins can manage employee locations
CREATE POLICY "Admins can manage company employee locations"
  ON public.employee_locations FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()) OR ((company_id = user_company_id(auth.uid())) AND (has_role(auth.uid(), 'admin'::app_role) OR user_has_permission(auth.uid(), 'edit_employees'::text))));

-- Auto-set company_id trigger
CREATE TRIGGER set_company_id_employee_locations
  BEFORE INSERT ON public.employee_locations
  FOR EACH ROW EXECUTE FUNCTION public.set_company_id();

-- Seed employee_locations from existing employee.location field
INSERT INTO public.employee_locations (employee_id, location, is_primary, company_id)
SELECT id, location, true, company_id
FROM public.employees
WHERE location IS NOT NULL AND location != ''
ON CONFLICT (employee_id, location) DO NOTHING;
