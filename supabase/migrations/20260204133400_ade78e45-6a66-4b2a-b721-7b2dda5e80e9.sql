-- Add topic_id to xp_events table for topic-linked XP tracking
ALTER TABLE xp_events ADD COLUMN topic_id uuid REFERENCES topics(id) ON DELETE SET NULL;
CREATE INDEX idx_xp_events_topic ON xp_events(topic_id);

-- Add xp_earned cache to topic_mastery table
ALTER TABLE topic_mastery ADD COLUMN xp_earned integer DEFAULT 0;

-- Seed remaining topic-specific badges (topic_master already exists)
INSERT INTO badges (slug, name, description, icon, category, requirement_type, requirement_value, xp_reward) VALUES
  ('specialist', 'Specialist', 'Earn 1000 XP in a single topic', '🎯', 'mastery', 'topic_xp', 1000, 150),
  ('well_rounded', 'Well-Rounded', 'Reach Proficient level in 5 topics', '🌟', 'mastery', 'proficient_topics', 5, 250),
  ('deep_diver', 'Deep Diver', 'Study a topic 7 days in a row', '🤿', 'consistency', 'topic_streak', 7, 100);