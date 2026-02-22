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
  interest_topics public.math_topic[] NOT NULL DEFAULT '{}',
  
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
  practice_problems_completed int NOT NULL DEFAULT 0,
  
  CONSTRAINT current_streak_non_negative CHECK (current_streak >= 0),
  CONSTRAINT longest_streak_non_negative CHECK (longest_streak >= 0),
  CONSTRAINT problems_solved_today_non_negative CHECK (problems_solved_today >= 0),
  CONSTRAINT total_problems_solved_non_negative CHECK (total_problems_solved >= 0),
  CONSTRAINT practice_problems_completed_non_negative CHECK (practice_problems_completed >= 0)
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

-- User media library for storing images and voice recordings
CREATE TABLE IF NOT EXISTS private.user_media (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id uuid NOT NULL REFERENCES private.profile(id) ON DELETE CASCADE,
  media_type public.media_type NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  file_size_bytes int,
  duration_in_ms int,
  transcription text,
  title text,
  is_favorite boolean NOT NULL DEFAULT false,
  last_used_at timestamptz,
  use_count int NOT NULL DEFAULT 0,
  
  CONSTRAINT file_name_max_length CHECK (char_length(file_name) <= 255),
  CONSTRAINT title_max_length CHECK (char_length(title) <= 100),
  CONSTRAINT transcription_max_length CHECK (char_length(transcription) <= 5000),
  CONSTRAINT file_size_non_negative CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
  CONSTRAINT duration_non_negative CHECK (duration_in_ms IS NULL OR duration_in_ms >= 0),
  CONSTRAINT use_count_non_negative CHECK (use_count >= 0)
);

CREATE INDEX IF NOT EXISTS user_media_idx_user_id ON private.user_media(user_id);
CREATE INDEX IF NOT EXISTS user_media_idx_user_type ON private.user_media(user_id, media_type);
CREATE INDEX IF NOT EXISTS user_media_idx_user_favorite ON private.user_media(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS user_media_idx_user_last_used ON private.user_media(user_id, last_used_at DESC NULLS LAST);

-- Lumina-specific conversation extension
-- Extends the base conversation table with Lumina app specific fields
CREATE TABLE IF NOT EXISTS private.lumina_conversation (
  id uuid NOT NULL PRIMARY KEY REFERENCES private.conversation(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  title text,
  topic public.math_topic,
  problem_image_url text,
  problem_voice_url text,
  problem_transcription text,
  source_media_id uuid REFERENCES private.user_media(id) ON DELETE SET NULL,
  status public.problem_status NOT NULL DEFAULT 'IN_PROGRESS',
  
  CONSTRAINT title_max_length CHECK (char_length(title) <= 100),
  CONSTRAINT problem_transcription_max_length CHECK (char_length(problem_transcription) <= 5000)
);

-- Problem attempt tracking
CREATE TABLE IF NOT EXISTS private.problem_attempt (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id uuid NOT NULL REFERENCES private.profile(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES private.conversation(id) ON DELETE SET NULL,
  problem_image_url text,
  problem_voice_url text,
  source_media_id uuid REFERENCES private.user_media(id) ON DELETE SET NULL,
  extracted_problem text,
  topic public.math_topic,
  was_correct_first_try boolean NOT NULL DEFAULT false,
  processed_locally boolean NOT NULL DEFAULT true,
  processing_time_in_ms int,
  attempted_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT extracted_problem_max_length CHECK (char_length(extracted_problem) <= 500),
  CONSTRAINT processing_time_range CHECK (processing_time_in_ms IS NULL OR (processing_time_in_ms >= 0 AND processing_time_in_ms <= 30000)),
  CONSTRAINT has_media_source CHECK (problem_image_url IS NOT NULL OR problem_voice_url IS NOT NULL OR source_media_id IS NOT NULL)
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

-- Detailed mistake tracking for personalized practice
CREATE TABLE IF NOT EXISTS private.user_mistake (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id uuid NOT NULL REFERENCES private.profile(id) ON DELETE CASCADE,
  problem_attempt_id uuid REFERENCES private.problem_attempt(id) ON DELETE SET NULL,
  topic public.math_topic NOT NULL,
  mistake_category public.mistake_category NOT NULL DEFAULT 'OTHER',
  problem_text text NOT NULL,
  incorrect_answer text,
  correct_answer text,
  explanation text,
  occurrence_count int NOT NULL DEFAULT 1,
  last_occurred_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  
  CONSTRAINT problem_text_max_length CHECK (char_length(problem_text) <= 1000),
  CONSTRAINT incorrect_answer_max_length CHECK (char_length(incorrect_answer) <= 500),
  CONSTRAINT correct_answer_max_length CHECK (char_length(correct_answer) <= 500),
  CONSTRAINT explanation_max_length CHECK (char_length(explanation) <= 2000),
  CONSTRAINT occurrence_count_positive CHECK (occurrence_count >= 1)
);

CREATE INDEX IF NOT EXISTS user_mistake_idx_user_id ON private.user_mistake(user_id);
CREATE INDEX IF NOT EXISTS user_mistake_idx_user_topic ON private.user_mistake(user_id, topic);
CREATE INDEX IF NOT EXISTS user_mistake_idx_user_unresolved ON private.user_mistake(user_id, is_resolved) WHERE is_resolved = false;
CREATE INDEX IF NOT EXISTS user_mistake_idx_user_category ON private.user_mistake(user_id, mistake_category);

-- Practice problems generated for users
CREATE TABLE IF NOT EXISTS private.practice_problem (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id uuid NOT NULL REFERENCES private.profile(id) ON DELETE CASCADE,
  topic public.math_topic NOT NULL,
  difficulty public.difficulty_level NOT NULL DEFAULT 'MEDIUM',
  source public.practice_source NOT NULL,
  source_mistake_id uuid REFERENCES private.user_mistake(id) ON DELETE SET NULL,
  problem_text text NOT NULL,
  hint text,
  solution text NOT NULL,
  solution_steps text[],
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  was_correct boolean,
  user_answer text,
  time_spent_in_ms int,
  
  CONSTRAINT problem_text_max_length CHECK (char_length(problem_text) <= 1000),
  CONSTRAINT hint_max_length CHECK (char_length(hint) <= 500),
  CONSTRAINT solution_max_length CHECK (char_length(solution) <= 1000),
  CONSTRAINT user_answer_max_length CHECK (char_length(user_answer) <= 500),
  CONSTRAINT time_spent_non_negative CHECK (time_spent_in_ms IS NULL OR time_spent_in_ms >= 0)
);

CREATE INDEX IF NOT EXISTS practice_problem_idx_user_id ON private.practice_problem(user_id);
CREATE INDEX IF NOT EXISTS practice_problem_idx_user_topic ON private.practice_problem(user_id, topic);
CREATE INDEX IF NOT EXISTS practice_problem_idx_user_incomplete ON private.practice_problem(user_id, is_completed) WHERE is_completed = false;
CREATE INDEX IF NOT EXISTS practice_problem_idx_user_source ON private.practice_problem(user_id, source);

-- Practice session tracking
CREATE TABLE IF NOT EXISTS private.practice_session (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id uuid NOT NULL REFERENCES private.profile(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at timestamptz,
  problems_attempted int NOT NULL DEFAULT 0,
  problems_correct int NOT NULL DEFAULT 0,
  total_time_in_ms int NOT NULL DEFAULT 0,
  topics_practiced public.math_topic[] NOT NULL DEFAULT '{}',
  
  CONSTRAINT problems_attempted_non_negative CHECK (problems_attempted >= 0),
  CONSTRAINT problems_correct_non_negative CHECK (problems_correct >= 0),
  CONSTRAINT total_time_non_negative CHECK (total_time_in_ms >= 0)
);

CREATE INDEX IF NOT EXISTS practice_session_idx_user_id ON private.practice_session(user_id);
CREATE INDEX IF NOT EXISTS practice_session_idx_user_date ON private.practice_session(user_id, started_at DESC);
