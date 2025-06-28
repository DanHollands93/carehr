
-- Create a default permission group for all users
INSERT INTO public.permission_groups (name, description, is_active) 
VALUES ('Default User', 'Basic permissions automatically assigned to all users', true)
ON CONFLICT (name) DO NOTHING;

-- Get the permission ID for personal section access (assuming it exists)
-- If it doesn't exist, we'll need to create it
INSERT INTO public.permissions (name, description, category) 
VALUES ('view_personal', 'View personal information and profile', 'personal')
ON CONFLICT (name) DO NOTHING;

-- Assign the personal permission to the Default User group
INSERT INTO public.permission_group_permissions (permission_group_id, permission_id)
SELECT pg.id, p.id
FROM public.permission_groups pg
CROSS JOIN public.permissions p
WHERE pg.name = 'Default User' 
  AND p.name = 'view_personal'
ON CONFLICT (permission_group_id, permission_id, location) DO NOTHING;

-- Create a function to assign default permissions to new users
CREATE OR REPLACE FUNCTION assign_default_permissions_to_user(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  default_group_id UUID;
BEGIN
  -- Get the Default User group ID
  SELECT id INTO default_group_id 
  FROM public.permission_groups 
  WHERE name = 'Default User' AND is_active = true;
  
  -- Assign the default group to the user if it exists and isn't already assigned
  IF default_group_id IS NOT NULL THEN
    INSERT INTO public.user_role_assignments (user_id, permission_group_id, assigned_by)
    VALUES (p_user_id, default_group_id, p_user_id)
    ON CONFLICT (user_id, permission_group_id, location) DO NOTHING;
  END IF;
END;
$$;

-- Update the handle_new_user function to assign default permissions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data ->> 'first_name', 
    NEW.raw_user_meta_data ->> 'last_name'
  );
  
  -- Assign default permissions to the new user
  PERFORM public.assign_default_permissions_to_user(NEW.id);
  
  RETURN NEW;
END;
$$;

-- For existing users who don't have the default group assigned, assign it
INSERT INTO public.user_role_assignments (user_id, permission_group_id, assigned_by)
SELECT p.id, pg.id, p.id
FROM public.profiles p
CROSS JOIN public.permission_groups pg
WHERE pg.name = 'Default User' 
  AND pg.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.user_role_assignments ura 
    WHERE ura.user_id = p.id 
      AND ura.permission_group_id = pg.id
  );
