
-- First, let's create the time_clock_records table if it doesn't exist
-- This is needed for the shifts query to work properly
CREATE TABLE IF NOT EXISTS public.time_clock_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID REFERENCES public.shifts(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'clocked_in', 'completed', 'discrepancy')),
  clock_in_time TIMESTAMP WITH TIME ZONE,
  clock_out_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for time_clock_records
ALTER TABLE public.time_clock_records ENABLE ROW LEVEL SECURITY;

-- Allow users to view time clock records (basic access)
CREATE POLICY "Users can view time clock records" ON public.time_clock_records
  FOR SELECT USING (true);

-- Allow users to insert time clock records (basic access)  
CREATE POLICY "Users can insert time clock records" ON public.time_clock_records
  FOR INSERT WITH CHECK (true);

-- Allow users to update time clock records (basic access)
CREATE POLICY "Users can update time clock records" ON public.time_clock_records
  FOR UPDATE USING (true);
