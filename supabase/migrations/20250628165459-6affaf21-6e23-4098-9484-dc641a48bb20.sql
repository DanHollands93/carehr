
-- Add RLS policies for permission_groups table
CREATE POLICY "Authenticated users can view permission groups" 
  ON public.permission_groups FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create permission groups" 
  ON public.permission_groups FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update permission groups" 
  ON public.permission_groups FOR UPDATE 
  TO authenticated
  USING (true);

-- Add RLS policies for permission_group_permissions table
CREATE POLICY "Authenticated users can view group permissions" 
  ON public.permission_group_permissions FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage group permissions" 
  ON public.permission_group_permissions FOR ALL
  TO authenticated
  USING (true);
