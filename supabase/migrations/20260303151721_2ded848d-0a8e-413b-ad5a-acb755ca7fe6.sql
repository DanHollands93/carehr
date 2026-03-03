
-- ============================================================
-- PHASE 5: Add company_id to ALL core tables for full tenant isolation
-- ============================================================

-- 1. ADD company_id COLUMN TO ALL TABLES (nullable first for backfill)
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.shift_templates ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.roster_templates ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.roster_categories ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.roster_staff_assignments ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.roster_template_assignments ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.template_shifts ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.applied_roster_templates ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.job_roles ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.holiday_requests ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.holiday_entitlement ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.time_clock_records ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.time_segments ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.career_history ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.address_history ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.employee_job_roles ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.employee_drafts ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.lookup_lists ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.notification_templates ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.positions ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.processes ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.menu_sets ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.permission_groups ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.permissions ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.permission_group_permissions ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.bulk_position_rules ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.bulk_role_rules ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 2. BACKFILL all existing rows to Demo company
UPDATE public.employees SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;
UPDATE public.shifts SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;
UPDATE public.shift_templates SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;
UPDATE public.roster_templates SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;
UPDATE public.roster_categories SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;
UPDATE public.roster_staff_assignments SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;
UPDATE public.roster_template_assignments SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;
UPDATE public.template_shifts SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;
UPDATE public.applied_roster_templates SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;
UPDATE public.job_roles SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;
UPDATE public.holiday_requests SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;
UPDATE public.holiday_entitlement SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;
UPDATE public.time_clock_records SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;
UPDATE public.time_segments SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;
UPDATE public.career_history SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;
UPDATE public.address_history SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;
UPDATE public.employee_job_roles SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;
UPDATE public.employee_drafts SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;
UPDATE public.lookup_lists SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;
UPDATE public.notification_templates SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;
UPDATE public.notifications SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;
UPDATE public.positions SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;
UPDATE public.processes SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;
UPDATE public.menu_sets SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;
UPDATE public.email_logs SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;
UPDATE public.system_settings SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;
UPDATE public.permission_groups SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;
UPDATE public.permissions SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;
UPDATE public.permission_group_permissions SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;
UPDATE public.bulk_position_rules SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;
UPDATE public.bulk_role_rules SET company_id = '9288cefd-a647-4220-9d9a-db4457075c3d' WHERE company_id IS NULL;

-- 3. SET NOT NULL on company_id for all tables
ALTER TABLE public.employees ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.shifts ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.shift_templates ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.roster_templates ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.roster_categories ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.roster_staff_assignments ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.roster_template_assignments ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.template_shifts ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.applied_roster_templates ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.job_roles ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.holiday_requests ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.holiday_entitlement ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.time_clock_records ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.time_segments ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.career_history ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.address_history ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.employee_job_roles ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.employee_drafts ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.lookup_lists ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.notification_templates ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.notifications ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.positions ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.processes ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.menu_sets ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.email_logs ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.system_settings ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.permission_groups ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.permissions ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.permission_group_permissions ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.bulk_position_rules ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.bulk_role_rules ALTER COLUMN company_id SET NOT NULL;

-- 4. ADD INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_employees_company ON public.employees(company_id);
CREATE INDEX IF NOT EXISTS idx_shifts_company ON public.shifts(company_id);
CREATE INDEX IF NOT EXISTS idx_shift_templates_company ON public.shift_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_roster_templates_company ON public.roster_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_roster_categories_company ON public.roster_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_job_roles_company ON public.job_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_holiday_requests_company ON public.holiday_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_time_clock_records_company ON public.time_clock_records(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_company ON public.notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_lookup_lists_company ON public.lookup_lists(company_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_company ON public.system_settings(company_id);

-- 5. DROP ALL EXISTING POLICIES AND RECREATE WITH COMPANY ISOLATION
-- Pattern: super_admins see all, others see only own company data

-- ===== employees =====
DROP POLICY IF EXISTS "Authenticated can view employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can update employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can delete employees" ON public.employees;

CREATE POLICY "Users can view company employees" ON public.employees FOR SELECT
USING (is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid()));

CREATE POLICY "Admins can insert company employees" ON public.employees FOR INSERT
WITH CHECK (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR user_has_permission(auth.uid(), 'edit_employees'))));

CREATE POLICY "Admins can update company employees" ON public.employees FOR UPDATE
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR user_has_permission(auth.uid(), 'edit_employees'))));

CREATE POLICY "Admins can delete company employees" ON public.employees FOR DELETE
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin')));

-- ===== shifts =====
DROP POLICY IF EXISTS "Authenticated can view shifts" ON public.shifts;
DROP POLICY IF EXISTS "Admins can manage shifts" ON public.shifts;

CREATE POLICY "Users can view company shifts" ON public.shifts FOR SELECT
USING (is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid()));

CREATE POLICY "Admins can manage company shifts" ON public.shifts FOR ALL
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR user_has_permission(auth.uid(), 'edit_roster'))));

-- ===== shift_templates =====
DROP POLICY IF EXISTS "Authenticated can view shift templates" ON public.shift_templates;
DROP POLICY IF EXISTS "Admins can manage shift templates" ON public.shift_templates;

CREATE POLICY "Users can view company shift templates" ON public.shift_templates FOR SELECT
USING (is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid()));

CREATE POLICY "Admins can manage company shift templates" ON public.shift_templates FOR ALL
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR user_has_permission(auth.uid(), 'edit_roster'))));

-- ===== roster_templates =====
DROP POLICY IF EXISTS "Authenticated can view roster templates" ON public.roster_templates;
DROP POLICY IF EXISTS "Admins can manage roster templates" ON public.roster_templates;

CREATE POLICY "Users can view company roster templates" ON public.roster_templates FOR SELECT
USING (is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid()));

CREATE POLICY "Admins can manage company roster templates" ON public.roster_templates FOR ALL
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR user_has_permission(auth.uid(), 'edit_roster'))));

-- ===== roster_categories =====
DROP POLICY IF EXISTS "Authenticated can view roster categories" ON public.roster_categories;
DROP POLICY IF EXISTS "Admins can manage roster categories" ON public.roster_categories;

CREATE POLICY "Users can view company roster categories" ON public.roster_categories FOR SELECT
USING (is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid()));

CREATE POLICY "Admins can manage company roster categories" ON public.roster_categories FOR ALL
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin')));

-- ===== roster_staff_assignments =====
DROP POLICY IF EXISTS "Authenticated can view staff assignments" ON public.roster_staff_assignments;
DROP POLICY IF EXISTS "Admins can manage staff assignments" ON public.roster_staff_assignments;

CREATE POLICY "Users can view company staff assignments" ON public.roster_staff_assignments FOR SELECT
USING (is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid()));

CREATE POLICY "Admins can manage company staff assignments" ON public.roster_staff_assignments FOR ALL
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR user_has_permission(auth.uid(), 'edit_roster'))));

-- ===== roster_template_assignments =====
DROP POLICY IF EXISTS "Authenticated can view roster assignments" ON public.roster_template_assignments;
DROP POLICY IF EXISTS "Admins can manage roster assignments" ON public.roster_template_assignments;

CREATE POLICY "Users can view company roster assignments" ON public.roster_template_assignments FOR SELECT
USING (is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid()));

CREATE POLICY "Admins can manage company roster assignments" ON public.roster_template_assignments FOR ALL
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR user_has_permission(auth.uid(), 'edit_roster'))));

-- ===== template_shifts =====
DROP POLICY IF EXISTS "Authenticated can view template shifts" ON public.template_shifts;
DROP POLICY IF EXISTS "Admins can manage template shifts" ON public.template_shifts;

CREATE POLICY "Users can view company template shifts" ON public.template_shifts FOR SELECT
USING (is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid()));

CREATE POLICY "Admins can manage company template shifts" ON public.template_shifts FOR ALL
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR user_has_permission(auth.uid(), 'edit_roster'))));

-- ===== applied_roster_templates =====
DROP POLICY IF EXISTS "Authenticated can view applied templates" ON public.applied_roster_templates;
DROP POLICY IF EXISTS "Admins can manage applied templates" ON public.applied_roster_templates;

CREATE POLICY "Users can view company applied templates" ON public.applied_roster_templates FOR SELECT
USING (is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid()));

CREATE POLICY "Admins can manage company applied templates" ON public.applied_roster_templates FOR ALL
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR user_has_permission(auth.uid(), 'edit_roster'))));

-- ===== job_roles =====
DROP POLICY IF EXISTS "Authenticated can view job roles" ON public.job_roles;
DROP POLICY IF EXISTS "Admins can manage job roles" ON public.job_roles;

CREATE POLICY "Users can view company job roles" ON public.job_roles FOR SELECT
USING (is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid()));

CREATE POLICY "Admins can manage company job roles" ON public.job_roles FOR ALL
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin')));

-- ===== holiday_requests =====
DROP POLICY IF EXISTS "Users can view own holiday requests" ON public.holiday_requests;
DROP POLICY IF EXISTS "Users can submit holiday requests" ON public.holiday_requests;
DROP POLICY IF EXISTS "Admins can view all holiday requests" ON public.holiday_requests;
DROP POLICY IF EXISTS "Admins can manage holiday requests" ON public.holiday_requests;

CREATE POLICY "Users can view own holiday requests" ON public.holiday_requests FOR SELECT
USING (employee_id = current_user_employee_id());

CREATE POLICY "Admins can view company holiday requests" ON public.holiday_requests FOR SELECT
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin')));

CREATE POLICY "Users can submit company holiday requests" ON public.holiday_requests FOR INSERT
WITH CHECK (company_id = user_company_id(auth.uid()) AND employee_id = current_user_employee_id());

CREATE POLICY "Admins can manage company holiday requests" ON public.holiday_requests FOR ALL
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin')));

-- ===== holiday_entitlement =====
DROP POLICY IF EXISTS "Users can view own entitlement" ON public.holiday_entitlement;
DROP POLICY IF EXISTS "Admins can manage entitlement" ON public.holiday_entitlement;

CREATE POLICY "Users can view own entitlement" ON public.holiday_entitlement FOR SELECT
USING (employee_id = current_user_employee_id());

CREATE POLICY "Admins can manage company entitlement" ON public.holiday_entitlement FOR ALL
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin')));

-- ===== time_clock_records =====
DROP POLICY IF EXISTS "Users can view own time records" ON public.time_clock_records;
DROP POLICY IF EXISTS "Users can insert own time records" ON public.time_clock_records;
DROP POLICY IF EXISTS "Users can update own time records" ON public.time_clock_records;
DROP POLICY IF EXISTS "Admins can manage time records" ON public.time_clock_records;

CREATE POLICY "Users can view own time records" ON public.time_clock_records FOR SELECT
USING (employee_id = current_user_employee_id());

CREATE POLICY "Users can insert own time records" ON public.time_clock_records FOR INSERT
WITH CHECK (company_id = user_company_id(auth.uid()) AND employee_id = current_user_employee_id());

CREATE POLICY "Users can update own time records" ON public.time_clock_records FOR UPDATE
USING (employee_id = current_user_employee_id());

CREATE POLICY "Admins can manage company time records" ON public.time_clock_records FOR ALL
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin')));

-- ===== time_segments =====
DROP POLICY IF EXISTS "Admins can manage time segments" ON public.time_segments;

CREATE POLICY "Admins can manage company time segments" ON public.time_segments FOR ALL
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin')));

-- ===== career_history =====
DROP POLICY IF EXISTS "Authenticated can view career history" ON public.career_history;
DROP POLICY IF EXISTS "Admins can manage career history" ON public.career_history;

CREATE POLICY "Users can view company career history" ON public.career_history FOR SELECT
USING (is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid()));

CREATE POLICY "Admins can manage company career history" ON public.career_history FOR ALL
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR user_has_permission(auth.uid(), 'edit_employees'))));

-- ===== address_history =====
DROP POLICY IF EXISTS "Authenticated can view address history" ON public.address_history;
DROP POLICY IF EXISTS "Admins can manage address history" ON public.address_history;

CREATE POLICY "Users can view company address history" ON public.address_history FOR SELECT
USING (is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid()));

CREATE POLICY "Admins can manage company address history" ON public.address_history FOR ALL
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR user_has_permission(auth.uid(), 'edit_employees'))));

-- ===== employee_job_roles =====
DROP POLICY IF EXISTS "Authenticated can view employee job roles" ON public.employee_job_roles;
DROP POLICY IF EXISTS "Admins can manage employee job roles" ON public.employee_job_roles;

CREATE POLICY "Users can view company employee job roles" ON public.employee_job_roles FOR SELECT
USING (is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid()));

CREATE POLICY "Admins can manage company employee job roles" ON public.employee_job_roles FOR ALL
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin')));

-- ===== employee_drafts =====
DROP POLICY IF EXISTS "Admins can manage drafts" ON public.employee_drafts;

CREATE POLICY "Admins can manage company drafts" ON public.employee_drafts FOR ALL
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin')));

-- ===== lookup_lists =====
DROP POLICY IF EXISTS "Authenticated can view lookup lists" ON public.lookup_lists;
DROP POLICY IF EXISTS "Admins can manage lookup lists" ON public.lookup_lists;

CREATE POLICY "Users can view company lookup lists" ON public.lookup_lists FOR SELECT
USING (is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid()));

CREATE POLICY "Admins can manage company lookup lists" ON public.lookup_lists FOR ALL
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin')));

-- ===== notification_templates =====
DROP POLICY IF EXISTS "Authenticated can view notification templates" ON public.notification_templates;
DROP POLICY IF EXISTS "Admins can manage notification templates" ON public.notification_templates;

CREATE POLICY "Users can view company notification templates" ON public.notification_templates FOR SELECT
USING (is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid()));

CREATE POLICY "Admins can manage company notification templates" ON public.notification_templates FOR ALL
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin')));

-- ===== notifications =====
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage company notifications" ON public.notifications FOR ALL
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin')));

CREATE POLICY "Users can insert company notifications" ON public.notifications FOR INSERT
WITH CHECK (company_id = user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR user_id = auth.uid()));

-- ===== positions =====
DROP POLICY IF EXISTS "Authenticated can view positions" ON public.positions;
DROP POLICY IF EXISTS "Admins can manage positions" ON public.positions;

CREATE POLICY "Users can view company positions" ON public.positions FOR SELECT
USING (is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid()));

CREATE POLICY "Admins can manage company positions" ON public.positions FOR ALL
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin')));

-- ===== processes =====
DROP POLICY IF EXISTS "Authenticated can view processes" ON public.processes;
DROP POLICY IF EXISTS "Admins can manage processes" ON public.processes;

CREATE POLICY "Users can view company processes" ON public.processes FOR SELECT
USING (is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid()));

CREATE POLICY "Admins can manage company processes" ON public.processes FOR ALL
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin')));

-- ===== menu_sets =====
DROP POLICY IF EXISTS "Authenticated can view menu sets" ON public.menu_sets;
DROP POLICY IF EXISTS "Admins can manage menu sets" ON public.menu_sets;

CREATE POLICY "Users can view company menu sets" ON public.menu_sets FOR SELECT
USING (is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid()));

CREATE POLICY "Admins can manage company menu sets" ON public.menu_sets FOR ALL
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin')));

-- ===== email_logs =====
DROP POLICY IF EXISTS "Admins can view email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Admins can manage email logs" ON public.email_logs;

CREATE POLICY "Admins can view company email logs" ON public.email_logs FOR SELECT
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin')));

CREATE POLICY "Admins can manage company email logs" ON public.email_logs FOR ALL
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin')));

-- ===== system_settings =====
DROP POLICY IF EXISTS "Authenticated can view system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;

CREATE POLICY "Users can view company system settings" ON public.system_settings FOR SELECT
USING (is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid()));

CREATE POLICY "Admins can manage company system settings" ON public.system_settings FOR ALL
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin')));

-- ===== permission_groups =====
DROP POLICY IF EXISTS "Authenticated can view permission groups" ON public.permission_groups;
DROP POLICY IF EXISTS "Admins can manage permission groups" ON public.permission_groups;

CREATE POLICY "Users can view company permission groups" ON public.permission_groups FOR SELECT
USING (is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid()));

CREATE POLICY "Admins can manage company permission groups" ON public.permission_groups FOR ALL
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin')));

-- ===== permissions =====
DROP POLICY IF EXISTS "Authenticated can view permissions" ON public.permissions;
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.permissions;

CREATE POLICY "Users can view company permissions" ON public.permissions FOR SELECT
USING (is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid()));

CREATE POLICY "Admins can manage company permissions" ON public.permissions FOR ALL
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin')));

-- ===== permission_group_permissions =====
DROP POLICY IF EXISTS "Authenticated can view group permissions" ON public.permission_group_permissions;
DROP POLICY IF EXISTS "Admins can manage group permissions" ON public.permission_group_permissions;

CREATE POLICY "Users can view company group permissions" ON public.permission_group_permissions FOR SELECT
USING (is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid()));

CREATE POLICY "Admins can manage company group permissions" ON public.permission_group_permissions FOR ALL
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin')));

-- ===== bulk_position_rules =====
DROP POLICY IF EXISTS "Authenticated can view bulk position rules" ON public.bulk_position_rules;
DROP POLICY IF EXISTS "Admins can manage bulk position rules" ON public.bulk_position_rules;

CREATE POLICY "Users can view company bulk position rules" ON public.bulk_position_rules FOR SELECT
USING (is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid()));

CREATE POLICY "Admins can manage company bulk position rules" ON public.bulk_position_rules FOR ALL
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin')));

-- ===== bulk_role_rules =====
DROP POLICY IF EXISTS "Authenticated can view bulk role rules" ON public.bulk_role_rules;
DROP POLICY IF EXISTS "Admins can manage bulk role rules" ON public.bulk_role_rules;

CREATE POLICY "Users can view company bulk role rules" ON public.bulk_role_rules FOR SELECT
USING (is_super_admin(auth.uid()) OR company_id = user_company_id(auth.uid()));

CREATE POLICY "Admins can manage company bulk role rules" ON public.bulk_role_rules FOR ALL
USING (is_super_admin(auth.uid()) OR (company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin')));
