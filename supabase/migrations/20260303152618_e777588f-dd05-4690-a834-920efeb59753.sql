
-- Add subdomain column to companies
ALTER TABLE public.companies ADD COLUMN subdomain text UNIQUE;

-- Backfill existing companies with their slug as subdomain
UPDATE public.companies SET subdomain = slug WHERE subdomain IS NULL;
