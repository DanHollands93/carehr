
-- Ensure all time management permissions exist
INSERT INTO public.permissions (name, description, category) VALUES
('view_staff_shifts', 'View own shifts for clocking in/out', 'time_management'),
('clock_shifts', 'Allow staff to clock in and out of shifts', 'time_management'),
('manage_time_records', 'Approve and reject time discrepancies', 'time_management')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  category = EXCLUDED.category;

-- Create a default "Staff" permission group if it doesn't exist
INSERT INTO public.permission_groups (name, description, is_active) VALUES
('Staff', 'Basic staff permissions including viewing own shifts', true)
ON CONFLICT (name) DO NOTHING;

-- Get the Staff group ID and add the view_staff_shifts permission
DO $$
DECLARE
  staff_group_id UUID;
  view_shifts_permission_id UUID;
  clock_shifts_permission_id UUID;
BEGIN
  -- Get the Staff group ID
  SELECT id INTO staff_group_id 
  FROM public.permission_groups 
  WHERE name = 'Staff' AND is_active = true;
  
  -- Get permission IDs
  SELECT id INTO view_shifts_permission_id 
  FROM public.permissions 
  WHERE name = 'view_staff_shifts';
  
  SELECT id INTO clock_shifts_permission_id 
  FROM public.permissions 
  WHERE name = 'clock_shifts';
  
  -- Add permissions to the Staff group if they exist
  IF staff_group_id IS NOT NULL AND view_shifts_permission_id IS NOT NULL THEN
    INSERT INTO public.permission_group_permissions (permission_group_id, permission_id, location)
    VALUES (staff_group_id, view_shifts_permission_id, NULL)
    ON CONFLICT (permission_group_id, permission_id, location) DO NOTHING;
  END IF;
  
  IF staff_group_id IS NOT NULL AND clock_shifts_permission_id IS NOT NULL THEN
    INSERT INTO public.permission_group_permissions (permission_group_id, permission_id, location)
    VALUES (staff_group_id, clock_shifts_permission_id, NULL)
    ON CONFLICT (permission_group_id, permission_id, location) DO NOTHING;
  END IF;
END $$;
