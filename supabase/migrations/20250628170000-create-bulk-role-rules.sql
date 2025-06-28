
-- Create bulk_role_rules table for automatic permission assignments
CREATE TABLE public.bulk_role_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_role_id UUID NOT NULL REFERENCES public.job_roles(id) ON DELETE CASCADE,
  permission_group_id UUID NOT NULL REFERENCES public.permission_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(job_role_id, permission_group_id)
);

-- Enable RLS
ALTER TABLE public.bulk_role_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies for bulk_role_rules
CREATE POLICY "Authenticated users can view bulk role rules"
  ON public.bulk_role_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage bulk role rules"
  ON public.bulk_role_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Function to automatically apply bulk rules when an employee's job role changes
CREATE OR REPLACE FUNCTION public.apply_bulk_role_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rule_record RECORD;
  user_id_to_update UUID;
BEGIN
  -- Get the user ID associated with this employee
  SELECT id INTO user_id_to_update
  FROM public.profiles
  WHERE employee_id = NEW.id;
  
  -- If no user profile exists, skip
  IF user_id_to_update IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Handle job role change (UPDATE case)
  IF TG_OP = 'UPDATE' AND OLD.job_role_id != NEW.job_role_id THEN
    -- Remove old job role permissions (only system-assigned ones)
    IF OLD.job_role_id IS NOT NULL THEN
      DELETE FROM public.user_role_assignments
      WHERE user_id = user_id_to_update
        AND permission_group_id IN (
          SELECT permission_group_id 
          FROM public.bulk_role_rules 
          WHERE job_role_id = OLD.job_role_id
        )
        AND assigned_by IS NULL; -- Only remove system assignments
    END IF;
    
    -- Add new job role permissions
    IF NEW.job_role_id IS NOT NULL THEN
      FOR rule_record IN 
        SELECT permission_group_id 
        FROM public.bulk_role_rules 
        WHERE job_role_id = NEW.job_role_id
      LOOP
        INSERT INTO public.user_role_assignments (user_id, permission_group_id, assigned_by, location)
        VALUES (user_id_to_update, rule_record.permission_group_id, NULL, NULL)
        ON CONFLICT (user_id, permission_group_id, location) DO NOTHING;
      END LOOP;
    END IF;
  END IF;
  
  -- Handle new employee with job role (INSERT case)
  IF TG_OP = 'INSERT' AND NEW.job_role_id IS NOT NULL THEN
    FOR rule_record IN 
      SELECT permission_group_id 
      FROM public.bulk_role_rules 
      WHERE job_role_id = NEW.job_role_id
    LOOP
      INSERT INTO public.user_role_assignments (user_id, permission_group_id, assigned_by, location)
      VALUES (user_id_to_update, rule_record.permission_group_id, NULL, NULL)
      ON CONFLICT (user_id, permission_group_id, location) DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically apply bulk rules when employees are created or updated
CREATE TRIGGER trigger_apply_bulk_role_rules
  AFTER INSERT OR UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_bulk_role_rules();
