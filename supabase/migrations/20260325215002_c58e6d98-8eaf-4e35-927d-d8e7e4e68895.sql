
-- Table to track which system defaults a company has hidden
CREATE TABLE public.company_hidden_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, table_name, record_id)
);

ALTER TABLE public.company_hidden_defaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage company hidden defaults" ON public.company_hidden_defaults
  FOR ALL TO authenticated
  USING (
    is_super_admin(auth.uid()) OR (
      company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role)
    )
  );

CREATE POLICY "Users can view company hidden defaults" ON public.company_hidden_defaults
  FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid())
  );

-- Seed system-level absence types (company_id IS NULL)
INSERT INTO public.absence_types (name, color, is_requestable, is_payable, is_active, sort_order, company_id) VALUES
  ('Annual Leave', '#3b82f6', true, true, true, 0, NULL),
  ('Sick Leave', '#f43f5e', true, true, true, 1, NULL),
  ('Maternity Leave', '#8b5cf6', true, true, true, 2, NULL),
  ('Paternity Leave', '#6366f1', true, true, true, 3, NULL),
  ('Compassionate Leave', '#ec4899', true, true, true, 4, NULL),
  ('TOIL', '#10b981', true, true, true, 5, NULL),
  ('Unpaid Leave', '#64748b', true, false, true, 6, NULL),
  ('Bereavement', '#f59e0b', true, true, true, 7, NULL),
  ('Jury Service', '#14b8a6', true, true, true, 8, NULL),
  ('Training', '#f97316', false, true, true, 9, NULL);

-- Seed system-level lookup list items (company_id IS NULL)
-- Employment Types
INSERT INTO public.lookup_lists (category, value, is_active, sort_order, company_id) VALUES
  ('employment_types', 'Full-time', true, 0, NULL),
  ('employment_types', 'Part-time', true, 1, NULL),
  ('employment_types', 'Bank', true, 2, NULL),
  ('employment_types', 'Agency', true, 3, NULL),
  ('employment_types', 'Casual', true, 4, NULL);

-- Contract Types
INSERT INTO public.lookup_lists (category, value, is_active, sort_order, company_id) VALUES
  ('contract_types', 'Permanent', true, 0, NULL),
  ('contract_types', 'Temporary', true, 1, NULL),
  ('contract_types', 'Fixed-term', true, 2, NULL),
  ('contract_types', 'Zero Hours', true, 3, NULL),
  ('contract_types', 'Apprenticeship', true, 4, NULL);

-- Pay Types
INSERT INTO public.lookup_lists (category, value, is_active, sort_order, company_id) VALUES
  ('pay_types', 'Hourly', true, 0, NULL),
  ('pay_types', 'Salaried', true, 1, NULL),
  ('pay_types', 'Commission', true, 2, NULL);
