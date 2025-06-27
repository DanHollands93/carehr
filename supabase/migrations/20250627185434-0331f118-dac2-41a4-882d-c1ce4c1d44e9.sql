
-- Create demo admin user
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
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@demo.com',
  crypt('admin', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"first_name": "Admin", "last_name": "User"}',
  false,
  'authenticated'
);

-- Create demo HR user
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
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'hr@demo.com',
  crypt('hr', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"first_name": "HR", "last_name": "User"}',
  false,
  'authenticated'
);

-- Get the user IDs for role assignment
DO $$
DECLARE
  admin_user_id UUID;
  hr_user_id UUID;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@demo.com';
  
  -- Get HR user ID
  SELECT id INTO hr_user_id FROM auth.users WHERE email = 'hr@demo.com';
  
  -- Insert admin role
  INSERT INTO public.user_roles (user_id, role) VALUES (admin_user_id, 'admin');
  
  -- Insert HR role
  INSERT INTO public.user_roles (user_id, role) VALUES (hr_user_id, 'hr_user');
END $$;
