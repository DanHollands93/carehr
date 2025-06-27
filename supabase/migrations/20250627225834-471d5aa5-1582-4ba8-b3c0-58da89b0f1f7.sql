
-- Create the lookup_lists table
CREATE TABLE public.lookup_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  value TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create a unique constraint to prevent duplicate values within the same category
ALTER TABLE public.lookup_lists 
ADD CONSTRAINT unique_category_value UNIQUE (category, value);

-- Add an index for better query performance
CREATE INDEX idx_lookup_lists_category ON public.lookup_lists(category);
CREATE INDEX idx_lookup_lists_active ON public.lookup_lists(category, is_active);
