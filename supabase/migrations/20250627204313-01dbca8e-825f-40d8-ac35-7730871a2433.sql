
-- Create a table for position categories
CREATE TABLE public.positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert some default positions
INSERT INTO public.positions (name, department) VALUES
  ('Manager', 'Management'),
  ('Cashier', 'Front of House'),
  ('Kitchen Staff', 'Kitchen'),
  ('Server', 'Front of House'),
  ('Cleaner', 'Maintenance');

-- Enable RLS (though we'll allow all authenticated users to read positions)
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view positions
CREATE POLICY "Anyone can view positions" 
  ON public.positions 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Only admins can insert/update/delete positions (we'll implement this later)
CREATE POLICY "Admins can manage positions" 
  ON public.positions 
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
