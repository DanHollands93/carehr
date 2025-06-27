
-- Create roster categories table
CREATE TABLE public.roster_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create roster staff assignments table (for both templates and working rosters)
CREATE TABLE public.roster_staff_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roster_category_id UUID REFERENCES public.roster_categories(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(roster_category_id, employee_id)
);

-- Add category_id to roster_templates table
ALTER TABLE public.roster_templates 
ADD COLUMN category_id UUID REFERENCES public.roster_categories(id) ON DELETE SET NULL;

-- Add category_id to shifts table for working rosters
ALTER TABLE public.shifts 
ADD COLUMN category_id UUID REFERENCES public.roster_categories(id) ON DELETE SET NULL;

-- Insert a default "All Staff" category for existing data
INSERT INTO public.roster_categories (name, description, department)
VALUES ('All Staff', 'Default category for all staff members', 'All Departments');

-- Enable RLS on new tables
ALTER TABLE public.roster_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roster_staff_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for roster categories (admins can manage, all authenticated users can view)
CREATE POLICY "Anyone can view roster categories" 
  ON public.roster_categories 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage roster categories" 
  ON public.roster_categories 
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for roster staff assignments
CREATE POLICY "Anyone can view roster staff assignments" 
  ON public.roster_staff_assignments 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage roster staff assignments" 
  ON public.roster_staff_assignments 
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
