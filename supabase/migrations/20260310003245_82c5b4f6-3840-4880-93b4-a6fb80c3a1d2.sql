
CREATE TABLE public.pay_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id),
  job_role_id uuid REFERENCES public.job_roles(id) ON DELETE CASCADE,
  employee_job_role_id uuid REFERENCES public.employee_job_roles(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  pay_rate numeric NOT NULL,
  pay_type text NOT NULL DEFAULT 'hourly',
  currency text NOT NULL DEFAULT 'GBP',
  effective_from text NOT NULL,
  effective_to text,
  reason text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pay_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage company pay rates"
  ON public.pay_rates FOR ALL
  TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      company_id = user_company_id(auth.uid())
      AND (has_role(auth.uid(), 'admin') OR user_has_permission(auth.uid(), 'edit_employees'))
    )
  );

CREATE POLICY "Users can view company pay rates"
  ON public.pay_rates FOR SELECT
  TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR company_id = user_company_id(auth.uid())
  );

CREATE TRIGGER set_pay_rates_company_id
  BEFORE INSERT ON public.pay_rates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER audit_pay_rates
  AFTER INSERT OR UPDATE OR DELETE ON public.pay_rates
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_log_trigger();
