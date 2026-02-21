-- Lumina-specific profile extension
-- Extends the base profile table with Lumina app specific fields
CREATE TABLE IF NOT EXISTS private.lumina_profile (
  id uuid NOT NULL PRIMARY KEY REFERENCES private.profile(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  grade_level public.grade_level NOT NULL,
  onboarding_completed boolean NOT NULL DEFAULT false
);

-- User learning preferences
CREATE TABLE IF NOT EXISTS private.user_preferences (
  id uuid NOT NULL PRIMARY KEY REFERENCES private.profile(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  struggle_topics public.math_topic[] NOT NULL DEFAULT '{}',
  learning_concerns text,
  notifications_enabled boolean NOT NULL DEFAULT true,
  
  CONSTRAINT struggle_topics_not_empty CHECK (array_length(struggle_topics, 1) >= 1 OR array_length(struggle_topics, 1) IS NULL),
  CONSTRAINT learning_concerns_max_length CHECK (char_length(learning_concerns) <= 100)
);

-- User progress tracking
CREATE TABLE IF NOT EXISTS private.user_progress (
  id uuid NOT NULL PRIMARY KEY REFERENCES private.profile(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  current_streak int NOT NULL DEFAULT 0,
  longest_streak int NOT NULL DEFAULT 0,
  problems_solved_today int NOT NULL DEFAULT 0,
  total_problems_solved int NOT NULL DEFAULT 0,
  last_active_date date,
  
  CONSTRAINT current_streak_non_negative CHECK (current_streak >= 0),
  CONSTRAINT longest_streak_non_negative CHECK (longest_streak >= 0),
  CONSTRAINT problems_solved_today_non_negative CHECK (problems_solved_today >= 0),
  CONSTRAINT total_problems_solved_non_negative CHECK (total_problems_solved >= 0)
);

-- Topic mastery tracking per user per topic
CREATE TABLE IF NOT EXISTS private.topic_mastery (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id uuid NOT NULL REFERENCES private.profile(id) ON DELETE CASCADE,
  topic public.math_topic NOT NULL,
  mastery_percentage real NOT NULL DEFAULT 0,
  problems_attempted int NOT NULL DEFAULT 0,
  problems_correct int NOT NULL DEFAULT 0,
  
  CONSTRAINT mastery_percentage_range CHECK (mastery_percentage >= 0 AND mastery_percentage <= 100),
  CONSTRAINT problems_attempted_non_negative CHECK (problems_attempted >= 0),
  CONSTRAINT problems_correct_non_negative CHECK (problems_correct >= 0),
  UNIQUE(user_id, topic)
);

CREATE INDEX IF NOT EXISTS topic_mastery_idx_user_id ON private.topic_mastery(user_id);

-- User achievements
CREATE TABLE IF NOT EXISTS private.achievement (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id uuid NOT NULL REFERENCES private.profile(id) ON DELETE CASCADE,
  achievement_type public.achievement_type NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_new boolean NOT NULL DEFAULT true,
  
  UNIQUE(user_id, achievement_type)
);

CREATE INDEX IF NOT EXISTS achievement_idx_user_id ON private.achievement(user_id);

-- Lumina-specific conversation extension
-- Extends the base conversation table with Lumina app specific fields
CREATE TABLE IF NOT EXISTS private.lumina_conversation (
  id uuid NOT NULL PRIMARY KEY REFERENCES private.conversation(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  title text,
  topic public.math_topic,
  problem_image_url text,
  status public.problem_status NOT NULL DEFAULT 'IN_PROGRESS',
  
  CONSTRAINT title_max_length CHECK (char_length(title) <= 100)
);

-- Problem attempt tracking
CREATE TABLE IF NOT EXISTS private.problem_attempt (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id uuid NOT NULL REFERENCES private.profile(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES private.conversation(id) ON DELETE SET NULL,
  problem_image_url text NOT NULL,
  extracted_problem text,
  topic public.math_topic,
  was_correct_first_try boolean NOT NULL DEFAULT false,
  processed_locally boolean NOT NULL DEFAULT true,
  processing_time_in_ms int,
  attempted_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT extracted_problem_max_length CHECK (char_length(extracted_problem) <= 500),
  CONSTRAINT processing_time_range CHECK (processing_time_in_ms IS NULL OR (processing_time_in_ms >= 0 AND processing_time_in_ms <= 30000))
);

CREATE INDEX IF NOT EXISTS problem_attempt_idx_user_id ON private.problem_attempt(user_id);
CREATE INDEX IF NOT EXISTS problem_attempt_idx_conversation_id ON private.problem_attempt(conversation_id) WHERE conversation_id IS NOT NULL;

-- Streak history for calendar heatmap
CREATE TABLE IF NOT EXISTS private.streak_history (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id uuid NOT NULL REFERENCES private.profile(id) ON DELETE CASCADE,
  date date NOT NULL,
  problems_solved int NOT NULL DEFAULT 0,
  was_active boolean NOT NULL DEFAULT false,
  
  CONSTRAINT problems_solved_non_negative CHECK (problems_solved >= 0),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS streak_history_idx_user_id ON private.streak_history(user_id);
CREATE INDEX IF NOT EXISTS streak_history_idx_user_date ON private.streak_history(user_id, date);
