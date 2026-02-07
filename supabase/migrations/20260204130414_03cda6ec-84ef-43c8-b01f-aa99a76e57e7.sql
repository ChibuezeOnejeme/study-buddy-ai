-- =============================================
-- GAMIFICATION & SUBSCRIPTION SYSTEM SCHEMA
-- =============================================

-- ENUMS
CREATE TYPE public.subscription_plan AS ENUM ('free', 'plus', 'pro');
CREATE TYPE public.subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');
CREATE TYPE public.badge_category AS ENUM ('learning', 'consistency', 'mastery', 'social');
CREATE TYPE public.reward_category AS ENUM ('digital', 'real_world');
CREATE TYPE public.reward_status AS ENUM ('pending', 'fulfilled', 'expired');
CREATE TYPE public.mastery_level AS ENUM ('novice', 'learning', 'proficient', 'master');

-- =============================================
-- TABLE 1: subscriptions
-- =============================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan subscription_plan NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  current_period_end TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '1 month'),
  dev_mode BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- TABLE 2: usage_tracking
-- =============================================
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  uploads_count INTEGER NOT NULL DEFAULT 0,
  mock_tests_count INTEGER NOT NULL DEFAULT 0,
  verified_test_attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage"
  ON public.usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
  ON public.usage_tracking FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
  ON public.usage_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- TABLE 3: user_gamification
-- =============================================
CREATE TABLE public.user_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  xp_total INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  streak_protection_used_at DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own gamification"
  ON public.user_gamification FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own gamification"
  ON public.user_gamification FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gamification"
  ON public.user_gamification FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- TABLE 4: badges (definitions - readable by all)
-- =============================================
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category badge_category NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  is_pro_only BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges"
  ON public.badges FOR SELECT
  TO authenticated
  USING (true);

-- =============================================
-- TABLE 5: user_badges
-- =============================================
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- TABLE 6: rewards (definitions - readable by all)
-- =============================================
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  xp_cost INTEGER NOT NULL,
  category reward_category NOT NULL,
  is_pro_only BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active rewards"
  ON public.rewards FOR SELECT
  TO authenticated
  USING (is_active = true);

-- =============================================
-- TABLE 7: user_rewards
-- =============================================
CREATE TABLE public.user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status reward_status NOT NULL DEFAULT 'pending',
  UNIQUE(user_id, reward_id)
);

ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rewards"
  ON public.user_rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rewards"
  ON public.user_rewards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rewards"
  ON public.user_rewards FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- TABLE 8: topic_mastery
-- =============================================
CREATE TABLE public.topic_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  flashcard_mastery_pct INTEGER NOT NULL DEFAULT 0,
  question_accuracy_pct INTEGER NOT NULL DEFAULT 0,
  tests_completed INTEGER NOT NULL DEFAULT 0,
  verified_exam_passed BOOLEAN NOT NULL DEFAULT false,
  mastery_level mastery_level NOT NULL DEFAULT 'novice',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

ALTER TABLE public.topic_mastery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own topic mastery"
  ON public.topic_mastery FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own topic mastery"
  ON public.topic_mastery FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own topic mastery"
  ON public.topic_mastery FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- TABLE 9: xp_events (transaction log)
-- =============================================
CREATE TABLE public.xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  xp_amount INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own xp events"
  ON public.xp_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own xp events"
  ON public.xp_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_xp_events_user_created ON public.xp_events(user_id, created_at DESC);
CREATE INDEX idx_usage_tracking_user_week ON public.usage_tracking(user_id, week_start);

-- =============================================
-- HELPER FUNCTION: Get current week start (Monday)
-- =============================================
CREATE OR REPLACE FUNCTION public.get_current_week_start()
RETURNS DATE
LANGUAGE sql
STABLE
AS $$
  SELECT date_trunc('week', CURRENT_DATE)::date;
$$;

-- =============================================
-- TRIGGER: Auto-create subscription & gamification on user signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user_gamification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create subscription record
  INSERT INTO public.subscriptions (user_id, plan, status, dev_mode)
  VALUES (NEW.id, 'free', 'active', true);
  
  -- Create gamification record
  INSERT INTO public.user_gamification (user_id, xp_total, level, current_streak, longest_streak)
  VALUES (NEW.id, 0, 1, 0, 0);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_gamification
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_gamification();

-- =============================================
-- TRIGGER: Update updated_at on subscriptions
-- =============================================
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON public.usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_gamification_updated_at
  BEFORE UPDATE ON public.user_gamification
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_topic_mastery_updated_at
  BEFORE UPDATE ON public.topic_mastery
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- SEED DATA: Initial Badges
-- =============================================
INSERT INTO public.badges (slug, name, description, icon, category, requirement_type, requirement_value, xp_reward, is_pro_only) VALUES
-- Learning Milestones
('first_steps', 'First Steps', 'Review your first flashcard', 'Sparkles', 'learning', 'flashcard_reviewed', 1, 10, false),
('card_collector_10', 'Card Collector', 'Master 10 flashcards', 'Trophy', 'learning', 'flashcard_mastered', 10, 50, false),
('century_club', 'Century Club', 'Master 100 flashcards', 'Crown', 'learning', 'flashcard_mastered', 100, 200, false),
('knowledge_seeker', 'Knowledge Seeker', 'Answer 50 questions correctly', 'Brain', 'learning', 'questions_correct', 50, 100, false),
('scholar', 'Scholar', 'Answer 200 questions correctly', 'GraduationCap', 'learning', 'questions_correct', 200, 300, false),

-- Consistency
('getting_started', 'Getting Started', 'Maintain a 3-day streak', 'Flame', 'consistency', 'streak_days', 3, 30, false),
('week_warrior', 'Week Warrior', 'Maintain a 7-day streak', 'Flame', 'consistency', 'streak_days', 7, 100, false),
('monthly_master', 'Monthly Master', 'Maintain a 30-day streak', 'Flame', 'consistency', 'streak_days', 30, 500, false),
('early_bird', 'Early Bird', 'Study before 8am', 'Sunrise', 'consistency', 'early_study', 1, 25, false),
('night_owl', 'Night Owl', 'Study after 10pm', 'Moon', 'consistency', 'late_study', 1, 25, false),

-- Mastery
('topic_master', 'Topic Master', 'Reach 100% mastery on a topic', 'Target', 'mastery', 'topic_mastery', 100, 200, false),
('perfect_score', 'Perfect Score', 'Get 100% on a mock test', 'Star', 'mastery', 'perfect_test', 1, 150, false),
('speed_demon', 'Speed Demon', 'Complete a test in under 5 minutes', 'Zap', 'mastery', 'fast_test', 1, 75, false),
('test_ace', 'Test Ace', 'Complete 10 mock tests', 'ClipboardCheck', 'mastery', 'tests_completed', 10, 150, false),

-- Social (Pro only)
('test_creator', 'Test Creator', 'Create your first shared test', 'PenTool', 'social', 'tests_created', 1, 100, true),
('popular_test', 'Popular Test', 'Have 10 people take your test', 'Users', 'social', 'test_attempts_received', 10, 250, true);

-- =============================================
-- SEED DATA: Initial Rewards
-- =============================================
INSERT INTO public.rewards (slug, name, description, image_url, xp_cost, category, is_pro_only, is_active) VALUES
-- Digital Rewards
('dark_theme', 'Dark Scholar Theme', 'Unlock a sleek dark theme for your dashboard', NULL, 500, 'digital', false, true),
('gold_badge_frame', 'Gold Badge Frame', 'A golden frame for your profile badges', NULL, 750, 'digital', false, true),
('custom_avatar_pack', 'Avatar Pack', 'Unlock 10 exclusive avatar options', NULL, 1000, 'digital', false, true),
('streak_shield', 'Streak Shield', 'Get an extra streak protection per week', NULL, 1500, 'digital', true, true),
('xp_multiplier', 'XP Boost Week', 'Earn 1.5x XP for one week', NULL, 2000, 'digital', true, true),

-- Real World Rewards (Pro only, placeholders)
('coffee_gift', 'Coffee Gift Card', '$5 coffee gift card for dedicated learners', NULL, 5000, 'real_world', true, true),
('study_supplies', 'Study Supplies Kit', 'Notebook, pens, and highlighters', NULL, 10000, 'real_world', true, true);