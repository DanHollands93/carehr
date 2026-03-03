
-- Step 1: Add company_id to profiles FIRST
ALTER TABLE public.profiles ADD COLUMN company_id UUID;

-- Step 2: Create companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Add FK constraint now that both exist
ALTER TABLE public.profiles ADD CONSTRAINT profiles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;

-- Companies RLS
CREATE POLICY "Super admins can manage companies"
ON public.companies FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view own company"
ON public.companies FOR SELECT
TO authenticated
USING (id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Step 3: Modules table
CREATE TABLE public.modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage modules"
ON public.modules FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated can view modules"
ON public.modules FOR SELECT
TO authenticated
USING (true);

-- Step 4: Company modules table
CREATE TABLE public.company_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (company_id, module_key)
);

ALTER TABLE public.company_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage company modules"
ON public.company_modules FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view own company modules"
ON public.company_modules FOR SELECT
TO authenticated
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Step 5: Company settings table
CREATE TABLE public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value TEXT NOT NULL DEFAULT 'false',
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (company_id, setting_key)
);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all company settings"
ON public.company_settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Company admins can view own settings"
ON public.company_settings FOR SELECT
TO authenticated
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Company admins can update own settings"
ON public.company_settings FOR UPDATE
TO authenticated
USING (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  AND public.has_role(auth.uid(), 'admin')
);

-- Step 6: Security definer functions
CREATE OR REPLACE FUNCTION public.user_company_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.company_has_module(_company_id UUID, _module_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_modules
    WHERE company_id = _company_id AND module_key = _module_key AND is_enabled = true
  )
$$;

-- Step 7: Seed modules
INSERT INTO public.modules (key, name, description, sort_order) VALUES
  ('rostering', 'Rostering & Scheduling', 'Shift management, roster templates, and staff scheduling', 1),
  ('hr', 'HR & People', 'Employee records, career history, holidays, and HR management', 2),
  ('time_attendance', 'Time & Attendance', 'Clock in/out, time tracking, and attendance management', 3),
  ('care_planning', 'Care Planning', 'Care plans, assessments, and care delivery tracking', 4);

-- Step 8: Timestamp triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_settings_updated_at
BEFORE UPDATE ON public.company_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
