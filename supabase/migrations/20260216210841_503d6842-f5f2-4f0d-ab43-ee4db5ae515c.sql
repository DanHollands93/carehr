
-- =============================================
-- COMPREHENSIVE DATABASE SCHEMA MIGRATION
-- =============================================

-- 1. Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'hr_user');

-- 2. EMPLOYEES table
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT,
  date_of_birth TEXT,
  department TEXT DEFAULT '',
  hire_date TEXT,
  job_title TEXT,
  location TEXT,
  pay_rate NUMERIC,
  pay_type TEXT,
  employment_type TEXT,
  national_insurance_number TEXT,
  tax_code TEXT,
  passport_number TEXT,
  visa_expiry TEXT,
  right_to_work_status TEXT,
  address JSONB DEFAULT '{}',
  emergency_contact JSONB DEFAULT '{}',
  bank_details JSONB DEFAULT '{}',
  profile_picture TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. PROFILES table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. USER_ROLES table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- 5. CAREER_HISTORY table
CREATE TABLE IF NOT EXISTS public.career_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  start_date TEXT,
  end_date TEXT,
  pay_rate NUMERIC DEFAULT 0,
  pay_type TEXT DEFAULT 'hourly',
  employment_type TEXT DEFAULT 'permanent',
  contract_type TEXT DEFAULT 'full_time',
  hours_per_week NUMERIC DEFAULT 40,
  probation_end_date TEXT,
  notice_period_weeks INTEGER DEFAULT 4,
  currency TEXT DEFAULT 'GBP',
  job_role_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. ADDRESS_HISTORY table
CREATE TABLE IF NOT EXISTS public.address_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  line_1 TEXT NOT NULL DEFAULT '',
  line_2 TEXT,
  city TEXT NOT NULL DEFAULT '',
  postcode TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'United Kingdom',
  start_date TEXT NOT NULL DEFAULT '',
  end_date TEXT,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. JOB_ROLES table
CREATE TABLE IF NOT EXISTS public.job_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT DEFAULT '',
  location TEXT DEFAULT '',
  pay_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. EMPLOYEE_JOB_ROLES table
CREATE TABLE IF NOT EXISTS public.employee_job_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  job_role_id UUID NOT NULL REFERENCES public.job_roles(id) ON DELETE CASCADE,
  pay_rate NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'GBP',
  is_primary BOOLEAN DEFAULT false,
  start_date TEXT,
  end_date TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. POSITIONS table
CREATE TABLE IF NOT EXISTS public.positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. HOLIDAY_REQUESTS table
CREATE TABLE IF NOT EXISTS public.holiday_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ DEFAULT now(),
  approved_by UUID,
  approval_date TIMESTAMPTZ,
  comments TEXT,
  hours_requested NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. HOLIDAY_ENTITLEMENT table
CREATE TABLE IF NOT EXISTS public.holiday_entitlement (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  total_hours NUMERIC DEFAULT 0,
  used_hours NUMERIC DEFAULT 0,
  remaining_hours NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. EMPLOYEE_DRAFTS table
CREATE TABLE IF NOT EXISTS public.employee_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. LOOKUP_LISTS table
CREATE TABLE IF NOT EXISTS public.lookup_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  value TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. SHIFT_TEMPLATES table
CREATE TABLE IF NOT EXISTS public.shift_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  position TEXT DEFAULT '',
  pay_value NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. ROSTER_TEMPLATES table
CREATE TABLE IF NOT EXISTS public.roster_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  repeat_type TEXT DEFAULT 'weekly',
  repeat_interval INTEGER DEFAULT 1,
  start_date TEXT,
  end_date TEXT,
  is_active BOOLEAN DEFAULT true,
  category_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. ROSTER_TEMPLATE_ASSIGNMENTS table
CREATE TABLE IF NOT EXISTS public.roster_template_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roster_template_id UUID NOT NULL REFERENCES public.roster_templates(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 17. APPLIED_ROSTER_TEMPLATES table
CREATE TABLE IF NOT EXISTS public.applied_roster_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roster_template_id UUID NOT NULL REFERENCES public.roster_templates(id) ON DELETE CASCADE,
  applied_date TEXT NOT NULL,
  applied_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 18. TEMPLATE_SHIFTS table
CREATE TABLE IF NOT EXISTS public.template_shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roster_template_id UUID NOT NULL REFERENCES public.roster_templates(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  day_index INTEGER NOT NULL DEFAULT 0,
  shift_template_id UUID REFERENCES public.shift_templates(id) ON DELETE SET NULL,
  job_role_id UUID REFERENCES public.job_roles(id) ON DELETE SET NULL,
  pay_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 19. SHIFTS table
CREATE TABLE IF NOT EXISTS public.shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  position TEXT DEFAULT '',
  job_role_id UUID REFERENCES public.job_roles(id) ON DELETE SET NULL,
  actual_job_role_id UUID REFERENCES public.job_roles(id) ON DELETE SET NULL,
  pay_rate NUMERIC DEFAULT 0,
  roster_template_id UUID REFERENCES public.roster_templates(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 20. ROSTER_CATEGORIES table
CREATE TABLE IF NOT EXISTS public.roster_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  department TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 21. ROSTER_STAFF_ASSIGNMENTS table
CREATE TABLE IF NOT EXISTS public.roster_staff_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roster_category_id UUID NOT NULL REFERENCES public.roster_categories(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 22. TIME_CLOCK_RECORDS table
CREATE TABLE IF NOT EXISTS public.time_clock_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL,
  shift_date TEXT,
  shift_start_time TEXT,
  shift_end_time TEXT,
  clock_in_time TIMESTAMPTZ,
  clock_out_time TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled',
  discrepancy_type TEXT,
  approved_by UUID,
  approval_status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 23. TIME_SEGMENTS table
CREATE TABLE IF NOT EXISTS public.time_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  time_clock_record_id UUID NOT NULL REFERENCES public.time_clock_records(id) ON DELETE CASCADE,
  segment_type TEXT NOT NULL DEFAULT 'regular',
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  hours NUMERIC DEFAULT 0,
  pay_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 24. PERMISSIONS table
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 25. USER_PERMISSIONS table (direct overrides)
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  location TEXT,
  override_type TEXT DEFAULT 'grant',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 26. USER_LOCATION_PERMISSIONS table
CREATE TABLE IF NOT EXISTS public.user_location_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 27. PERMISSION_GROUPS table
CREATE TABLE IF NOT EXISTS public.permission_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 28. PERMISSION_GROUP_PERMISSIONS table
CREATE TABLE IF NOT EXISTS public.permission_group_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  permission_group_id UUID NOT NULL REFERENCES public.permission_groups(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 29. USER_ROLE_ASSIGNMENTS table
CREATE TABLE IF NOT EXISTS public.user_role_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_group_id UUID NOT NULL REFERENCES public.permission_groups(id) ON DELETE CASCADE,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  assigned_by UUID,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 30. USER_MENU_OVERRIDES table
CREATE TABLE IF NOT EXISTS public.user_menu_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  menu_key TEXT NOT NULL,
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 31. BULK_ROLE_RULES table
CREATE TABLE IF NOT EXISTS public.bulk_role_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_role TEXT NOT NULL,
  permission_group_id UUID NOT NULL REFERENCES public.permission_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 32. BULK_POSITION_RULES table
CREATE TABLE IF NOT EXISTS public.bulk_position_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  position TEXT NOT NULL,
  permission_group_id UUID NOT NULL REFERENCES public.permission_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 33. NOTIFICATIONS table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  category TEXT DEFAULT 'general',
  read BOOLEAN DEFAULT false,
  seen_at TIMESTAMPTZ,
  marked_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 34. NOTIFICATION_TEMPLATES table
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  category TEXT DEFAULT 'general',
  trigger_event TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 35. PROCESSES table
CREATE TABLE IF NOT EXISTS public.processes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  type TEXT DEFAULT 'form',
  menu_set_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 36. MENU_SETS table
CREATE TABLE IF NOT EXISTS public.menu_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 37. EMAIL_LOGS table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMPTZ DEFAULT now(),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 38. SYSTEM_SETTINGS table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =============================================

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.address_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_job_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holiday_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holiday_entitlement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lookup_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roster_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roster_template_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applied_roster_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roster_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roster_staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_clock_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_location_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_group_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_menu_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_role_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_position_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY DEFINER FUNCTIONS
-- =============================================

-- has_role function (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- user_has_permission function
CREATE OR REPLACE FUNCTION public.user_has_permission(_user_id UUID, _permission_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Check direct grants
    SELECT 1 FROM public.user_permissions up
    JOIN public.permissions p ON p.id = up.permission_id
    WHERE up.user_id = _user_id AND p.name = _permission_name AND up.override_type = 'grant'
    UNION ALL
    -- Check role-based permissions
    SELECT 1 FROM public.user_role_assignments ura
    JOIN public.permission_group_permissions pgp ON pgp.permission_group_id = ura.permission_group_id
    JOIN public.permissions p ON p.id = pgp.permission_id
    WHERE ura.user_id = _user_id AND ura.is_active = true AND p.name = _permission_name
  )
  AND NOT EXISTS (
    -- Check for denials
    SELECT 1 FROM public.user_permissions up
    JOIN public.permissions p ON p.id = up.permission_id
    WHERE up.user_id = _user_id AND p.name = _permission_name AND up.override_type = 'deny'
  )
$$;

-- user_has_location_access function
CREATE OR REPLACE FUNCTION public.user_has_location_access(_user_id UUID, _location TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_location_permissions
    WHERE user_id = _user_id AND location = _location
  )
$$;

-- current_user_employee_id function
CREATE OR REPLACE FUNCTION public.current_user_employee_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT employee_id FROM public.profiles WHERE id = auth.uid()
$$;

-- user_can_view_employees function
CREATE OR REPLACE FUNCTION public.user_can_view_employees(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin') OR public.user_has_permission(_user_id, 'view_employees')
$$;

-- user_can_edit_employees function
CREATE OR REPLACE FUNCTION public.user_can_edit_employees(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin') OR public.user_has_permission(_user_id, 'edit_employees')
$$;

-- get_effective_user_permissions function
CREATE OR REPLACE FUNCTION public.get_effective_user_permissions(p_user_id UUID)
RETURNS TABLE (
  permission_name TEXT,
  permission_category TEXT,
  location TEXT,
  source TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Role-based permissions
  SELECT DISTINCT
    p.name AS permission_name,
    p.category AS permission_category,
    COALESCE(pgp.location, ura.location) AS location,
    'role'::TEXT AS source
  FROM public.user_role_assignments ura
  JOIN public.permission_group_permissions pgp ON pgp.permission_group_id = ura.permission_group_id
  JOIN public.permissions p ON p.id = pgp.permission_id
  WHERE ura.user_id = p_user_id AND ura.is_active = true
  
  UNION
  
  -- Direct grants
  SELECT DISTINCT
    p.name AS permission_name,
    p.category AS permission_category,
    up.location AS location,
    'override'::TEXT AS source
  FROM public.user_permissions up
  JOIN public.permissions p ON p.id = up.permission_id
  WHERE up.user_id = p_user_id AND up.override_type = 'grant'
  
  EXCEPT
  
  -- Remove denials
  SELECT DISTINCT
    p.name AS permission_name,
    p.category AS permission_category,
    up.location AS location,
    'override'::TEXT AS source
  FROM public.user_permissions up
  JOIN public.permissions p ON p.id = up.permission_id
  WHERE up.user_id = p_user_id AND up.override_type = 'deny'
$$;

-- user_has_effective_permission function
CREATE OR REPLACE FUNCTION public.user_has_effective_permission(p_user_id UUID, p_permission_name TEXT, p_location TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.get_effective_user_permissions(p_user_id) ep
    WHERE ep.permission_name = p_permission_name
    AND (p_location IS NULL OR ep.location IS NULL OR ep.location = p_location)
  )
$$;

-- assign_default_permissions_to_user function
CREATE OR REPLACE FUNCTION public.assign_default_permissions_to_user(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_group_id UUID;
BEGIN
  SELECT id INTO default_group_id FROM public.permission_groups WHERE name = 'Default User' AND is_active = true LIMIT 1;
  IF default_group_id IS NOT NULL THEN
    INSERT INTO public.user_role_assignments (user_id, permission_group_id, is_active)
    VALUES (_user_id, default_group_id, true)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

-- =============================================
-- TRIGGER: handle_new_user (auto-create profile on signup)
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  
  -- Assign default permissions
  PERFORM public.assign_default_permissions_to_user(NEW.id);
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- RLS POLICIES
-- =============================================

-- PROFILES policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Profiles insert on signup" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Service role profiles insert" ON public.profiles FOR INSERT TO service_role WITH CHECK (true);

-- USER_ROLES policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- EMPLOYEES policies
CREATE POLICY "Authenticated can view employees" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert employees" ON public.employees FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.user_has_permission(auth.uid(), 'edit_employees'));
CREATE POLICY "Admins can update employees" ON public.employees FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.user_has_permission(auth.uid(), 'edit_employees'));
CREATE POLICY "Admins can delete employees" ON public.employees FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- CAREER_HISTORY policies
CREATE POLICY "Authenticated can view career history" ON public.career_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage career history" ON public.career_history FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.user_has_permission(auth.uid(), 'edit_employees'));

-- ADDRESS_HISTORY policies
CREATE POLICY "Authenticated can view address history" ON public.address_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage address history" ON public.address_history FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.user_has_permission(auth.uid(), 'edit_employees'));

-- JOB_ROLES policies
CREATE POLICY "Authenticated can view job roles" ON public.job_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage job roles" ON public.job_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- EMPLOYEE_JOB_ROLES policies
CREATE POLICY "Authenticated can view employee job roles" ON public.employee_job_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage employee job roles" ON public.employee_job_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- POSITIONS policies
CREATE POLICY "Authenticated can view positions" ON public.positions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage positions" ON public.positions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- HOLIDAY_REQUESTS policies
CREATE POLICY "Users can view own holiday requests" ON public.holiday_requests FOR SELECT TO authenticated USING (employee_id = public.current_user_employee_id());
CREATE POLICY "Admins can view all holiday requests" ON public.holiday_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can submit holiday requests" ON public.holiday_requests FOR INSERT TO authenticated WITH CHECK (employee_id = public.current_user_employee_id());
CREATE POLICY "Admins can manage holiday requests" ON public.holiday_requests FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- HOLIDAY_ENTITLEMENT policies
CREATE POLICY "Users can view own entitlement" ON public.holiday_entitlement FOR SELECT TO authenticated USING (employee_id = public.current_user_employee_id());
CREATE POLICY "Admins can manage entitlement" ON public.holiday_entitlement FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- EMPLOYEE_DRAFTS policies
CREATE POLICY "Admins can manage drafts" ON public.employee_drafts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- LOOKUP_LISTS policies
CREATE POLICY "Authenticated can view lookup lists" ON public.lookup_lists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage lookup lists" ON public.lookup_lists FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- SHIFT_TEMPLATES policies
CREATE POLICY "Authenticated can view shift templates" ON public.shift_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage shift templates" ON public.shift_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.user_has_permission(auth.uid(), 'edit_roster'));

-- ROSTER_TEMPLATES policies
CREATE POLICY "Authenticated can view roster templates" ON public.roster_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage roster templates" ON public.roster_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.user_has_permission(auth.uid(), 'edit_roster'));

-- ROSTER_TEMPLATE_ASSIGNMENTS policies
CREATE POLICY "Authenticated can view roster assignments" ON public.roster_template_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage roster assignments" ON public.roster_template_assignments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.user_has_permission(auth.uid(), 'edit_roster'));

-- APPLIED_ROSTER_TEMPLATES policies
CREATE POLICY "Authenticated can view applied templates" ON public.applied_roster_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage applied templates" ON public.applied_roster_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.user_has_permission(auth.uid(), 'edit_roster'));

-- TEMPLATE_SHIFTS policies
CREATE POLICY "Authenticated can view template shifts" ON public.template_shifts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage template shifts" ON public.template_shifts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.user_has_permission(auth.uid(), 'edit_roster'));

-- SHIFTS policies
CREATE POLICY "Authenticated can view shifts" ON public.shifts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage shifts" ON public.shifts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.user_has_permission(auth.uid(), 'edit_roster'));

-- ROSTER_CATEGORIES policies
CREATE POLICY "Authenticated can view roster categories" ON public.roster_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage roster categories" ON public.roster_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ROSTER_STAFF_ASSIGNMENTS policies
CREATE POLICY "Authenticated can view staff assignments" ON public.roster_staff_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage staff assignments" ON public.roster_staff_assignments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.user_has_permission(auth.uid(), 'edit_roster'));

-- TIME_CLOCK_RECORDS policies
CREATE POLICY "Users can view own time records" ON public.time_clock_records FOR SELECT TO authenticated USING (employee_id = public.current_user_employee_id());
CREATE POLICY "Users can update own time records" ON public.time_clock_records FOR UPDATE TO authenticated USING (employee_id = public.current_user_employee_id());
CREATE POLICY "Users can insert own time records" ON public.time_clock_records FOR INSERT TO authenticated WITH CHECK (employee_id = public.current_user_employee_id());
CREATE POLICY "Admins can manage time records" ON public.time_clock_records FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- TIME_SEGMENTS policies
CREATE POLICY "Admins can manage time segments" ON public.time_segments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- PERMISSIONS policies
CREATE POLICY "Authenticated can view permissions" ON public.permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage permissions" ON public.permissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- USER_PERMISSIONS policies
CREATE POLICY "Users can view own permissions" ON public.user_permissions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage user permissions" ON public.user_permissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- USER_LOCATION_PERMISSIONS policies
CREATE POLICY "Users can view own location permissions" ON public.user_location_permissions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage location permissions" ON public.user_location_permissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- PERMISSION_GROUPS policies
CREATE POLICY "Authenticated can view permission groups" ON public.permission_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage permission groups" ON public.permission_groups FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- PERMISSION_GROUP_PERMISSIONS policies
CREATE POLICY "Authenticated can view group permissions" ON public.permission_group_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage group permissions" ON public.permission_group_permissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- USER_ROLE_ASSIGNMENTS policies
CREATE POLICY "Users can view own role assignments" ON public.user_role_assignments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage role assignments" ON public.user_role_assignments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- USER_MENU_OVERRIDES policies
CREATE POLICY "Users can view own menu overrides" ON public.user_menu_overrides FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage menu overrides" ON public.user_menu_overrides FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- BULK_ROLE_RULES policies
CREATE POLICY "Authenticated can view bulk role rules" ON public.bulk_role_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage bulk role rules" ON public.bulk_role_rules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- BULK_POSITION_RULES policies
CREATE POLICY "Authenticated can view bulk position rules" ON public.bulk_position_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage bulk position rules" ON public.bulk_position_rules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- NOTIFICATIONS policies
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR user_id = auth.uid());
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- NOTIFICATION_TEMPLATES policies
CREATE POLICY "Authenticated can view notification templates" ON public.notification_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage notification templates" ON public.notification_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- PROCESSES policies
CREATE POLICY "Authenticated can view processes" ON public.processes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage processes" ON public.processes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- MENU_SETS policies
CREATE POLICY "Authenticated can view menu sets" ON public.menu_sets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage menu sets" ON public.menu_sets FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- EMAIL_LOGS policies
CREATE POLICY "Admins can view email logs" ON public.email_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage email logs" ON public.email_logs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- SYSTEM_SETTINGS policies
CREATE POLICY "Authenticated can view system settings" ON public.system_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage system settings" ON public.system_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- SEED DATA
-- =============================================

-- Default permissions
INSERT INTO public.permissions (name, description, category) VALUES
  ('view_employees', 'View employee records', 'employees'),
  ('edit_employees', 'Create and edit employee records', 'employees'),
  ('delete_employees', 'Delete employee records', 'employees'),
  ('view_roster', 'View the roster/schedule', 'roster'),
  ('edit_roster', 'Create and edit roster/schedule', 'roster'),
  ('view_shifts', 'View shifts', 'roster'),
  ('edit_shifts', 'Create and edit shifts', 'roster'),
  ('approve_holidays', 'Approve or reject holiday requests', 'holidays'),
  ('view_holidays', 'View holiday requests', 'holidays'),
  ('submit_holidays', 'Submit holiday requests', 'holidays'),
  ('view_reports', 'View reports and analytics', 'reports'),
  ('manage_permissions', 'Manage user permissions', 'admin'),
  ('manage_settings', 'Manage system settings', 'admin'),
  ('view_time_clock', 'View time clock records', 'time'),
  ('manage_time_clock', 'Manage time clock records', 'time'),
  ('clock_in_out', 'Clock in and out', 'time'),
  ('view_notifications', 'View notifications', 'notifications'),
  ('manage_notifications', 'Manage notification templates', 'notifications'),
  ('view_processes', 'View processes', 'processes'),
  ('manage_processes', 'Manage processes', 'processes')
ON CONFLICT (name) DO NOTHING;

-- Default permission groups
INSERT INTO public.permission_groups (name, description) VALUES
  ('Admin', 'Full system access'),
  ('Super User', 'Extended access without admin privileges'),
  ('Care Manager', 'Care management role with roster and employee access'),
  ('Team Leader', 'Team leadership role'),
  ('Staff', 'Basic staff access'),
  ('Default User', 'Default permissions for new users')
ON CONFLICT DO NOTHING;

-- Default system settings
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
  ('early_clock_in_minutes', '15', 'Minutes before shift start that early clock-in is flagged'),
  ('late_clock_in_minutes', '15', 'Minutes after shift start that late clock-in is flagged'),
  ('early_clock_out_minutes', '15', 'Minutes before shift end that early clock-out is flagged'),
  ('late_clock_out_minutes', '15', 'Minutes after shift end that late clock-out is flagged')
ON CONFLICT (setting_key) DO NOTHING;

-- Default notification templates
INSERT INTO public.notification_templates (name, title_template, message_template, type, category, trigger_event) VALUES
  ('Holiday Approved', 'Holiday Request Approved', 'Your holiday request from {{start_date}} to {{end_date}} has been approved by {{approver_name}}.', 'success', 'holidays', 'holiday_approved'),
  ('Holiday Rejected', 'Holiday Request Rejected', 'Your holiday request from {{start_date}} to {{end_date}} has been rejected. Reason: {{rejection_reason}}', 'warning', 'holidays', 'holiday_rejected'),
  ('Shift Assigned', 'New Shift Assigned', 'You have been assigned a new shift on {{shift_date}} from {{start_time}} to {{end_time}}.', 'info', 'roster', 'shift_assigned')
ON CONFLICT DO NOTHING;

-- Default lookup list entries
INSERT INTO public.lookup_lists (category, value) VALUES
  ('department', 'Care'),
  ('department', 'Administration'),
  ('department', 'Management'),
  ('department', 'Kitchen'),
  ('department', 'Housekeeping'),
  ('department', 'Maintenance'),
  ('location', 'Main Building'),
  ('location', 'Annex'),
  ('position', 'Care Assistant'),
  ('position', 'Senior Care Assistant'),
  ('position', 'Team Leader'),
  ('position', 'Care Manager'),
  ('position', 'Administrator'),
  ('employment_type', 'Permanent'),
  ('employment_type', 'Temporary'),
  ('employment_type', 'Contract'),
  ('employment_type', 'Internship'),
  ('contract_type', 'Full Time'),
  ('contract_type', 'Part Time'),
  ('contract_type', 'Zero Hours'),
  ('right_to_work', 'British Citizen'),
  ('right_to_work', 'Settled Status'),
  ('right_to_work', 'Pre-Settled Status'),
  ('right_to_work', 'Work Visa')
ON CONFLICT DO NOTHING;
