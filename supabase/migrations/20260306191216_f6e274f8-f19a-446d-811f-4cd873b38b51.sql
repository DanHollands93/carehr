
-- Tighten the employees SELECT policy to require view_employees permission or admin role
DROP POLICY IF EXISTS "Users can view company employees" ON public.employees;

CREATE POLICY "Users can view company employees" ON public.employees
FOR SELECT TO authenticated
USING (
  is_super_admin(auth.uid())
  OR (
    company_id = user_company_id(auth.uid())
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR user_has_permission(auth.uid(), 'view_employees'::text)
    )
  )
);
