
-- Update lookup_lists table to include positions data if not already present
INSERT INTO public.lookup_lists (category, value, is_active) 
SELECT 'positions', name, true 
FROM public.positions 
WHERE NOT EXISTS (
  SELECT 1 FROM public.lookup_lists 
  WHERE category = 'positions' AND value = positions.name
);

-- Also ensure we have some default positions in lookup_lists if the positions table is empty
INSERT INTO public.lookup_lists (category, value, is_active) VALUES
  ('positions', 'Manager', true),
  ('positions', 'Cashier', true),
  ('positions', 'Kitchen Staff', true),
  ('positions', 'Server', true),
  ('positions', 'Cleaner', true),
  ('positions', 'Bartender', true),
  ('positions', 'Chef', true),
  ('positions', 'Assistant Manager', true)
ON CONFLICT DO NOTHING;
