
-- Fix shift_templates: need at least one PERMISSIVE SELECT policy
DROP POLICY IF EXISTS "Users can view company shift templates" ON public.shift_templates;
CREATE POLICY "Users can view company shift templates"
ON public.shift_templates
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid())));

-- Fix roster_templates
DROP POLICY IF EXISTS "Users can view company roster templates" ON public.roster_templates;
CREATE POLICY "Users can view company roster templates"
ON public.roster_templates
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid())));

-- Fix shift_templates ALL policy
DROP POLICY IF EXISTS "Admins can manage company shift templates" ON public.shift_templates;
CREATE POLICY "Admins can manage company shift templates"
ON public.shift_templates
FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()) OR ((company_id = user_company_id(auth.uid())) AND (has_role(auth.uid(), 'admin'::app_role) OR user_has_permission(auth.uid(), 'edit_roster'::text))));

-- Fix roster_templates ALL policy
DROP POLICY IF EXISTS "Admins can manage company roster templates" ON public.roster_templates;
CREATE POLICY "Admins can manage company roster templates"
ON public.roster_templates
FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()) OR ((company_id = user_company_id(auth.uid())) AND (has_role(auth.uid(), 'admin'::app_role) OR user_has_permission(auth.uid(), 'edit_roster'::text))));
