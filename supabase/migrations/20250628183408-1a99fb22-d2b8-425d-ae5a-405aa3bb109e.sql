
-- Create email_logs table to track sent emails
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  email_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sender_user_id UUID REFERENCES auth.users(id),
  email_service TEXT DEFAULT 'resend',
  external_id TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on email_logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for email logs (only users with view_email_logs permission can see them)
CREATE POLICY "Users with permission can view email logs" 
  ON public.email_logs 
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM get_effective_user_permissions(auth.uid()) 
      WHERE permission_name = 'view_email_logs'
    )
  );

-- Add the view_email_logs permission
INSERT INTO public.permissions (name, description, category) 
VALUES ('view_email_logs', 'View sent email logs and history', 'Administration')
ON CONFLICT (name) DO NOTHING;

-- Add the permission to the Super User group (assuming it exists)
INSERT INTO public.permission_group_permissions (permission_group_id, permission_id)
SELECT pg.id, p.id
FROM public.permission_groups pg
CROSS JOIN public.permissions p
WHERE pg.name = 'Super User' AND p.name = 'view_email_logs'
ON CONFLICT (permission_group_id, permission_id, location) DO NOTHING;
