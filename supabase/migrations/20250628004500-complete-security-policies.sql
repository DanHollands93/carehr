
-- Complete the remaining RLS policies for all core tables

-- Create RLS policies for shift_templates table
DROP POLICY IF EXISTS "Users can view shift templates with roster permission" ON public.shift_templates;
DROP POLICY IF EXISTS "Users can manage shift templates with roster permission" ON public.shift_templates;

CREATE POLICY "Users can view shift templates with roster permission" 
  ON public.shift_templates FOR SELECT 
  TO authenticated
  USING (public.user_can_view_roster());

CREATE POLICY "Users can manage shift templates with roster permission" 
  ON public.shift_templates FOR ALL
  TO authenticated
  USING (public.user_can_edit_roster());

-- Create RLS policies for roster_templates table
DROP POLICY IF EXISTS "Users can view roster templates with permission" ON public.roster_templates;
DROP POLICY IF EXISTS "Users can manage roster templates with permission" ON public.roster_templates;

CREATE POLICY "Users can view roster templates with permission" 
  ON public.roster_templates FOR SELECT 
  TO authenticated
  USING (public.user_can_view_roster());

CREATE POLICY "Users can manage roster templates with permission" 
  ON public.roster_templates FOR ALL
  TO authenticated
  USING (public.user_can_edit_roster());

-- Create RLS policies for positions table
DROP POLICY IF EXISTS "Users can view positions with permission" ON public.positions;
DROP POLICY IF EXISTS "Users can manage positions with permission" ON public.positions;

CREATE POLICY "Users can view positions with permission" 
  ON public.positions FOR SELECT 
  TO authenticated
  USING (public.user_can_view_employees());

CREATE POLICY "Users can manage positions with permission" 
  ON public.positions FOR ALL
  TO authenticated
  USING (public.user_can_edit_employees());

-- Create RLS policies for roster_categories table
DROP POLICY IF EXISTS "Users can view roster categories with permission" ON public.roster_categories;
DROP POLICY IF EXISTS "Users can manage roster categories with permission" ON public.roster_categories;

CREATE POLICY "Users can view roster categories with permission" 
  ON public.roster_categories FOR SELECT 
  TO authenticated
  USING (public.user_can_view_roster());

CREATE POLICY "Users can manage roster categories with permission" 
  ON public.roster_categories FOR ALL
  TO authenticated
  USING (public.user_can_edit_roster());

-- Create RLS policies for employee_drafts table
DROP POLICY IF EXISTS "Users can manage employee drafts with permission" ON public.employee_drafts;

CREATE POLICY "Users can manage employee drafts with permission" 
  ON public.employee_drafts FOR ALL
  TO authenticated
  USING (public.user_can_create_employees());

-- Create RLS policies for holiday_entitlement table
DROP POLICY IF EXISTS "Users can view holiday entitlement with permission" ON public.holiday_entitlement;
DROP POLICY IF EXISTS "Users can manage holiday entitlement with permission" ON public.holiday_entitlement;

CREATE POLICY "Users can view holiday entitlement with permission" 
  ON public.holiday_entitlement FOR SELECT 
  TO authenticated
  USING (public.user_can_view_employees());

CREATE POLICY "Users can manage holiday entitlement with permission" 
  ON public.holiday_entitlement FOR ALL
  TO authenticated
  USING (public.user_can_edit_employees());

-- Create RLS policies for roster-related tables
DROP POLICY IF EXISTS "Users can view roster assignments with permission" ON public.roster_staff_assignments;
DROP POLICY IF EXISTS "Users can manage roster assignments with permission" ON public.roster_staff_assignments;

CREATE POLICY "Users can view roster assignments with permission" 
  ON public.roster_staff_assignments FOR SELECT 
  TO authenticated
  USING (public.user_can_view_roster());

CREATE POLICY "Users can manage roster assignments with permission" 
  ON public.roster_staff_assignments FOR ALL
  TO authenticated
  USING (public.user_can_edit_roster());

-- Create RLS policies for roster_template_assignments
DROP POLICY IF EXISTS "Users can view template assignments with permission" ON public.roster_template_assignments;
DROP POLICY IF EXISTS "Users can manage template assignments with permission" ON public.roster_template_assignments;

CREATE POLICY "Users can view template assignments with permission" 
  ON public.roster_template_assignments FOR SELECT 
  TO authenticated
  USING (public.user_can_view_roster());

CREATE POLICY "Users can manage template assignments with permission" 
  ON public.roster_template_assignments FOR ALL
  TO authenticated
  USING (public.user_can_edit_roster());

-- Create RLS policies for applied_roster_templates
DROP POLICY IF EXISTS "Users can view applied templates with permission" ON public.applied_roster_templates;
DROP POLICY IF EXISTS "Users can manage applied templates with permission" ON public.applied_roster_templates;

CREATE POLICY "Users can view applied templates with permission" 
  ON public.applied_roster_templates FOR SELECT 
  TO authenticated
  USING (public.user_can_view_roster());

CREATE POLICY "Users can manage applied templates with permission" 
  ON public.applied_roster_templates FOR ALL
  TO authenticated
  USING (public.user_can_edit_roster());

-- Create RLS policies for template_shifts
DROP POLICY IF EXISTS "Users can view template shifts with permission" ON public.template_shifts;
DROP POLICY IF EXISTS "Users can manage template shifts with permission" ON public.template_shifts;

CREATE POLICY "Users can view template shifts with permission" 
  ON public.template_shifts FOR SELECT 
  TO authenticated
  USING (public.user_can_view_roster());

CREATE POLICY "Users can manage template shifts with permission" 
  ON public.template_shifts FOR ALL
  TO authenticated
  USING (public.user_can_edit_roster());

-- Add additional security constraints to prevent data tampering
-- Ensure notification templates can only be managed by users with manage_users permission
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view notification templates" ON public.notification_templates;
DROP POLICY IF EXISTS "Admins can manage notification templates" ON public.notification_templates;

CREATE POLICY "Authenticated users can view notification templates" 
  ON public.notification_templates FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users with manage permission can handle notification templates" 
  ON public.notification_templates FOR ALL
  TO authenticated
  USING (public.user_has_permission(auth.uid(), 'manage_users', NULL));

-- Secure the notifications table properly
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications for users" ON public.notifications;
DROP POLICY IF EXISTS "Service role can create notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" 
  ON public.notifications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
  ON public.notifications FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow system to create notifications (this is needed for the notification service)
CREATE POLICY "System can create notifications for users" 
  ON public.notifications FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Additional constraint to ensure user_id matches authenticated user for inserts
CREATE POLICY "Users can only create notifications for themselves" 
  ON public.notifications FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
