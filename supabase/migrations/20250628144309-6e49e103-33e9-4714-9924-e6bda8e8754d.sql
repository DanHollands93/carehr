
-- Drop existing policies first to ensure clean slate
DROP POLICY IF EXISTS "Authenticated users can view roster templates" ON public.roster_templates;
DROP POLICY IF EXISTS "Admins can manage roster templates" ON public.roster_templates;
DROP POLICY IF EXISTS "Authenticated users can view template assignments" ON public.roster_template_assignments;
DROP POLICY IF EXISTS "Admins can manage template assignments" ON public.roster_template_assignments;

-- Create policies for roster_templates table
CREATE POLICY "Authenticated users can view roster templates" 
  ON public.roster_templates FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage roster templates" 
  ON public.roster_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create policies for roster_template_assignments table
CREATE POLICY "Authenticated users can view template assignments" 
  ON public.roster_template_assignments FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage template assignments" 
  ON public.roster_template_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
