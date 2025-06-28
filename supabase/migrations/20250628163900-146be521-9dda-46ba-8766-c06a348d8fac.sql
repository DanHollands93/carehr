
-- Create permission groups table
CREATE TABLE public.permission_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create many-to-many relationship between permission groups and permissions
CREATE TABLE public.permission_group_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_group_id UUID NOT NULL REFERENCES public.permission_groups(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  location TEXT, -- NULL means applies to all locations
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(permission_group_id, permission_id, location)
);

-- Create user role assignments table
CREATE TABLE public.user_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_group_id UUID NOT NULL REFERENCES public.permission_groups(id) ON DELETE CASCADE,
  location TEXT, -- NULL means applies to all locations the user has access to
  is_active BOOLEAN DEFAULT true,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, permission_group_id, location)
);

-- Add override_type to user_permissions to support grants and denials
ALTER TABLE public.user_permissions 
ADD COLUMN override_type TEXT DEFAULT 'grant' CHECK (override_type IN ('grant', 'deny'));

-- Create user menu overrides table
CREATE TABLE public.user_menu_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  menu_item TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL,
  location TEXT, -- NULL means applies globally
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, menu_item, location)
);

-- Insert some default permission groups
INSERT INTO public.permission_groups (name, description) VALUES
('Care Manager', 'Full management access including staff, holidays, and reports'),
('Team Leader', 'Team supervision access with limited administrative functions'),
('Staff Member', 'Basic staff access for own records and holiday requests'),
('Admin', 'System administration and configuration access');

-- Create a function to get effective user permissions (combining roles and overrides)
CREATE OR REPLACE FUNCTION get_effective_user_permissions(p_user_id UUID, p_location TEXT DEFAULT NULL)
RETURNS TABLE (
  permission_name TEXT,
  permission_category TEXT,
  location TEXT,
  source TEXT -- 'role' or 'override'
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- Get permissions from assigned roles
  SELECT DISTINCT
    p.name as permission_name,
    p.category as permission_category,
    COALESCE(pgp.location, ura.location) as location,
    'role'::TEXT as source
  FROM user_role_assignments ura
  JOIN permission_group_permissions pgp ON ura.permission_group_id = pgp.permission_group_id
  JOIN permissions p ON pgp.permission_id = p.id
  WHERE ura.user_id = p_user_id
    AND ura.is_active = true
    AND (p_location IS NULL OR pgp.location IS NULL OR pgp.location = p_location OR ura.location IS NULL OR ura.location = p_location)
  
  UNION
  
  -- Get permission overrides (grants only, denials are handled in application logic)
  SELECT DISTINCT
    p.name as permission_name,
    p.category as permission_category,
    up.location,
    'override'::TEXT as source
  FROM user_permissions up
  JOIN permissions p ON up.permission_id = p.id
  WHERE up.user_id = p_user_id
    AND up.override_type = 'grant'
    AND (p_location IS NULL OR up.location IS NULL OR up.location = p_location);
END;
$$;

-- Create a function to check if user has effective permission
CREATE OR REPLACE FUNCTION user_has_effective_permission(p_user_id UUID, p_permission_name TEXT, p_location TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_permission BOOLEAN := false;
  is_denied BOOLEAN := false;
BEGIN
  -- First check if permission is explicitly denied
  SELECT EXISTS(
    SELECT 1 
    FROM user_permissions up
    JOIN permissions p ON up.permission_id = p.id
    WHERE up.user_id = p_user_id
      AND p.name = p_permission_name
      AND up.override_type = 'deny'
      AND (up.location IS NULL OR up.location = p_location OR p_location IS NULL)
  ) INTO is_denied;
  
  -- If denied, return false immediately
  IF is_denied THEN
    RETURN false;
  END IF;
  
  -- Check if user has permission from roles or grants
  SELECT EXISTS(
    SELECT 1 
    FROM get_effective_user_permissions(p_user_id, p_location)
    WHERE permission_name = p_permission_name
  ) INTO has_permission;
  
  RETURN has_permission;
END;
$$;

-- Enable RLS on new tables
ALTER TABLE public.permission_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_group_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_menu_overrides ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for permission groups (admin only)
CREATE POLICY "Admins can manage permission groups" ON public.permission_groups
FOR ALL USING (user_has_effective_permission(auth.uid(), 'manage_permissions'));

CREATE POLICY "Admins can manage permission group permissions" ON public.permission_group_permissions
FOR ALL USING (user_has_effective_permission(auth.uid(), 'manage_permissions'));

CREATE POLICY "Admins can manage user role assignments" ON public.user_role_assignments
FOR ALL USING (user_has_effective_permission(auth.uid(), 'manage_users'));

CREATE POLICY "Users can view their own menu overrides" ON public.user_menu_overrides
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage user menu overrides" ON public.user_menu_overrides
FOR ALL USING (user_has_effective_permission(auth.uid(), 'manage_users'));
