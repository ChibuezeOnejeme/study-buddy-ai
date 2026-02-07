-- Add study plan settings to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS study_minutes_per_day integer DEFAULT 45;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS study_days text[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS study_intensity text DEFAULT 'balanced';

-- Add time_minutes to study_tasks for tracking duration
ALTER TABLE study_tasks ADD COLUMN IF NOT EXISTS time_minutes integer DEFAULT 15;
ALTER TABLE study_tasks ADD COLUMN IF NOT EXISTS content_id uuid;
ALTER TABLE study_tasks ADD COLUMN IF NOT EXISTS description text;

-- Add summary column to content_uploads if not exists
ALTER TABLE content_uploads ADD COLUMN IF NOT EXISTS summary text;