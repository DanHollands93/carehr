
-- First, let's add an active column to profiles table for user management
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Create a mapping between profiles and employees
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES public.employees(id);

-- Update holiday_requests table to match our service interface
ALTER TABLE public.holiday_requests 
ADD COLUMN IF NOT EXISTS employee_name TEXT,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS comments TEXT;

-- Create processes table for dynamic process system
CREATE TABLE IF NOT EXISTS public.processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('form', 'list', 'dashboard')),
  menu_set_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create menu_sets table
CREATE TABLE IF NOT EXISTS public.menu_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for holiday_requests
ALTER TABLE public.holiday_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own holiday requests" 
  ON public.holiday_requests FOR SELECT
  USING (
    employee_id IN (
      SELECT e.id FROM public.employees e 
      JOIN public.profiles p ON p.employee_id = e.id 
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all holiday requests"
  ON public.holiday_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own holiday requests"
  ON public.holiday_requests FOR INSERT
  WITH CHECK (
    employee_id IN (
      SELECT e.id FROM public.employees e 
      JOIN public.profiles p ON p.employee_id = e.id 
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Admins can update holiday requests"
  ON public.holiday_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for processes and menu_sets
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view processes"
  ON public.processes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage processes"
  ON public.processes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view menu sets"
  ON public.menu_sets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage menu sets"
  ON public.menu_sets FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert some default data
INSERT INTO public.menu_sets (id, name, description, items) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Employee Self Service', 'Menu for employee self-service portal', '[
  {"id": "1-1", "label": "Holiday Requests", "processId": "holiday-requests"},
  {"id": "1-2", "label": "Personal Info", "processId": "personal-info"},
  {"id": "1-3", "label": "Documents", "processId": "documents"}
]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.processes (id, name, description, type, menu_set_id) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'Holiday Requests', 'Manage employee holiday requests', 'list', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440003', 'Personal Information', 'Update personal details', 'form', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440004', 'HR Analytics', 'Key HR metrics and insights', 'dashboard', null)
ON CONFLICT (id) DO NOTHING;
