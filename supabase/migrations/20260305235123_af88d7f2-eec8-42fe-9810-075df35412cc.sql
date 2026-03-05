
-- Create audit_logs table for system-wide change tracking
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id text NOT NULL,
  action text NOT NULL, -- INSERT, UPDATE, DELETE
  old_data jsonb,
  new_data jsonb,
  changed_fields text[],
  performed_by uuid,
  performed_at timestamp with time zone NOT NULL DEFAULT now(),
  company_id uuid REFERENCES public.companies(id),
  ip_address text,
  notes text
);

-- Index for efficient querying
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_performed_at ON public.audit_logs(performed_at DESC);
CREATE INDEX idx_audit_logs_performed_by ON public.audit_logs(performed_by);
CREATE INDEX idx_audit_logs_company_id ON public.audit_logs(company_id);
CREATE INDEX idx_audit_logs_record_id ON public.audit_logs(record_id);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS: Admins can view company audit logs
CREATE POLICY "Admins can view company audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  is_super_admin(auth.uid()) OR (
    company_id = user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role)
  )
);

-- RLS: Allow inserts from trigger (security definer function)
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Auto-set company_id trigger
CREATE TRIGGER set_audit_logs_company_id
  BEFORE INSERT ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _old_data jsonb;
  _new_data jsonb;
  _changed text[];
  _record_id text;
  _company_id uuid;
  _key text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _old_data := to_jsonb(OLD);
    _new_data := NULL;
    _record_id := OLD.id::text;
    _company_id := CASE WHEN TG_TABLE_NAME != 'companies' THEN OLD.company_id ELSE OLD.id END;
  ELSIF TG_OP = 'INSERT' THEN
    _old_data := NULL;
    _new_data := to_jsonb(NEW);
    _record_id := NEW.id::text;
    _company_id := CASE WHEN TG_TABLE_NAME != 'companies' THEN NEW.company_id ELSE NEW.id END;
  ELSIF TG_OP = 'UPDATE' THEN
    _old_data := to_jsonb(OLD);
    _new_data := to_jsonb(NEW);
    _record_id := NEW.id::text;
    _company_id := CASE WHEN TG_TABLE_NAME != 'companies' THEN NEW.company_id ELSE NEW.id END;
    -- Calculate changed fields
    _changed := ARRAY(
      SELECT key FROM jsonb_each(_new_data) AS n(key, value)
      WHERE n.value IS DISTINCT FROM (_old_data -> n.key)
      AND n.key NOT IN ('updated_at', 'created_at')
    );
    -- Skip if nothing meaningful changed
    IF array_length(_changed, 1) IS NULL THEN
      RETURN NEW;
    END IF;
  END IF;

  INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, changed_fields, performed_by, company_id)
  VALUES (TG_TABLE_NAME, _record_id, TG_OP, _old_data, _new_data, _changed, auth.uid(), _company_id);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Attach audit triggers to all core tables
CREATE TRIGGER audit_employees AFTER INSERT OR UPDATE OR DELETE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_shifts AFTER INSERT OR UPDATE OR DELETE ON public.shifts FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_time_clock_records AFTER INSERT OR UPDATE OR DELETE ON public.time_clock_records FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_time_segments AFTER INSERT OR UPDATE OR DELETE ON public.time_segments FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_holiday_requests AFTER INSERT OR UPDATE OR DELETE ON public.holiday_requests FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_holiday_entitlement AFTER INSERT OR UPDATE OR DELETE ON public.holiday_entitlement FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_career_history AFTER INSERT OR UPDATE OR DELETE ON public.career_history FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_job_roles AFTER INSERT OR UPDATE OR DELETE ON public.job_roles FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_employee_job_roles AFTER INSERT OR UPDATE OR DELETE ON public.employee_job_roles FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_roster_templates AFTER INSERT OR UPDATE OR DELETE ON public.roster_templates FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_shift_templates AFTER INSERT OR UPDATE OR DELETE ON public.shift_templates FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_permissions AFTER INSERT OR UPDATE OR DELETE ON public.permissions FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_permission_groups AFTER INSERT OR UPDATE OR DELETE ON public.permission_groups FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_profiles AFTER INSERT OR UPDATE OR DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_companies AFTER INSERT OR UPDATE OR DELETE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_company_settings AFTER INSERT OR UPDATE OR DELETE ON public.company_settings FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_notification_templates AFTER INSERT OR UPDATE OR DELETE ON public.notification_templates FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_notifications AFTER INSERT OR UPDATE OR DELETE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_roster_categories AFTER INSERT OR UPDATE OR DELETE ON public.roster_categories FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_roster_staff_assignments AFTER INSERT OR UPDATE OR DELETE ON public.roster_staff_assignments FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_template_shifts AFTER INSERT OR UPDATE OR DELETE ON public.template_shifts FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_address_history AFTER INSERT OR UPDATE OR DELETE ON public.address_history FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_lookup_lists AFTER INSERT OR UPDATE OR DELETE ON public.lookup_lists FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_menu_sets AFTER INSERT OR UPDATE OR DELETE ON public.menu_sets FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_processes AFTER INSERT OR UPDATE OR DELETE ON public.processes FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
