
-- Create position_pay_rates table to store named pay rate tiers per position
CREATE TABLE public.position_pay_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  position TEXT NOT NULL,
  name TEXT NOT NULL,
  pay_rate NUMERIC NOT NULL,
  pay_type TEXT NOT NULL DEFAULT 'hourly',
  currency TEXT NOT NULL DEFAULT 'GBP',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.position_pay_rates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage company position pay rates"
  ON public.position_pay_rates FOR ALL
  TO authenticated
  USING (
    is_super_admin(auth.uid()) OR (
      company_id = user_company_id(auth.uid()) AND (
        has_role(auth.uid(), 'admin') OR user_has_permission(auth.uid(), 'edit_employees')
      )
    )
  );

CREATE POLICY "Users can view company position pay rates"
  ON public.position_pay_rates FOR SELECT
  TO authenticated
  USING (
    is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid())
  );

-- Auto-set company_id trigger
CREATE TRIGGER set_company_id_position_pay_rates
  BEFORE INSERT ON public.position_pay_rates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

-- Auto-update updated_at trigger
CREATE TRIGGER update_position_pay_rates_updated_at
  BEFORE UPDATE ON public.position_pay_rates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
