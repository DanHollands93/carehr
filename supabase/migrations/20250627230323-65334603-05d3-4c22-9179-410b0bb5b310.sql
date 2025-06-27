
-- Create permissions table for granular access control
CREATE TABLE public.permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL, -- e.g., 'employee', 'roster', 'reports', 'settings'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user permissions table to assign specific permissions to users
CREATE TABLE public.user_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  location TEXT, -- specific location restriction, null means all locations
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission_id, location)
);

-- Create location permissions table for location-based access
CREATE TABLE public.user_location_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, location)
);

-- Insert default permissions
INSERT INTO public.permissions (name, description, category) VALUES
('view_employees', 'View employee information', 'employee'),
('edit_employees', 'Edit employee information', 'employee'),
('create_employees', 'Create new employees', 'employee'),
('delete_employees', 'Delete employees', 'employee'),
('view_roster', 'View roster schedules', 'roster'),
('edit_roster', 'Edit roster schedules', 'roster'),
('create_roster', 'Create new roster schedules', 'roster'),
('view_reports', 'View reports and analytics', 'reports'),
('edit_reports', 'Edit and generate reports', 'reports'),
('view_settings', 'View system settings', 'settings'),
('edit_settings', 'Edit system settings', 'settings'),
('manage_users', 'Manage user accounts and permissions', 'admin'),
('view_holidays', 'View holiday requests', 'holidays'),
('approve_holidays', 'Approve holiday requests', 'holidays'),
('submit_holidays', 'Submit holiday requests', 'holidays');

-- Enable RLS on the new tables
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_location_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for permissions (readable by all authenticated users)
CREATE POLICY "Authenticated users can view permissions"
  ON public.permissions FOR SELECT
  TO authenticated
  USING (true);

-- RLS policies for user_permissions (users can only see their own permissions)
CREATE POLICY "Users can view their own permissions"
  ON public.user_permissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user permissions"
  ON public.user_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage user permissions"
  ON public.user_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS policies for user_location_permissions
CREATE POLICY "Users can view their own location permissions"
  ON public.user_location_permissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all location permissions"
  ON public.user_location_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage location permissions"
  ON public.user_location_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create helper function to check if user has specific permission
CREATE OR REPLACE FUNCTION public.user_has_permission(
  _user_id UUID,
  _permission_name TEXT,
  _location TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_permissions up
    JOIN public.permissions p ON up.permission_id = p.id
    WHERE up.user_id = _user_id
      AND p.name = _permission_name
      AND (up.location IS NULL OR up.location = _location OR _location IS NULL)
  );
$$;

-- Create helper function to check location access
CREATE OR REPLACE FUNCTION public.user_has_location_access(
  _user_id UUID,
  _location TEXT
) RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_location_permissions
    WHERE user_id = _user_id AND location = _location
  ) OR EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  );
$$;
