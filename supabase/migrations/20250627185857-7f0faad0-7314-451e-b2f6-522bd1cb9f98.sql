
-- Add missing columns to the auth.users entries we created
UPDATE auth.users 
SET 
  confirmation_token = '',
  recovery_token = '',
  email_change_token_new = '',
  email_change = ''
WHERE email IN ('admin@demo.com', 'hr@demo.com') 
AND (
  confirmation_token IS NULL OR 
  recovery_token IS NULL OR 
  email_change_token_new IS NULL OR 
  email_change IS NULL
);

-- Also ensure the aud field is properly set
UPDATE auth.users 
SET aud = 'authenticated'
WHERE email IN ('admin@demo.com', 'hr@demo.com') 
AND (aud IS NULL OR aud = '');
