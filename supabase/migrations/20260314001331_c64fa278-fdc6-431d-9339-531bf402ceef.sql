
-- Add trigger to auto-set company_id on pay_rates
CREATE TRIGGER set_company_id_pay_rates
  BEFORE INSERT ON public.pay_rates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

-- Add career_history_id column to pay_rates
ALTER TABLE public.pay_rates ADD COLUMN career_history_id uuid REFERENCES public.career_history(id) ON DELETE SET NULL;
