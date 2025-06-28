
-- Create bulk_position_rules table for automatic permission assignments based on positions
CREATE TABLE public.bulk_position_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  position VARCHAR NOT NULL,
  permission_group_id UUID NOT NULL REFERENCES public.permission_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(position, permission_group_id)
);

-- Enable RLS
ALTER TABLE public.bulk_position_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies for bulk_position_rules
CREATE POLICY "Authenticated users can view bulk position rules"
  ON public.bulk_position_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage bulk position rules"
  ON public.bulk_position_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_role_assignments ura
      JOIN public.permission_group_permissions pgp ON ura.permission_group_id = pgp.permission_group_id
      JOIN public.permissions p ON pgp.permission_id = p.id
      WHERE ura.user_id = auth.uid() 
        AND p.name IN ('manage_users', 'edit_settings')
        AND ura.is_active = true
    )
  );

-- Function to automatically apply bulk position rules when an employee's position changes
CREATE OR REPLACE FUNCTION public.apply_bulk_position_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rule_record RECORD;
  user_id_to_update UUID;
  old_position TEXT;
  new_position TEXT;
BEGIN
  -- Extract position from JSONB or text field
  IF TG_TABLE_NAME = 'employees' THEN
    -- Get the user ID associated with this employee
    SELECT id INTO user_id_to_update
    FROM public.profiles
    WHERE employee_id = NEW.id;
    
    -- If no user profile exists, skip
    IF user_id_to_update IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Handle position change (UPDATE case)
    IF TG_OP = 'UPDATE' THEN
      -- Extract positions from department field (assuming it contains position info)
      old_position := OLD.department;
      new_position := NEW.department;
      
      IF old_position != new_position THEN
        -- Remove old position permissions (only system-assigned ones)
        IF old_position IS NOT NULL THEN
          DELETE FROM public.user_role_assignments
          WHERE user_id = user_id_to_update
            AND permission_group_id IN (
              SELECT permission_group_id 
              FROM public.bulk_position_rules 
              WHERE position = old_position
            )
            AND assigned_by IS NULL; -- Only remove system assignments
        END IF;
        
        -- Add new position permissions
        IF new_position IS NOT NULL THEN
          FOR rule_record IN 
            SELECT permission_group_id 
            FROM public.bulk_position_rules 
            WHERE position = new_position
          LOOP
            INSERT INTO public.user_role_assignments (user_id, permission_group_id, assigned_by, location)
            VALUES (user_id_to_update, rule_record.permission_group_id, NULL, NULL)
            ON CONFLICT (user_id, permission_group_id, location) DO NOTHING;
          END LOOP;
        END IF;
      END IF;
    END IF;
    
    -- Handle new employee with position (INSERT case)
    IF TG_OP = 'INSERT' AND NEW.department IS NOT NULL THEN
      FOR rule_record IN 
        SELECT permission_group_id 
        FROM public.bulk_position_rules 
        WHERE position = NEW.department
      LOOP
        INSERT INTO public.user_role_assignments (user_id, permission_group_id, assigned_by, location)
        VALUES (user_id_to_update, rule_record.permission_group_id, NULL, NULL)
        ON CONFLICT (user_id, permission_group_id, location) DO NOTHING;
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically apply bulk position rules when employees are created or updated
CREATE TRIGGER trigger_apply_bulk_position_rules
  AFTER INSERT OR UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_bulk_position_rules();
