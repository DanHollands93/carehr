
-- Create roster_template_sections table
CREATE TABLE public.roster_template_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roster_template_id UUID NOT NULL REFERENCES public.roster_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  company_id UUID REFERENCES public.companies(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create roster_section_role_rules table (maps job roles to sections)
CREATE TABLE public.roster_section_role_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.roster_template_sections(id) ON DELETE CASCADE,
  job_role_id UUID NOT NULL REFERENCES public.job_roles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(section_id, job_role_id)
);

-- Add section_id to roster_template_assignments
ALTER TABLE public.roster_template_assignments ADD COLUMN section_id UUID REFERENCES public.roster_template_sections(id) ON DELETE SET NULL;

-- Add section_id to shifts
ALTER TABLE public.shifts ADD COLUMN section_id UUID REFERENCES public.roster_template_sections(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.roster_template_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roster_section_role_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies for roster_template_sections
CREATE POLICY "Admins can manage company roster sections" ON public.roster_template_sections
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR user_has_permission(auth.uid(), 'edit_roster'))));

CREATE POLICY "Users can view company roster sections" ON public.roster_template_sections
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid()));

-- RLS policies for roster_section_role_rules
CREATE POLICY "Admins can manage company section role rules" ON public.roster_section_role_rules
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR user_has_permission(auth.uid(), 'edit_roster'))));

CREATE POLICY "Users can view company section role rules" ON public.roster_section_role_rules
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid()));

-- Auto-set company_id triggers
CREATE TRIGGER set_roster_template_sections_company_id
  BEFORE INSERT ON public.roster_template_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_roster_section_role_rules_company_id
  BEFORE INSERT ON public.roster_section_role_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_company_id();

-- Audit triggers
CREATE TRIGGER audit_roster_template_sections
  AFTER INSERT OR UPDATE OR DELETE ON public.roster_template_sections
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_roster_section_role_rules
  AFTER INSERT OR UPDATE OR DELETE ON public.roster_section_role_rules
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
