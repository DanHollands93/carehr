-- Create custom_forms table to store form definitions
CREATE TABLE public.custom_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  form_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_forms ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users with manage_processes can manage custom forms" 
ON public.custom_forms 
FOR ALL 
USING (user_has_effective_permission(auth.uid(), 'manage_processes'));

CREATE POLICY "Users with manage_processes can view custom forms" 
ON public.custom_forms 
FOR SELECT 
USING (user_has_effective_permission(auth.uid(), 'manage_processes'));