
-- The audit_log_trigger function is SECURITY DEFINER so it bypasses RLS.
-- Remove the permissive INSERT policy and replace with a restrictive one
DROP POLICY "System can insert audit logs" ON public.audit_logs;

-- Only the trigger function (security definer) inserts, so deny direct inserts
CREATE POLICY "No direct inserts to audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (false);
