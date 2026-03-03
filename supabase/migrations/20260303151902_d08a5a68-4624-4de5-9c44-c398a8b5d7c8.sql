
-- Create a function that auto-sets company_id from the user's profile on INSERT
CREATE OR REPLACE FUNCTION public.set_company_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    SELECT company_id INTO NEW.company_id
    FROM public.profiles
    WHERE id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- Apply the trigger to all tables with company_id
CREATE TRIGGER set_company_id_employees BEFORE INSERT ON public.employees FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
CREATE TRIGGER set_company_id_shifts BEFORE INSERT ON public.shifts FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
CREATE TRIGGER set_company_id_shift_templates BEFORE INSERT ON public.shift_templates FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
CREATE TRIGGER set_company_id_roster_templates BEFORE INSERT ON public.roster_templates FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
CREATE TRIGGER set_company_id_roster_categories BEFORE INSERT ON public.roster_categories FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
CREATE TRIGGER set_company_id_roster_staff_assignments BEFORE INSERT ON public.roster_staff_assignments FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
CREATE TRIGGER set_company_id_roster_template_assignments BEFORE INSERT ON public.roster_template_assignments FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
CREATE TRIGGER set_company_id_template_shifts BEFORE INSERT ON public.template_shifts FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
CREATE TRIGGER set_company_id_applied_roster_templates BEFORE INSERT ON public.applied_roster_templates FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
CREATE TRIGGER set_company_id_job_roles BEFORE INSERT ON public.job_roles FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
CREATE TRIGGER set_company_id_holiday_requests BEFORE INSERT ON public.holiday_requests FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
CREATE TRIGGER set_company_id_holiday_entitlement BEFORE INSERT ON public.holiday_entitlement FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
CREATE TRIGGER set_company_id_time_clock_records BEFORE INSERT ON public.time_clock_records FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
CREATE TRIGGER set_company_id_time_segments BEFORE INSERT ON public.time_segments FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
CREATE TRIGGER set_company_id_career_history BEFORE INSERT ON public.career_history FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
CREATE TRIGGER set_company_id_address_history BEFORE INSERT ON public.address_history FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
CREATE TRIGGER set_company_id_employee_job_roles BEFORE INSERT ON public.employee_job_roles FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
CREATE TRIGGER set_company_id_employee_drafts BEFORE INSERT ON public.employee_drafts FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
CREATE TRIGGER set_company_id_lookup_lists BEFORE INSERT ON public.lookup_lists FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
CREATE TRIGGER set_company_id_notification_templates BEFORE INSERT ON public.notification_templates FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
CREATE TRIGGER set_company_id_notifications BEFORE INSERT ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
CREATE TRIGGER set_company_id_positions BEFORE INSERT ON public.positions FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
CREATE TRIGGER set_company_id_processes BEFORE INSERT ON public.processes FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
CREATE TRIGGER set_company_id_menu_sets BEFORE INSERT ON public.menu_sets FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
CREATE TRIGGER set_company_id_email_logs BEFORE INSERT ON public.email_logs FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
CREATE TRIGGER set_company_id_system_settings BEFORE INSERT ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
CREATE TRIGGER set_company_id_permission_groups BEFORE INSERT ON public.permission_groups FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
CREATE TRIGGER set_company_id_permissions BEFORE INSERT ON public.permissions FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
CREATE TRIGGER set_company_id_permission_group_permissions BEFORE INSERT ON public.permission_group_permissions FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
CREATE TRIGGER set_company_id_bulk_position_rules BEFORE INSERT ON public.bulk_position_rules FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
CREATE TRIGGER set_company_id_bulk_role_rules BEFORE INSERT ON public.bulk_role_rules FOR EACH ROW EXECUTE FUNCTION public.set_company_id();

-- Also make company_id nullable again so the trigger can fill it
ALTER TABLE public.employees ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.shifts ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.shift_templates ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.roster_templates ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.roster_categories ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.roster_staff_assignments ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.roster_template_assignments ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.template_shifts ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.applied_roster_templates ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.job_roles ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.holiday_requests ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.holiday_entitlement ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.time_clock_records ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.time_segments ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.career_history ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.address_history ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.employee_job_roles ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.employee_drafts ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.lookup_lists ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.notification_templates ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.notifications ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.positions ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.processes ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.menu_sets ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.email_logs ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.system_settings ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.permission_groups ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.permissions ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.permission_group_permissions ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.bulk_position_rules ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.bulk_role_rules ALTER COLUMN company_id DROP NOT NULL;
