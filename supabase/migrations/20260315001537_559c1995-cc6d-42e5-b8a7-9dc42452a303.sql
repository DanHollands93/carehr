
-- Absence types lookup table
CREATE TABLE public.absence_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  is_requestable BOOLEAN NOT NULL DEFAULT true,
  is_payable BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.absence_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage company absence types"
  ON public.absence_types FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Users can view company absence types"
  ON public.absence_types FOR SELECT
  TO authenticated
  USING (is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid()));

-- Auto-set company_id trigger
CREATE TRIGGER set_company_id_absence_types
  BEFORE INSERT ON public.absence_types
  FOR EACH ROW EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER update_absence_types_updated_at
  BEFORE UPDATE ON public.absence_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Absences table (actual absence records)
CREATE TABLE public.absences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  absence_type_id UUID NOT NULL REFERENCES public.absence_types(id),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage company absences"
  ON public.absences FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin'::app_role) OR user_has_permission(auth.uid(), 'edit_employees'::text))));

CREATE POLICY "Users can view own absences"
  ON public.absences FOR SELECT
  TO authenticated
  USING (employee_id = current_user_employee_id());

CREATE POLICY "Users can submit own absences"
  ON public.absences FOR INSERT
  TO authenticated
  WITH CHECK (company_id = user_company_id(auth.uid()) AND employee_id = current_user_employee_id());

CREATE TRIGGER set_company_id_absences
  BEFORE INSERT ON public.absences
  FOR EACH ROW EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER update_absences_updated_at
  BEFORE UPDATE ON public.absences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
