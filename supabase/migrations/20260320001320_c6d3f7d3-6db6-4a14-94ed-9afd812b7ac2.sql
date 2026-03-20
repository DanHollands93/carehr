
SELECT pgmq.delete('transactional_emails', 1);
SELECT pgmq.delete('transactional_emails', 2);
UPDATE email_send_state SET retry_after_until = NULL, updated_at = now() WHERE id = 1;
