
-- Add pay_rate column to shifts table to store the rate at time of shift
ALTER TABLE public.shifts 
ADD COLUMN IF NOT EXISTS pay_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS actual_job_role_id UUID REFERENCES public.job_roles(id);

-- Create employee_job_roles table to track multiple roles per employee
CREATE TABLE IF NOT EXISTS public.employee_job_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  job_role_id UUID NOT NULL REFERENCES public.job_roles(id) ON DELETE CASCADE,
  pay_rate NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'GBP',
  is_primary BOOLEAN DEFAULT false,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(employee_id, job_role_id, start_date)
);

-- Add RLS policies for employee_job_roles
ALTER TABLE public.employee_job_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view employee job roles" 
  ON public.employee_job_roles FOR SELECT 
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage employee job roles" 
  ON public.employee_job_roles FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- Update time_clock_records to ensure we track discrepancies properly
ALTER TABLE public.time_clock_records 
ADD COLUMN IF NOT EXISTS shift_date DATE,
ADD COLUMN IF NOT EXISTS expected_start_time TIME,
ADD COLUMN IF NOT EXISTS expected_end_time TIME;

-- Create function to automatically create time clock records for shifts
CREATE OR REPLACE FUNCTION create_time_clock_record_for_shift()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a time clock record for the new shift
  INSERT INTO public.time_clock_records (
    shift_id,
    employee_id,
    shift_date,
    expected_start_time,
    expected_end_time,
    status
  ) VALUES (
    NEW.id,
    NEW.employee_id,
    NEW.date::DATE,
    NEW.start_time::TIME,
    NEW.end_time::TIME,
    'scheduled'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create time clock records
DROP TRIGGER IF EXISTS create_time_clock_record_trigger ON public.shifts;
CREATE TRIGGER create_time_clock_record_trigger
  AFTER INSERT ON public.shifts
  FOR EACH ROW
  EXECUTE FUNCTION create_time_clock_record_for_shift();

-- Create function to check for missing clock-ins after shift end time
CREATE OR REPLACE FUNCTION check_missing_clock_ins()
RETURNS void AS $$
DECLARE
  shift_record RECORD;
  shift_end_datetime TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Find shifts that have ended but no clock-in recorded
  FOR shift_record IN
    SELECT 
      s.id as shift_id,
      s.employee_id,
      s.date,
      s.start_time,
      s.end_time,
      tcr.id as time_record_id,
      tcr.clock_in_time
    FROM public.shifts s
    LEFT JOIN public.time_clock_records tcr ON s.id = tcr.shift_id
    WHERE tcr.clock_in_time IS NULL
      AND tcr.status = 'scheduled'
  LOOP
    -- Calculate shift end time
    shift_end_datetime := (shift_record.date || ' ' || shift_record.end_time)::TIMESTAMP WITH TIME ZONE;
    
    -- If shift has ended and no clock-in, mark as discrepancy
    IF shift_end_datetime < NOW() THEN
      UPDATE public.time_clock_records
      SET 
        status = 'discrepancy',
        discrepancy_type = 'did_not_clock_in',
        approval_status = 'pending'
      WHERE id = shift_record.time_record_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
