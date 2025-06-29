
-- Add columns to time_clock_records to track processed time segments
ALTER TABLE public.time_clock_records 
ADD COLUMN IF NOT EXISTS early_minutes_worked INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS early_minutes_paid INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS late_minutes_worked INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS late_minutes_paid INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS scheduled_minutes_paid INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS processed_by UUID;

-- Add enum for overtime payment status
DO $$ BEGIN
    CREATE TYPE overtime_status AS ENUM ('unpaid', 'paid', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add columns for tracking overtime payment decisions
ALTER TABLE public.time_clock_records
ADD COLUMN IF NOT EXISTS early_overtime_status overtime_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS late_overtime_status overtime_status DEFAULT 'pending';

-- Create a table for detailed time segments (for the expanded reporting)
CREATE TABLE IF NOT EXISTS public.time_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    time_clock_record_id UUID NOT NULL REFERENCES time_clock_records(id) ON DELETE CASCADE,
    segment_type TEXT NOT NULL, -- 'early_overtime', 'scheduled', 'late_overtime'
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    minutes_worked INTEGER NOT NULL,
    minutes_paid INTEGER NOT NULL DEFAULT 0,
    pay_status overtime_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_time_segments_record_id ON time_segments(time_clock_record_id);
CREATE INDEX IF NOT EXISTS idx_time_segments_type ON time_segments(segment_type);
