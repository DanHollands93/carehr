
-- First, let's check what users we have and create corresponding employee records
INSERT INTO public.employees (id, first_name, last_name, email, department)
SELECT 
  gen_random_uuid(),
  COALESCE(p.first_name, 'Demo'),
  COALESCE(p.last_name, 'User'),
  p.email,
  CASE 
    WHEN ur.role = 'admin' THEN 'Administration'
    WHEN ur.role = 'hr_user' THEN 'Human Resources'
    ELSE 'General'
  END
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
WHERE NOT EXISTS (
  SELECT 1 FROM employees e WHERE e.email = p.email
);

-- Now link the profiles to the employee records
UPDATE profiles 
SET employee_id = (
  SELECT e.id 
  FROM employees e 
  WHERE e.email = profiles.email
)
WHERE employee_id IS NULL;
