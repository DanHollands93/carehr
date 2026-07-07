CREATE OR REPLACE FUNCTION public.audit_log_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _old_data jsonb;
  _new_data jsonb;
  _changed text[];
  _record_id text;
  _company_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _old_data := to_jsonb(OLD);
    _new_data := NULL;
    _record_id := OLD.id::text;
    IF TG_TABLE_NAME = 'companies' THEN
      _company_id := (OLD.id)::uuid;
    ELSE
      _company_id := NULLIF(_old_data->>'company_id','')::uuid;
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    _old_data := NULL;
    _new_data := to_jsonb(NEW);
    _record_id := NEW.id::text;
    IF TG_TABLE_NAME = 'companies' THEN
      _company_id := (NEW.id)::uuid;
    ELSE
      _company_id := NULLIF(_new_data->>'company_id','')::uuid;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    _old_data := to_jsonb(OLD);
    _new_data := to_jsonb(NEW);
    _record_id := NEW.id::text;
    IF TG_TABLE_NAME = 'companies' THEN
      _company_id := (NEW.id)::uuid;
    ELSE
      _company_id := NULLIF(_new_data->>'company_id','')::uuid;
    END IF;
    _changed := ARRAY(
      SELECT key FROM jsonb_each(_new_data) AS n(key, value)
      WHERE n.value IS DISTINCT FROM (_old_data -> n.key)
      AND n.key NOT IN ('updated_at', 'created_at')
    );
    IF array_length(_changed, 1) IS NULL THEN
      RETURN NEW;
    END IF;
  END IF;

  INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, changed_fields, performed_by, company_id)
  VALUES (TG_TABLE_NAME, _record_id, TG_OP, _old_data, _new_data, _changed, auth.uid(), _company_id);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;