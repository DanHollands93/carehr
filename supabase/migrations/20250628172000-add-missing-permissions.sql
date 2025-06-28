
-- Add any missing permissions that are referenced in the menu but might not exist
INSERT INTO public.permissions (name, description, category) VALUES
('view_personal', 'View personal information and profile', 'personal'),
('view_documents', 'View documents', 'documents'),
('view_notifications', 'View notifications', 'notifications'),
('manage_settings', 'Manage system settings', 'settings')
ON CONFLICT (name) DO NOTHING;

-- Make sure Super User group has all permissions including the new ones
DO $$
DECLARE
  super_user_group_id UUID;
  perm_record RECORD;
BEGIN
  -- Get the Super User group ID
  SELECT id INTO super_user_group_id 
  FROM public.permission_groups 
  WHERE name = 'Super User';
  
  IF super_user_group_id IS NOT NULL THEN
    -- Add any new permissions to Super User group
    FOR perm_record IN SELECT id FROM public.permissions LOOP
      INSERT INTO public.permission_group_permissions (permission_group_id, permission_id, location)
      VALUES (super_user_group_id, perm_record.id, null)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END $$;
