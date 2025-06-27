
-- First, remove existing demo users completely
DO $$
DECLARE
  admin_user_id UUID;
  hr_user_id UUID;
BEGIN
  -- Get existing user IDs
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@demo.com';
  SELECT id INTO hr_user_id FROM auth.users WHERE email = 'hr@demo.com';
  
  -- Remove from user_roles first
  IF admin_user_id IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = admin_user_id;
    DELETE FROM public.profiles WHERE id = admin_user_id;
  END IF;
  
  IF hr_user_id IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = hr_user_id;
    DELETE FROM public.profiles WHERE id = hr_user_id;
  END IF;
  
  -- Remove from auth.users (this should cascade)
  DELETE FROM auth.users WHERE email IN ('admin@demo.com', 'hr@demo.com');
END $$;

-- Now create the demo users with proper password hashing
DO $$
DECLARE
  admin_user_id UUID;
  hr_user_id UUID;
BEGIN
  -- Create admin user
  admin_user_id := gen_random_uuid();
  
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud
  ) VALUES (
    admin_user_id,
    '00000000-0000-0000-0000-000000000000',
    'admin@demo.com',
    crypt('admin', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"first_name": "Admin", "last_name": "User"}'::jsonb,
    false,
    'authenticated',
    'authenticated'
  );
  
  -- Create HR user
  hr_user_id := gen_random_uuid();
  
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud
  ) VALUES (
    hr_user_id,
    '00000000-0000-0000-0000-000000000000',
    'hr@demo.com',
    crypt('hr', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"first_name": "HR", "last_name": "User"}'::jsonb,
    false,
    'authenticated',
    'authenticated'
  );
  
  -- Create profiles (these will be created by the trigger, but let's ensure they exist)
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (admin_user_id, 'admin@demo.com', 'Admin', 'User')
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (hr_user_id, 'hr@demo.com', 'HR', 'User')
  ON CONFLICT (id) DO NOTHING;
  
  -- Assign roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_user_id, 'admin');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (hr_user_id, 'hr_user');
END $$;
