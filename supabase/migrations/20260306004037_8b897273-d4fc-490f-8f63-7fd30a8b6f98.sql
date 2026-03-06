
-- Add audit triggers to all tables that are missing them
CREATE TRIGGER audit_system_settings
  AFTER INSERT OR UPDATE OR DELETE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_applied_roster_templates
  AFTER INSERT OR UPDATE OR DELETE ON public.applied_roster_templates
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_bulk_position_rules
  AFTER INSERT OR UPDATE OR DELETE ON public.bulk_position_rules
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_bulk_role_rules
  AFTER INSERT OR UPDATE OR DELETE ON public.bulk_role_rules
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_company_modules
  AFTER INSERT OR UPDATE OR DELETE ON public.company_modules
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_employee_drafts
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_drafts
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_permission_group_permissions
  AFTER INSERT OR UPDATE OR DELETE ON public.permission_group_permissions
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_positions
  AFTER INSERT OR UPDATE OR DELETE ON public.positions
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_roster_template_assignments
  AFTER INSERT OR UPDATE OR DELETE ON public.roster_template_assignments
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_user_location_permissions
  AFTER INSERT OR UPDATE OR DELETE ON public.user_location_permissions
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_user_menu_overrides
  AFTER INSERT OR UPDATE OR DELETE ON public.user_menu_overrides
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_user_permissions
  AFTER INSERT OR UPDATE OR DELETE ON public.user_permissions
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_user_role_assignments
  AFTER INSERT OR UPDATE OR DELETE ON public.user_role_assignments
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
