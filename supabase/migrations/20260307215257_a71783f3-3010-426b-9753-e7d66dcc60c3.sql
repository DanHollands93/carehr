
-- Compliance type templates: per-company definitions with custom fields
CREATE TABLE public.compliance_type_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  -- Standard field visibility toggles
  show_reference_number boolean DEFAULT true,
  show_issue_date boolean DEFAULT true,
  show_expiry_date boolean DEFAULT true,
  -- Custom fields as JSON array: [{key, label, type, required, options}]
  -- type can be: text, number, date, yes_no, select
  custom_fields jsonb DEFAULT '[]'::jsonb,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);

ALTER TABLE public.compliance_type_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage company compliance templates"
  ON public.compliance_type_templates FOR ALL
  USING (
    is_super_admin(auth.uid()) OR (
      company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role)
    )
  );

CREATE POLICY "Users can view company compliance templates"
  ON public.compliance_type_templates FOR SELECT
  USING (
    is_super_admin(auth.uid()) OR (
      company_id = user_company_id(auth.uid())
    )
  );

-- Add custom_fields column to employee_compliance to store values
ALTER TABLE public.employee_compliance ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb;

-- Add compliance_type_template_id to link records to templates
ALTER TABLE public.employee_compliance ADD COLUMN IF NOT EXISTS compliance_type_template_id uuid REFERENCES public.compliance_type_templates(id) ON DELETE SET NULL;

-- Auto-set company_id trigger
CREATE TRIGGER set_compliance_type_templates_company_id
  BEFORE INSERT ON public.compliance_type_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_company_id();

-- Updated_at trigger
CREATE TRIGGER update_compliance_type_templates_updated_at
  BEFORE UPDATE ON public.compliance_type_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
