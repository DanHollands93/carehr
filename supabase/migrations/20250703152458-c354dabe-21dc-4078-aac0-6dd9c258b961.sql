-- Add manage_processes permission if it doesn't exist
INSERT INTO public.permissions (name, description, category)
VALUES ('manage_processes', 'Can create and manage custom processes, forms, and workflows', 'processes')
ON CONFLICT (name) DO NOTHING;

-- Add the permission to Admin group
INSERT INTO public.permission_group_permissions (permission_group_id, permission_id)
SELECT 
    pg.id as permission_group_id,
    p.id as permission_id
FROM public.permission_groups pg, public.permissions p
WHERE pg.name = 'Admin' 
  AND p.name = 'manage_processes'
  AND NOT EXISTS (
    SELECT 1 FROM public.permission_group_permissions pgp 
    WHERE pgp.permission_group_id = pg.id 
      AND pgp.permission_id = p.id
  );