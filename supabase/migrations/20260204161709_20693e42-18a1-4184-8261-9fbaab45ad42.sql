-- Add columns for set management
ALTER TABLE topics ADD COLUMN IF NOT EXISTS initial_set_generated boolean DEFAULT false;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS last_regenerated_at timestamptz;
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS set_id uuid DEFAULT gen_random_uuid();
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS set_id uuid DEFAULT gen_random_uuid();
ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;