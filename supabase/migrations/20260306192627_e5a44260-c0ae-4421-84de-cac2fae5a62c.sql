
-- Add allow_allocations flag to roster_templates
ALTER TABLE public.roster_templates ADD COLUMN IF NOT EXISTS allow_allocations boolean NOT NULL DEFAULT false;

-- Allocation locations per template (e.g. "Floor 1", "Wing A")
CREATE TABLE public.roster_allocation_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roster_template_id uuid NOT NULL REFERENCES public.roster_templates(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  company_id uuid REFERENCES public.companies(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.roster_allocation_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage company allocation locations" ON public.roster_allocation_locations
FOR ALL TO authenticated
USING (
  is_super_admin(auth.uid())
  OR (company_id = user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin'::app_role) OR user_has_permission(auth.uid(), 'edit_roster'::text)))
);

CREATE POLICY "Users can view company allocation locations" ON public.roster_allocation_locations
FOR SELECT TO authenticated
USING (
  is_super_admin(auth.uid())
  OR company_id = user_company_id(auth.uid())
);

-- Daily allocations: assigns an employee to a location for a specific date
CREATE TABLE public.roster_daily_allocations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roster_template_id uuid NOT NULL REFERENCES public.roster_templates(id) ON DELETE CASCADE,
  allocation_location_id uuid NOT NULL REFERENCES public.roster_allocation_locations(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date text NOT NULL,
  company_id uuid REFERENCES public.companies(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(roster_template_id, employee_id, date)
);

ALTER TABLE public.roster_daily_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage company daily allocations" ON public.roster_daily_allocations
FOR ALL TO authenticated
USING (
  is_super_admin(auth.uid())
  OR (company_id = user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin'::app_role) OR user_has_permission(auth.uid(), 'edit_roster'::text)))
);

CREATE POLICY "Users can view company daily allocations" ON public.roster_daily_allocations
FOR SELECT TO authenticated
USING (
  is_super_admin(auth.uid())
  OR company_id = user_company_id(auth.uid())
);

-- Auto-set company_id triggers
CREATE TRIGGER set_allocation_locations_company_id BEFORE INSERT ON public.roster_allocation_locations
FOR EACH ROW EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_daily_allocations_company_id BEFORE INSERT ON public.roster_daily_allocations
FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
