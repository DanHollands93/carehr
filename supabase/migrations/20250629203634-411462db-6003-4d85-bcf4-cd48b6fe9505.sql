
-- Add job_role_id to career_history table to properly link to job_roles
ALTER TABLE public.career_history 
ADD COLUMN IF NOT EXISTS job_role_id UUID REFERENCES public.job_roles(id);

-- Update existing career_history records to link to job_roles based on job_title and location
-- This is a best-effort update - you may need to manually verify some mappings
UPDATE public.career_history 
SET job_role_id = (
  SELECT jr.id 
  FROM public.job_roles jr 
  WHERE jr.title = career_history.job_title 
    AND jr.location = career_history.location
  LIMIT 1
)
WHERE job_role_id IS NULL;
