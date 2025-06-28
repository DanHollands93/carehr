
-- Create all the permission-based security definer functions first
CREATE OR REPLACE FUNCTION public.user_can_view_employees(_location TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT public.user_has_permission(auth.uid(), 'view_employees', _location);
$$;

CREATE OR REPLACE FUNCTION public.user_can_edit_employees(_location TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT public.user_has_permission(auth.uid(), 'edit_employees', _location);
$$;

CREATE OR REPLACE FUNCTION public.user_can_create_employees(_location TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT public.user_has_permission(auth.uid(), 'create_employees', _location);
$$;

CREATE OR REPLACE FUNCTION public.user_can_delete_employees(_location TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT public.user_has_permission(auth.uid(), 'delete_employees', _location);
$$;

CREATE OR REPLACE FUNCTION public.user_can_view_reports(_location TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT public.user_has_permission(auth.uid(), 'view_reports', _location);
$$;

CREATE OR REPLACE FUNCTION public.user_can_manage_settings(_location TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT public.user_has_permission(auth.uid(), 'edit_settings', _location);
$$;

CREATE OR REPLACE FUNCTION public.user_can_view_roster(_location TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT public.user_has_permission(auth.uid(), 'view_roster', _location);
$$;

CREATE OR REPLACE FUNCTION public.user_can_edit_roster(_location TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT public.user_has_permission(auth.uid(), 'edit_roster', _location);
$$;

-- Create the missing security definer function for current user employee ID
CREATE OR REPLACE FUNCTION public.current_user_employee_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT p.employee_id
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;
