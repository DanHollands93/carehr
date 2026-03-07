
-- Employee form field configs: per-company, per-section field visibility + custom fields
CREATE TABLE public.employee_form_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  section text NOT NULL, -- 'personal_details', 'address', 'employment_history', 'emergency_contact'
  -- field_configs: JSON object mapping built-in field keys to {visible, required}
  field_configs jsonb DEFAULT '{}'::jsonb,
  -- custom_fields: same format as compliance [{key, label, type, required, options}]
  custom_fields jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, section)
);

ALTER TABLE public.employee_form_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage employee form configs"
  ON public.employee_form_configs FOR ALL
  USING (
    is_super_admin(auth.uid()) OR (
      company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role)
    )
  );

CREATE POLICY "Users can view employee form configs"
  ON public.employee_form_configs FOR SELECT
  USING (
    is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid())
  );

CREATE TRIGGER set_employee_form_configs_company_id
  BEFORE INSERT ON public.employee_form_configs
  FOR EACH ROW EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER update_employee_form_configs_updated_at
  BEFORE UPDATE ON public.employee_form_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add custom_fields to employees table for storing custom field values
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb;

-- Review type templates: company-configurable schemas for probations/supervisions/appraisals
CREATE TABLE public.review_type_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL, -- e.g. 'Probation Review', 'Monthly Supervision', 'Annual Appraisal'
  category text NOT NULL DEFAULT 'supervision', -- 'probation', 'supervision', 'appraisal'
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  -- Scheduling config
  auto_schedule boolean DEFAULT false,
  schedule_interval_days integer DEFAULT 30, -- interval between auto-created records
  schedule_count integer DEFAULT null, -- null = unlimited, otherwise max number of scheduled records
  -- Whether to auto-create on employment history creation (for probation)
  auto_create_on_hire boolean DEFAULT false,
  -- Custom form fields for this review type
  custom_fields jsonb DEFAULT '[]'::jsonb,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);

ALTER TABLE public.review_type_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage review type templates"
  ON public.review_type_templates FOR ALL
  USING (
    is_super_admin(auth.uid()) OR (
      company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role)
    )
  );

CREATE POLICY "Users can view review type templates"
  ON public.review_type_templates FOR SELECT
  USING (
    is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid())
  );

CREATE TRIGGER set_review_type_templates_company_id
  BEFORE INSERT ON public.review_type_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER update_review_type_templates_updated_at
  BEFORE UPDATE ON public.review_type_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Employee reviews: actual review records
CREATE TABLE public.employee_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  review_type_template_id uuid REFERENCES public.review_type_templates(id) ON DELETE SET NULL,
  career_history_id uuid REFERENCES public.career_history(id) ON DELETE SET NULL,
  review_type text NOT NULL, -- denormalised name
  category text NOT NULL DEFAULT 'supervision', -- 'probation', 'supervision', 'appraisal'
  status text NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  scheduled_date text, -- yyyy-MM-dd
  completed_date text,
  completed_by uuid,
  reviewer_notes text,
  employee_notes text,
  outcome text, -- e.g. 'passed', 'failed', 'extended' for probation; 'satisfactory', 'needs_improvement' etc
  custom_fields jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage company reviews"
  ON public.employee_reviews FOR ALL
  USING (
    is_super_admin(auth.uid()) OR (
      company_id = user_company_id(auth.uid()) AND (
        has_role(auth.uid(), 'admin'::app_role) OR user_has_permission(auth.uid(), 'edit_employees'::text)
      )
    )
  );

CREATE POLICY "Users can view own reviews"
  ON public.employee_reviews FOR SELECT
  USING (
    employee_id = current_user_employee_id()
  );

CREATE TRIGGER set_employee_reviews_company_id
  BEFORE INSERT ON public.employee_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER update_employee_reviews_updated_at
  BEFORE UPDATE ON public.employee_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
