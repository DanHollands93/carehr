
-- Add columns to track when notifications are seen vs marked as read
ALTER TABLE public.notifications 
ADD COLUMN seen_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN marked_read_at TIMESTAMP WITH TIME ZONE;

-- Update existing notifications to set seen_at for already read notifications
UPDATE public.notifications 
SET seen_at = updated_at 
WHERE read = true AND seen_at IS NULL;
