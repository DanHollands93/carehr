
-- Add missing permissions that are referenced in the menu config
INSERT INTO public.permissions (name, description, category) VALUES
('submit_holidays', 'Submit holiday requests', 'holidays'),
('approve_holidays', 'Approve holiday requests', 'holidays'),
('view_employees', 'View employee information', 'employees'),
('edit_roster', 'Edit roster and templates', 'roster'),
('view_roster', 'View roster', 'roster'),
('view_reports', 'View reports and analytics', 'reports')
ON CONFLICT (name) DO NOTHING;

-- Make sure Super User group has all these permissions
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
    -- Add all permissions to Super User group (globally)
    FOR perm_record IN SELECT id FROM public.permissions LOOP
      INSERT INTO public.permission_group_permissions (permission_group_id, permission_id, location)
      VALUES (super_user_group_id, perm_record.id, null)
      ON CONFLICT DO NOTHING;
    END LOOP;
    
    RAISE NOTICE 'All permissions assigned to Super User group';
  END IF;
END $$;
