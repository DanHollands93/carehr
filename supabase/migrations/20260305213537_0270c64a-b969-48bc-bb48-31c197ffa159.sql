
-- Fix employees SELECT policy: change from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Users can view company employees" ON public.employees;
CREATE POLICY "Users can view company employees"
ON public.employees FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid())));

-- Fix roster_template_assignments SELECT policy: change from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Users can view company roster assignments" ON public.roster_template_assignments;
CREATE POLICY "Users can view company roster assignments"
ON public.roster_template_assignments FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid())));
