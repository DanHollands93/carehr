
-- Create discrepancy_reasons lookup table
CREATE TABLE public.discrepancy_reasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  name TEXT NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  context TEXT NOT NULL DEFAULT 'any',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- context values: 'late_clock_in', 'early_clock_in', 'early_clock_out', 'late_clock_out', 'no_show', 'absence', 'any'

-- Auto-set company_id
CREATE TRIGGER set_company_id_discrepancy_reasons
  BEFORE INSERT ON public.discrepancy_reasons
  FOR EACH ROW EXECUTE FUNCTION public.set_company_id();

-- Auto-update updated_at
CREATE TRIGGER update_discrepancy_reasons_updated_at
  BEFORE UPDATE ON public.discrepancy_reasons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.discrepancy_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage company discrepancy reasons"
  ON public.discrepancy_reasons FOR ALL
  TO authenticated
  USING (
    is_super_admin(auth.uid()) OR (
      company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role)
    )
  );

CREATE POLICY "Users can view company discrepancy reasons"
  ON public.discrepancy_reasons FOR SELECT
  TO authenticated
  USING (
    is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid())
  );

-- Add absence_id to time_clock_records
ALTER TABLE public.time_clock_records
  ADD COLUMN absence_id UUID REFERENCES public.absences(id) ON DELETE SET NULL,
  ADD COLUMN discrepancy_reason_id UUID REFERENCES public.discrepancy_reasons(id) ON DELETE SET NULL;
