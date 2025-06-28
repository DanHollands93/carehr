
-- Add RLS policy to allow system to create notifications for users
CREATE POLICY "System can create notifications for users" 
  ON public.notifications 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Also add a policy for service role to insert notifications
CREATE POLICY "Service role can create notifications" 
  ON public.notifications 
  FOR INSERT 
  TO service_role
  WITH CHECK (true);
