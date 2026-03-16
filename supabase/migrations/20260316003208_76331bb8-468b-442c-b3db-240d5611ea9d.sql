
-- Update absences RLS policy to also allow users with manage_absences permission
DROP POLICY IF EXISTS "Admins can manage company absences" ON public.absences;
CREATE POLICY "Admins can manage company absences"
  ON public.absences
  FOR ALL
  TO authenticated
  USING (
    is_super_admin(auth.uid()) OR (
      (company_id = user_company_id(auth.uid())) AND (
        has_role(auth.uid(), 'admin'::app_role) OR 
        user_has_permission(auth.uid(), 'edit_employees'::text) OR
        user_has_permission(auth.uid(), 'manage_absences'::text)
      )
    )
  );
