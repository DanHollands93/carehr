
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- 'success', 'warning', 'info'
  category TEXT NOT NULL, -- 'Holiday', 'Policy', 'Training', etc.
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification templates table
CREATE TABLE public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  category TEXT NOT NULL,
  trigger_event TEXT NOT NULL, -- 'holiday_approved', 'policy_published', etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications - users can only see their own notifications
CREATE POLICY "Users can view their own notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policies for notification templates - all authenticated users can view templates
CREATE POLICY "Authenticated users can view notification templates" 
  ON public.notification_templates 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Only admins can manage templates (we'll need to create admin policies later)
CREATE POLICY "Admins can manage notification templates" 
  ON public.notification_templates 
  FOR ALL 
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Insert some default notification templates
INSERT INTO public.notification_templates (name, title_template, message_template, type, category, trigger_event) VALUES
('Holiday Request Approved', 'Holiday Request Approved', 'Your holiday request for {{start_date}} to {{end_date}} has been approved by {{approver_name}}.', 'success', 'Holiday', 'holiday_approved'),
('Holiday Request Rejected', 'Holiday Request Rejected', 'Your holiday request for {{start_date}} to {{end_date}} has been rejected. Reason: {{rejection_reason}}', 'warning', 'Holiday', 'holiday_rejected'),
('New Policy Published', 'New Policy Document', '{{policy_name}} has been published. Please review and acknowledge.', 'info', 'Policy', 'policy_published'),
('Training Reminder', 'Training Reminder', '{{training_name}} is due by {{due_date}}. Complete in the learning portal.', 'warning', 'Training', 'training_reminder'),
('Profile Update Required', 'Profile Update Required', 'Please update your {{field_name}} in your profile.', 'warning', 'Profile', 'profile_update_required');
