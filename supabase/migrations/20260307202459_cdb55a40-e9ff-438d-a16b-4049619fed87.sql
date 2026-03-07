
-- Add known_as field to employees
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS known_as text;

-- Add work_email field to employees
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS work_email text;

-- Create employee_compliance table for extensible compliance records
CREATE TABLE public.employee_compliance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id),
  compliance_type text NOT NULL,
  reference_number text,
  issue_date text,
  expiry_date text,
  status text DEFAULT 'valid',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_compliance ENABLE ROW LEVEL SECURITY;

-- RLS policies matching employee table access patterns
CREATE POLICY "Admins can manage company compliance records"
  ON public.employee_compliance FOR ALL
  USING (
    is_super_admin(auth.uid()) OR (
      company_id = user_company_id(auth.uid()) AND (
        has_role(auth.uid(), 'admin') OR user_has_permission(auth.uid(), 'edit_employees')
      )
    )
  );

CREATE POLICY "Users can view company compliance records"
  ON public.employee_compliance FOR SELECT
  USING (
    is_super_admin(auth.uid()) OR (
      company_id = user_company_id(auth.uid()) AND (
        has_role(auth.uid(), 'admin') OR user_has_permission(auth.uid(), 'view_employees')
      )
    )
  );

-- Auto-set company_id
CREATE TRIGGER set_company_id_employee_compliance
  BEFORE INSERT ON public.employee_compliance
  FOR EACH ROW EXECUTE FUNCTION public.set_company_id();

-- Auto-update updated_at
CREATE TRIGGER update_employee_compliance_updated_at
  BEFORE UPDATE ON public.employee_compliance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
