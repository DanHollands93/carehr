
-- Create address_history table to store employee addresses
CREATE TABLE public.address_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  line_1 TEXT NOT NULL,
  line_2 TEXT,
  city TEXT NOT NULL,
  postcode TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'United Kingdom',
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.address_history ENABLE ROW LEVEL SECURITY;

-- Create policies for address_history table
CREATE POLICY "Users can view address history" 
  ON public.address_history 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert address history" 
  ON public.address_history 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update address history" 
  ON public.address_history 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete address history" 
  ON public.address_history 
  FOR DELETE 
  USING (true);

-- Create index for better performance
CREATE INDEX idx_address_history_employee_id ON public.address_history(employee_id);
CREATE INDEX idx_address_history_current ON public.address_history(employee_id, is_current) WHERE is_current = true;
