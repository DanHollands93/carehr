SELECT pgmq.delete('transactional_emails', 4);
SELECT pgmq.delete('transactional_emails', 5);
UPDATE public.email_send_state SET retry_after_until = NULL, updated_at = now() WHERE id = 1;