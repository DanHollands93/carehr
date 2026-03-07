
-- Drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Admins can manage company reviews" ON public.employee_reviews;
DROP POLICY IF EXISTS "Users can view own reviews" ON public.employee_reviews;

CREATE POLICY "Admins can manage company reviews"
ON public.employee_reviews
FOR ALL
TO authenticated
USING (
  is_super_admin(auth.uid()) 
  OR (
    company_id = user_company_id(auth.uid()) 
    AND (
      has_role(auth.uid(), 'admin'::app_role) 
      OR user_has_permission(auth.uid(), 'edit_employees'::text)
    )
  )
);

CREATE POLICY "Users can view own reviews"
ON public.employee_reviews
FOR SELECT
TO authenticated
USING (employee_id = current_user_employee_id());
