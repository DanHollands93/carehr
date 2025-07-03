-- Add manage_processes permission if it doesn't exist
INSERT INTO public.permissions (name, description, category)
VALUES ('manage_processes', 'Can create and manage custom processes, forms, and workflows', 'processes')
ON CONFLICT (name) DO NOTHING;

-- Get the permission ID and assign to Admin group
DO $$
DECLARE
    manage_processes_permission_id UUID;
    admin_group_id UUID;
BEGIN
    -- Get the manage_processes permission ID
    SELECT id INTO manage_processes_permission_id 
    FROM public.permissions 
    WHERE name = 'manage_processes';
    
    -- Get or create an Admin permission group
    SELECT id INTO admin_group_id 
    FROM public.permission_groups 
    WHERE name = 'Admin';
    
    -- If Admin group doesn't exist, create it
    IF admin_group_id IS NULL THEN
        INSERT INTO public.permission_groups (name, description, is_active)
        VALUES ('Admin', 'Full administrative access', true)
        RETURNING id INTO admin_group_id;
    END IF;
    
    -- Assign the permission to the Admin group
    INSERT INTO public.permission_group_permissions (permission_group_id, permission_id)
    VALUES (admin_group_id, manage_processes_permission_id)
    ON CONFLICT (permission_group_id, permission_id) DO NOTHING;
END $$;