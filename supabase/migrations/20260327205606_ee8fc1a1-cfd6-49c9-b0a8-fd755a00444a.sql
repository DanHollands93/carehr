
-- Fix Daniel Wright's existing time clock record that was created before the absence-aware logic
UPDATE time_clock_records 
SET status = 'completed', 
    discrepancy_type = NULL,
    updated_at = now()
WHERE id = '5f006565-68e1-4f8d-8167-963ab5083c5b';

-- Also fix did_not_clock_in records for days covered by approved absences
UPDATE time_clock_records tcr
SET status = 'completed',
    discrepancy_type = NULL,
    updated_at = now()
WHERE tcr.discrepancy_type = 'did_not_clock_in'
AND EXISTS (
  SELECT 1 FROM absences a 
  WHERE a.employee_id = tcr.employee_id 
  AND a.status = 'approved'
  AND tcr.shift_date::date >= a.start_date::date 
  AND tcr.shift_date::date <= a.end_date::date
);
