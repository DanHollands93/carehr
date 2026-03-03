
-- Fix shift_templates SELECT policy to allow super_admins
DROP POLICY IF EXISTS "Users can view company shift templates" ON public.shift_templates;
CREATE POLICY "Users can view company shift templates"
ON public.shift_templates AS RESTRICTIVE
FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid())));

-- Fix roster_templates SELECT policy
DROP POLICY IF EXISTS "Users can view company roster templates" ON public.roster_templates;
CREATE POLICY "Users can view company roster templates"
ON public.roster_templates AS RESTRICTIVE
FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid())));

-- Fix employees SELECT policy
DROP POLICY IF EXISTS "Users can view company employees" ON public.employees;
CREATE POLICY "Users can view company employees"
ON public.employees AS RESTRICTIVE
FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid())));

-- Fix roster_template_assignments SELECT policy
DROP POLICY IF EXISTS "Users can view company roster assignments" ON public.roster_template_assignments;
CREATE POLICY "Users can view company roster assignments"
ON public.roster_template_assignments AS RESTRICTIVE
FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid())));

-- Fix shifts SELECT policy
DROP POLICY IF EXISTS "Users can view company shifts" ON public.shifts;
CREATE POLICY "Users can view company shifts"
ON public.shifts AS RESTRICTIVE
FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid())));

-- Fix lookup_lists SELECT policy
DROP POLICY IF EXISTS "Users can view company lookup lists" ON public.lookup_lists;
CREATE POLICY "Users can view company lookup lists"
ON public.lookup_lists AS RESTRICTIVE
FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid())));

-- Fix template_shifts SELECT policy
DROP POLICY IF EXISTS "Users can view company template shifts" ON public.template_shifts;
CREATE POLICY "Users can view company template shifts"
ON public.template_shifts AS RESTRICTIVE
FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid())));

-- Fix roster_categories SELECT policy
DROP POLICY IF EXISTS "Users can view company roster categories" ON public.roster_categories;
CREATE POLICY "Users can view company roster categories"
ON public.roster_categories AS RESTRICTIVE
FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid())));

-- Fix roster_staff_assignments SELECT policy
DROP POLICY IF EXISTS "Users can view company staff assignments" ON public.roster_staff_assignments;
CREATE POLICY "Users can view company staff assignments"
ON public.roster_staff_assignments AS RESTRICTIVE
FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid())));

-- Fix applied_roster_templates SELECT policy
DROP POLICY IF EXISTS "Users can view company applied templates" ON public.applied_roster_templates;
CREATE POLICY "Users can view company applied templates"
ON public.applied_roster_templates AS RESTRICTIVE
FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid())));

-- Fix career_history SELECT policy
DROP POLICY IF EXISTS "Users can view company career history" ON public.career_history;
CREATE POLICY "Users can view company career history"
ON public.career_history AS RESTRICTIVE
FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid())));

-- Fix address_history SELECT policy
DROP POLICY IF EXISTS "Users can view company address history" ON public.address_history;
CREATE POLICY "Users can view company address history"
ON public.address_history AS RESTRICTIVE
FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid())));

-- Fix job_roles SELECT policy
DROP POLICY IF EXISTS "Users can view company job roles" ON public.job_roles;
CREATE POLICY "Users can view company job roles"
ON public.job_roles AS RESTRICTIVE
FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid())));

-- Fix employee_job_roles SELECT policy
DROP POLICY IF EXISTS "Users can view company employee job roles" ON public.employee_job_roles;
CREATE POLICY "Users can view company employee job roles"
ON public.employee_job_roles AS RESTRICTIVE
FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid())));

-- Fix permissions SELECT policy
DROP POLICY IF EXISTS "Users can view company permissions" ON public.permissions;
CREATE POLICY "Users can view company permissions"
ON public.permissions AS RESTRICTIVE
FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid())));

-- Fix permission_groups SELECT policy
DROP POLICY IF EXISTS "Users can view company permission groups" ON public.permission_groups;
CREATE POLICY "Users can view company permission groups"
ON public.permission_groups AS RESTRICTIVE
FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid())));

-- Fix permission_group_permissions SELECT policy
DROP POLICY IF EXISTS "Users can view company group permissions" ON public.permission_group_permissions;
CREATE POLICY "Users can view company group permissions"
ON public.permission_group_permissions AS RESTRICTIVE
FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid())));

-- Fix processes SELECT policy
DROP POLICY IF EXISTS "Users can view company processes" ON public.processes;
CREATE POLICY "Users can view company processes"
ON public.processes AS RESTRICTIVE
FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid())));

-- Fix menu_sets SELECT policy
DROP POLICY IF EXISTS "Users can view company menu sets" ON public.menu_sets;
CREATE POLICY "Users can view company menu sets"
ON public.menu_sets AS RESTRICTIVE
FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid())));

-- Fix notification_templates SELECT policy
DROP POLICY IF EXISTS "Users can view company notification templates" ON public.notification_templates;
CREATE POLICY "Users can view company notification templates"
ON public.notification_templates AS RESTRICTIVE
FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid())));

-- Fix system_settings SELECT policy
DROP POLICY IF EXISTS "Users can view company system settings" ON public.system_settings;
CREATE POLICY "Users can view company system settings"
ON public.system_settings AS RESTRICTIVE
FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid())));

-- Fix bulk_position_rules SELECT policy
DROP POLICY IF EXISTS "Users can view company bulk position rules" ON public.bulk_position_rules;
CREATE POLICY "Users can view company bulk position rules"
ON public.bulk_position_rules AS RESTRICTIVE
FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid())));

-- Fix bulk_role_rules SELECT policy
DROP POLICY IF EXISTS "Users can view company bulk role rules" ON public.bulk_role_rules;
CREATE POLICY "Users can view company bulk role rules"
ON public.bulk_role_rules AS RESTRICTIVE
FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid())));
