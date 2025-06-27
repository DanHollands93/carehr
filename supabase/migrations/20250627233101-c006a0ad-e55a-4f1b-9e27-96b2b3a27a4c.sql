
-- Get the admin user ID and grant all permissions
DO $$
DECLARE
  admin_user_id UUID;
  perm_record RECORD;
  location_record RECORD;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@demo.com';
  
  IF admin_user_id IS NOT NULL THEN
    -- First, clear existing permissions for admin to avoid conflicts
    DELETE FROM public.user_permissions WHERE user_id = admin_user_id;
    DELETE FROM public.user_location_permissions WHERE user_id = admin_user_id;
    
    -- Grant all permissions globally (location = null means global access)
    FOR perm_record IN SELECT id FROM public.permissions LOOP
      INSERT INTO public.user_permissions (user_id, permission_id, location)
      VALUES (admin_user_id, perm_record.id, null)
      ON CONFLICT (user_id, permission_id, location) DO NOTHING;
    END LOOP;
    
    -- Grant access to all locations
    FOR location_record IN SELECT DISTINCT value FROM public.lookup_lists WHERE category = 'locations' AND is_active = true LOOP
      INSERT INTO public.user_location_permissions (user_id, location)
      VALUES (admin_user_id, location_record.value)
      ON CONFLICT (user_id, location) DO NOTHING;
    END LOOP;
    
    RAISE NOTICE 'Admin user granted all permissions successfully';
  ELSE
    RAISE NOTICE 'Admin user not found';
  END IF;
END $$;
