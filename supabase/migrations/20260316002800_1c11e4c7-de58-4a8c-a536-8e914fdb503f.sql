
ALTER TABLE public.shifts ADD COLUMN absence_pay_override text DEFAULT NULL;
COMMENT ON COLUMN public.shifts.absence_pay_override IS 'Override pay behavior for shifts during absences. NULL = use absence type default, paid = force pay, unpaid = force no pay';
