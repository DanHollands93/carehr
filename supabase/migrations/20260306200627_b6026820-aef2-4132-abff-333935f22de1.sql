
-- Add geolocation and photo columns to time_clock_records
ALTER TABLE public.time_clock_records
  ADD COLUMN IF NOT EXISTS clock_in_latitude double precision,
  ADD COLUMN IF NOT EXISTS clock_in_longitude double precision,
  ADD COLUMN IF NOT EXISTS clock_in_accuracy double precision,
  ADD COLUMN IF NOT EXISTS clock_out_latitude double precision,
  ADD COLUMN IF NOT EXISTS clock_out_longitude double precision,
  ADD COLUMN IF NOT EXISTS clock_out_accuracy double precision,
  ADD COLUMN IF NOT EXISTS clock_in_photo_url text,
  ADD COLUMN IF NOT EXISTS clock_out_photo_url text;

-- Create storage bucket for clock photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('clock-photos', 'clock-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to clock-photos bucket
CREATE POLICY "Users can upload clock photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'clock-photos');

-- Allow authenticated users to read their own photos
CREATE POLICY "Users can view clock photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'clock-photos');
