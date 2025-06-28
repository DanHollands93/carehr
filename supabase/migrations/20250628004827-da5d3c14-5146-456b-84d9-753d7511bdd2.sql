
-- Enable RLS on all core tables that don't have it yet (ignore if already enabled)
DO $$ 
BEGIN
    -- Enable RLS on tables that don't have it yet
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'employees' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Continue for other tables
    ALTER TABLE public.career_history ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.shift_templates ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.roster_templates ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.roster_template_assignments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.applied_roster_templates ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.template_shifts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.job_roles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.roster_categories ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.roster_staff_assignments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.employee_drafts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.holiday_entitlement ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors for tables that already have RLS enabled
        NULL;
END $$;

-- Drop existing policies that might conflict, then recreate them
DROP POLICY IF EXISTS "Employees can view their own holiday requests" ON public.holiday_requests;
DROP POLICY IF EXISTS "Employees can create their own holiday requests" ON public.holiday_requests;
DROP POLICY IF EXISTS "Users can view holiday requests with permission" ON public.holiday_requests;
DROP POLICY IF EXISTS "Users can manage holiday requests with permission" ON public.holiday_requests;

-- Create RLS policies for employees table
DROP POLICY IF EXISTS "Users can view employees with permission" ON public.employees;
DROP POLICY IF EXISTS "Users can create employees with permission" ON public.employees;
DROP POLICY IF EXISTS "Users can edit employees with permission" ON public.employees;
DROP POLICY IF EXISTS "Users can delete employees with permission" ON public.employees;
DROP POLICY IF EXISTS "Employees can view their own record" ON public.employees;

CREATE POLICY "Users can view employees with permission" 
  ON public.employees FOR SELECT 
  TO authenticated
  USING (public.user_can_view_employees());

CREATE POLICY "Users can create employees with permission" 
  ON public.employees FOR INSERT 
  TO authenticated
  WITH CHECK (public.user_can_create_employees());

CREATE POLICY "Users can edit employees with permission" 
  ON public.employees FOR UPDATE 
  TO authenticated
  USING (public.user_can_edit_employees());

CREATE POLICY "Users can delete employees with permission" 
  ON public.employees FOR DELETE 
  TO authenticated
  USING (public.user_can_delete_employees());

CREATE POLICY "Employees can view their own record" 
  ON public.employees FOR SELECT 
  TO authenticated
  USING (id = public.current_user_employee_id());

-- Create RLS policies for career_history table
DROP POLICY IF EXISTS "Users can view career history with permission" ON public.career_history;
DROP POLICY IF EXISTS "Users can manage career history with permission" ON public.career_history;
DROP POLICY IF EXISTS "Employees can view their own career history" ON public.career_history;

CREATE POLICY "Users can view career history with permission" 
  ON public.career_history FOR SELECT 
  TO authenticated
  USING (public.user_can_view_employees(location));

CREATE POLICY "Users can manage career history with permission" 
  ON public.career_history FOR ALL
  TO authenticated
  USING (public.user_can_edit_employees(location));

CREATE POLICY "Employees can view their own career history" 
  ON public.career_history FOR SELECT 
  TO authenticated
  USING (employee_id = public.current_user_employee_id());

-- Create RLS policies for shifts table
DROP POLICY IF EXISTS "Users can view shifts with roster permission" ON public.shifts;
DROP POLICY IF EXISTS "Users can manage shifts with roster permission" ON public.shifts;
DROP POLICY IF EXISTS "Employees can view their own shifts" ON public.shifts;

CREATE POLICY "Users can view shifts with roster permission" 
  ON public.shifts FOR SELECT 
  TO authenticated
  USING (public.user_can_view_roster());

CREATE POLICY "Users can manage shifts with roster permission" 
  ON public.shifts FOR ALL
  TO authenticated
  USING (public.user_can_edit_roster());

CREATE POLICY "Employees can view their own shifts" 
  ON public.shifts FOR SELECT 
  TO authenticated
  USING (employee_id = public.current_user_employee_id());

-- Recreate holiday_requests policies
CREATE POLICY "Users can view holiday requests with permission" 
  ON public.holiday_requests FOR SELECT 
  TO authenticated
  USING (public.user_can_view_employees());

CREATE POLICY "Users can manage holiday requests with permission" 
  ON public.holiday_requests FOR ALL
  TO authenticated
  USING (public.user_can_edit_employees());

CREATE POLICY "Employees can view their own holiday requests" 
  ON public.holiday_requests FOR SELECT 
  TO authenticated
  USING (employee_id = public.current_user_employee_id());

CREATE POLICY "Employees can create their own holiday requests" 
  ON public.holiday_requests FOR INSERT 
  TO authenticated
  WITH CHECK (employee_id = public.current_user_employee_id());

-- Create remaining policies for other tables
DROP POLICY IF EXISTS "Users can view job roles with permission" ON public.job_roles;
DROP POLICY IF EXISTS "Users can manage job roles with permission" ON public.job_roles;

CREATE POLICY "Users can view job roles with permission" 
  ON public.job_roles FOR SELECT 
  TO authenticated
  USING (public.user_can_view_employees(location));

CREATE POLICY "Users can manage job roles with permission" 
  ON public.job_roles FOR ALL
  TO authenticated
  USING (public.user_can_edit_employees(location));

-- Template validation function for notification security
CREATE OR REPLACE FUNCTION public.validate_notification_template(
  title_template TEXT,
  message_template TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  allowed_variables TEXT[] := ARRAY[
    'employee_name', 'first_name', 'last_name', 'approver_name',
    'start_date', 'end_date', 'rejection_reason', 'department',
    'job_title', 'manager_name', 'shift_date', 'shift_time',
    'document_name', 'policy_name', 'training_name'
  ];
  template_vars TEXT[];
  var TEXT;
BEGIN
  -- Extract variables from templates using regex
  SELECT array_agg(DISTINCT matches[1])
  INTO template_vars
  FROM (
    SELECT regexp_matches(title_template || ' ' || message_template, '\{\{([^}]+)\}\}', 'g') AS matches
  ) t;
  
  -- Check if all variables are in allowed list
  IF template_vars IS NOT NULL THEN
    FOREACH var IN ARRAY template_vars
    LOOP
      IF NOT (var = ANY(allowed_variables)) THEN
        RETURN FALSE;
      END IF;
    END LOOP;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Add constraint to notification_templates table for security (drop first if exists)
DO $$ 
BEGIN
    ALTER TABLE public.notification_templates DROP CONSTRAINT IF EXISTS valid_template_variables;
    ALTER TABLE public.notification_templates 
    ADD CONSTRAINT valid_template_variables 
    CHECK (public.validate_notification_template(title_template, message_template));
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore constraint errors if they occur
        NULL;
END $$;
