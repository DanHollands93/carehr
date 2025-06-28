
-- Create Super User permission group
INSERT INTO public.permission_groups (name, description) 
VALUES ('Super User', 'Full system access with all permissions across all locations')
ON CONFLICT (name) DO NOTHING;

-- Get the Super User group ID and assign all permissions to it
DO $$
DECLARE
  super_user_group_id UUID;
  perm_record RECORD;
  location_record RECORD;
BEGIN
  -- Get the Super User group ID
  SELECT id INTO super_user_group_id 
  FROM public.permission_groups 
  WHERE name = 'Super User';
  
  IF super_user_group_id IS NOT NULL THEN
    -- Clear existing permissions for this group
    DELETE FROM public.permission_group_permissions 
    WHERE permission_group_id = super_user_group_id;
    
    -- Add all permissions globally (location = null means all locations)
    FOR perm_record IN SELECT id FROM public.permissions LOOP
      INSERT INTO public.permission_group_permissions (permission_group_id, permission_id, location)
      VALUES (super_user_group_id, perm_record.id, null)
      ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Also add all permissions for each specific location
    FOR location_record IN 
      SELECT DISTINCT value FROM public.lookup_lists 
      WHERE category = 'locations' AND is_active = true 
    LOOP
      FOR perm_record IN SELECT id FROM public.permissions LOOP
        INSERT INTO public.permission_group_permissions (permission_group_id, permission_id, location)
        VALUES (super_user_group_id, perm_record.id, location_record.value)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Super User group created and configured with all permissions';
  END IF;
END $$;

-- Assign Super User group to admin@demo.com
DO $$
DECLARE
  admin_user_id UUID;
  super_user_group_id UUID;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@demo.com';
  
  -- Get Super User group ID
  SELECT id INTO super_user_group_id 
  FROM public.permission_groups 
  WHERE name = 'Super User';
  
  IF admin_user_id IS NOT NULL AND super_user_group_id IS NOT NULL THEN
    -- Remove existing role assignments for admin (except Default User)
    DELETE FROM public.user_role_assignments 
    WHERE user_id = admin_user_id 
    AND permission_group_id != (
      SELECT id FROM public.permission_groups WHERE name = 'Default User'
    );
    
    -- Assign Super User group to admin
    INSERT INTO public.user_role_assignments (user_id, permission_group_id, assigned_by, location)
    VALUES (admin_user_id, super_user_group_id, admin_user_id, null)
    ON CONFLICT (user_id, permission_group_id, location) DO NOTHING;
    
    RAISE NOTICE 'Super User group assigned to admin@demo.com';
  ELSE
    RAISE NOTICE 'Admin user or Super User group not found';
  END IF;
END $$;
