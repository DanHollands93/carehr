
-- Add missing columns to employees table for government details
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS national_insurance_number TEXT,
ADD COLUMN IF NOT EXISTS tax_code TEXT,
ADD COLUMN IF NOT EXISTS bank_details JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS right_to_work_status TEXT DEFAULT 'verified',
ADD COLUMN IF NOT EXISTS passport_number TEXT,
ADD COLUMN IF NOT EXISTS visa_expiry DATE;

-- Update career_history table to include more comprehensive employment details
ALTER TABLE public.career_history 
ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'permanent', -- permanent, temporary, contract, internship
ADD COLUMN IF NOT EXISTS hours_per_week NUMERIC DEFAULT 40,
ADD COLUMN IF NOT EXISTS pay_type TEXT DEFAULT 'salary', -- salary, hourly
ADD COLUMN IF NOT EXISTS reporting_manager_id UUID REFERENCES public.employees(id),
ADD COLUMN IF NOT EXISTS probation_end_date DATE,
ADD COLUMN IF NOT EXISTS contract_type TEXT DEFAULT 'full_time', -- full_time, part_time, zero_hours
ADD COLUMN IF NOT EXISTS notice_period_weeks INTEGER DEFAULT 4;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_career_history_employee_id ON public.career_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_career_history_current ON public.career_history(employee_id, end_date) WHERE end_date IS NULL;
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);

-- Add constraints (without IF NOT EXISTS as it's not supported)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'unique_email' AND table_name = 'employees') THEN
        ALTER TABLE public.employees ADD CONSTRAINT unique_email UNIQUE (email);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'unique_ni_number' AND table_name = 'employees') THEN
        ALTER TABLE public.employees ADD CONSTRAINT unique_ni_number UNIQUE (national_insurance_number);
    END IF;
END $$;

-- Create a view for current employee positions
CREATE OR REPLACE VIEW public.current_employee_positions AS
SELECT 
    e.id as employee_id,
    e.first_name,
    e.last_name,
    e.email,
    e.department,
    ch.job_title,
    ch.location,
    ch.pay_rate,
    ch.pay_type,
    ch.hours_per_week,
    ch.employment_type,
    ch.contract_type,
    ch.start_date,
    ch.reporting_manager_id,
    manager.first_name || ' ' || manager.last_name as manager_name
FROM public.employees e
LEFT JOIN public.career_history ch ON e.id = ch.employee_id AND ch.end_date IS NULL
LEFT JOIN public.employees manager ON ch.reporting_manager_id = manager.id;
