-- =====================
-- LUMINA PROFILE FUNCTIONS
-- =====================

-- Read Lumina profile for current user
CREATE OR REPLACE FUNCTION public."app:lumina:profile:read"()
RETURNS public."LuminaProfileV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  lp.id,
  lp.created_at,
  lp.updated_at,
  lp.grade_level,
  lp.onboarding_completed
)::public."LuminaProfileV1"
FROM private.lumina_profile lp
WHERE lp.id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:profile:read" TO authenticated;

-- Create or update Lumina profile
CREATE OR REPLACE FUNCTION public."app:lumina:profile:upsert"(
  "gradeLevel" public.grade_level,
  "onboardingCompleted" boolean DEFAULT false
)
RETURNS public."LuminaProfileV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  _result public."LuminaProfileV1";
BEGIN
  IF "gradeLevel" IS NULL THEN
    RAISE EXCEPTION 'gradeLevel cannot be null';
  END IF;
  
  INSERT INTO private.lumina_profile (id, grade_level, onboarding_completed)
  VALUES (auth.uid(), "gradeLevel", COALESCE("onboardingCompleted", false))
  ON CONFLICT (id) DO UPDATE SET
    grade_level = EXCLUDED.grade_level,
    onboarding_completed = EXCLUDED.onboarding_completed,
    updated_at = CURRENT_TIMESTAMP
  RETURNING ROW(
    id,
    created_at,
    updated_at,
    grade_level,
    onboarding_completed
  )::public."LuminaProfileV1"
  INTO _result;
  
  RETURN _result;
END;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:profile:upsert" TO authenticated;

-- Update onboarding completed status
CREATE OR REPLACE FUNCTION public."app:lumina:profile:completeOnboarding"()
RETURNS public."LuminaProfileV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE sql
AS $$
UPDATE private.lumina_profile
SET onboarding_completed = true, updated_at = CURRENT_TIMESTAMP
WHERE id = auth.uid()
RETURNING ROW(
  id,
  created_at,
  updated_at,
  grade_level,
  onboarding_completed
)::public."LuminaProfileV1";
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:profile:completeOnboarding" TO authenticated;

-- =====================
-- USER PREFERENCES FUNCTIONS
-- =====================

-- Read user preferences
CREATE OR REPLACE FUNCTION public."app:lumina:preferences:read"()
RETURNS public."UserPreferencesV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  up.id,
  up.created_at,
  up.updated_at,
  up.struggle_topics,
  up.learning_concerns,
  up.notifications_enabled
)::public."UserPreferencesV1"
FROM private.user_preferences up
WHERE up.id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:preferences:read" TO authenticated;

-- Create or update user preferences
CREATE OR REPLACE FUNCTION public."app:lumina:preferences:upsert"(
  "struggleTopics" public.math_topic[],
  "learningConcerns" text DEFAULT NULL,
  "notificationsEnabled" boolean DEFAULT true
)
RETURNS public."UserPreferencesV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE sql
AS $$
INSERT INTO private.user_preferences (id, struggle_topics, learning_concerns, notifications_enabled)
VALUES (auth.uid(), COALESCE("struggleTopics", '{}'::public.math_topic[]), "learningConcerns", COALESCE("notificationsEnabled", true))
ON CONFLICT (id) DO UPDATE SET
  struggle_topics = EXCLUDED.struggle_topics,
  learning_concerns = EXCLUDED.learning_concerns,
  notifications_enabled = EXCLUDED.notifications_enabled,
  updated_at = CURRENT_TIMESTAMP
RETURNING ROW(
  id,
  created_at,
  updated_at,
  struggle_topics,
  learning_concerns,
  notifications_enabled
)::public."UserPreferencesV1";
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:preferences:upsert" TO authenticated;

-- =====================
-- USER PROGRESS FUNCTIONS
-- =====================

-- Read user progress
CREATE OR REPLACE FUNCTION public."app:lumina:progress:read"()
RETURNS public."UserProgressV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  up.id,
  up.created_at,
  up.updated_at,
  up.current_streak,
  up.longest_streak,
  up.problems_solved_today,
  up.total_problems_solved,
  up.last_active_date
)::public."UserProgressV1"
FROM private.user_progress up
WHERE up.id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:progress:read" TO authenticated;

-- Initialize user progress (called during onboarding)
CREATE OR REPLACE FUNCTION public."app:lumina:progress:init"()
RETURNS public."UserProgressV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE sql
AS $$
INSERT INTO private.user_progress (id)
VALUES (auth.uid())
ON CONFLICT (id) DO NOTHING
RETURNING ROW(
  id,
  created_at,
  updated_at,
  current_streak,
  longest_streak,
  problems_solved_today,
  total_problems_solved,
  last_active_date
)::public."UserProgressV1";
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:progress:init" TO authenticated;

-- Record a problem solved (updates progress and streak)
CREATE OR REPLACE FUNCTION public."app:lumina:progress:recordProblemSolved"()
RETURNS public."UserProgressV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  _today date NOT NULL := CURRENT_DATE;
  _result public."UserProgressV1";
  _last_active date;
  _new_streak int;
BEGIN
  -- Get current last active date
  SELECT last_active_date INTO _last_active
  FROM private.user_progress
  WHERE id = auth.uid();

  -- Calculate new streak
  IF _last_active IS NULL OR _last_active < _today - 1 THEN
    _new_streak := 1;
  ELSIF _last_active = _today - 1 THEN
    SELECT current_streak + 1 INTO _new_streak
    FROM private.user_progress
    WHERE id = auth.uid();
  ELSE
    SELECT current_streak INTO _new_streak
    FROM private.user_progress
    WHERE id = auth.uid();
  END IF;

  -- Update progress
  UPDATE private.user_progress
  SET
    current_streak = _new_streak,
    longest_streak = GREATEST(longest_streak, _new_streak),
    problems_solved_today = CASE 
      WHEN last_active_date = _today THEN problems_solved_today + 1
      ELSE 1
    END,
    total_problems_solved = total_problems_solved + 1,
    last_active_date = _today,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = auth.uid()
  RETURNING ROW(
    id,
    created_at,
    updated_at,
    current_streak,
    longest_streak,
    problems_solved_today,
    total_problems_solved,
    last_active_date
  )::public."UserProgressV1" INTO _result;

  -- Update or insert streak history
  INSERT INTO private.streak_history (user_id, date, problems_solved, was_active)
  VALUES (auth.uid(), _today, 1, true)
  ON CONFLICT (user_id, date) DO UPDATE SET
    problems_solved = private.streak_history.problems_solved + 1,
    was_active = true,
    updated_at = CURRENT_TIMESTAMP;

  RETURN _result;
END;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:progress:recordProblemSolved" TO authenticated;

-- =====================
-- TOPIC MASTERY FUNCTIONS
-- =====================

-- Read all topic masteries for current user
CREATE OR REPLACE FUNCTION public."app:lumina:topicMastery:readAll"()
RETURNS SETOF public."TopicMasteryV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  tm.id,
  tm.created_at,
  tm.updated_at,
  tm.user_id,
  tm.topic,
  tm.mastery_percentage,
  tm.problems_attempted,
  tm.problems_correct
)::public."TopicMasteryV1"
FROM private.topic_mastery tm
WHERE tm.user_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:topicMastery:readAll" TO authenticated;

-- Update topic mastery after problem attempt
CREATE OR REPLACE FUNCTION public."app:lumina:topicMastery:recordAttempt"(
  "topic" public.math_topic,
  "wasCorrect" boolean
)
RETURNS public."TopicMasteryV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  _result public."TopicMasteryV1";
BEGIN
  IF "topic" IS NULL THEN
    RAISE EXCEPTION 'topic cannot be null';
  END IF;
  
  INSERT INTO private.topic_mastery (user_id, topic, problems_attempted, problems_correct, mastery_percentage)
  VALUES (
    auth.uid(),
    "topic",
    1,
    CASE WHEN "wasCorrect" THEN 1 ELSE 0 END,
    CASE WHEN "wasCorrect" THEN 100.0 ELSE 0.0 END
  )
  ON CONFLICT (user_id, topic) DO UPDATE SET
    problems_attempted = private.topic_mastery.problems_attempted + 1,
    problems_correct = private.topic_mastery.problems_correct + CASE WHEN "wasCorrect" THEN 1 ELSE 0 END,
    mastery_percentage = (
      (private.topic_mastery.problems_correct + CASE WHEN "wasCorrect" THEN 1 ELSE 0 END)::real /
      (private.topic_mastery.problems_attempted + 1)::real
    ) * 100.0,
    updated_at = CURRENT_TIMESTAMP
  RETURNING ROW(
    id,
    created_at,
    updated_at,
    user_id,
    topic,
    mastery_percentage,
    problems_attempted,
    problems_correct
  )::public."TopicMasteryV1"
  INTO _result;
  
  RETURN _result;
END;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:topicMastery:recordAttempt" TO authenticated;

-- =====================
-- ACHIEVEMENT FUNCTIONS
-- =====================

-- Read all achievements for current user
CREATE OR REPLACE FUNCTION public."app:lumina:achievement:readAll"()
RETURNS SETOF public."AchievementV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  a.id,
  a.created_at,
  a.updated_at,
  a.user_id,
  a.achievement_type,
  a.earned_at,
  a.is_new
)::public."AchievementV1"
FROM private.achievement a
WHERE a.user_id = auth.uid()
ORDER BY a.earned_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:achievement:readAll" TO authenticated;

-- Award an achievement
CREATE OR REPLACE FUNCTION public."app:lumina:achievement:award"(
  "achievementType" public.achievement_type
)
RETURNS public."AchievementV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  _result public."AchievementV1";
BEGIN
  IF "achievementType" IS NULL THEN
    RETURN NULL;
  END IF;
  
  INSERT INTO private.achievement (user_id, achievement_type)
  VALUES (auth.uid(), "achievementType")
  ON CONFLICT (user_id, achievement_type) DO NOTHING
  RETURNING ROW(
    id,
    created_at,
    updated_at,
    user_id,
    achievement_type,
    earned_at,
    is_new
  )::public."AchievementV1"
  INTO _result;
  
  RETURN _result;
END;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:achievement:award" TO authenticated;

-- Mark achievement as viewed
CREATE OR REPLACE FUNCTION public."app:lumina:achievement:markViewed"(
  "achievementId" uuid
)
RETURNS public."AchievementV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE sql
AS $$
UPDATE private.achievement
SET is_new = false, updated_at = CURRENT_TIMESTAMP
WHERE id = "achievementId" AND user_id = auth.uid()
RETURNING ROW(
  id,
  created_at,
  updated_at,
  user_id,
  achievement_type,
  earned_at,
  is_new
)::public."AchievementV1";
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:achievement:markViewed" TO authenticated;

-- =====================
-- LUMINA CONVERSATION FUNCTIONS
-- =====================

-- Read Lumina conversation data
CREATE OR REPLACE FUNCTION public."app:lumina:conversation:read"(
  "conversationId" uuid
)
RETURNS public."LuminaConversationV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  lc.id,
  lc.created_at,
  lc.updated_at,
  lc.title,
  lc.topic,
  lc.problem_image_url,
  lc.status
)::public."LuminaConversationV1"
FROM private.lumina_conversation lc
JOIN private.conversation c ON c.id = lc.id
WHERE lc.id = "conversationId"
AND (
  c.owner_entity_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM private.conversation_participant cp
    WHERE cp.conversation_id = c.id
    AND cp.entity_id = auth.uid()
    AND cp.deactivated_at IS NULL
  )
);
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:conversation:read" TO authenticated;

-- Create or update Lumina conversation data
CREATE OR REPLACE FUNCTION public."app:lumina:conversation:upsert"(
  "conversationId" uuid,
  "title" text DEFAULT NULL,
  "topic" public.math_topic DEFAULT NULL,
  "problemImageUrl" text DEFAULT NULL,
  "status" public.problem_status DEFAULT 'IN_PROGRESS'
)
RETURNS public."LuminaConversationV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  _result public."LuminaConversationV1";
BEGIN
  IF "conversationId" IS NULL THEN
    RETURN NULL;
  END IF;
  
  INSERT INTO private.lumina_conversation (id, title, topic, problem_image_url, status)
  SELECT "conversationId", "title", "topic", "problemImageUrl", COALESCE("status", 'IN_PROGRESS'::public.problem_status)
  WHERE EXISTS (
    SELECT 1 FROM private.conversation c
    WHERE c.id = "conversationId"
    AND (
      c.owner_entity_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM private.conversation_participant cp
        WHERE cp.conversation_id = c.id
        AND cp.entity_id = auth.uid()
        AND cp.deactivated_at IS NULL
      )
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    title = COALESCE(EXCLUDED.title, private.lumina_conversation.title),
    topic = COALESCE(EXCLUDED.topic, private.lumina_conversation.topic),
    problem_image_url = COALESCE(EXCLUDED.problem_image_url, private.lumina_conversation.problem_image_url),
    status = COALESCE(EXCLUDED.status, private.lumina_conversation.status),
    updated_at = CURRENT_TIMESTAMP
  RETURNING ROW(
    id,
    created_at,
    updated_at,
    title,
    topic,
    problem_image_url,
    status
  )::public."LuminaConversationV1"
  INTO _result;
  
  RETURN _result;
END;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:conversation:upsert" TO authenticated;

-- Read all conversations with Lumina data for current user
CREATE OR REPLACE FUNCTION public."app:lumina:conversation:readAll"()
RETURNS SETOF public."ConversationWithLuminaV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  ROW(c.*)::public."ConversationV1",
  CASE WHEN lc.id IS NOT NULL THEN
    (SELECT ROW(
      ilc.id,
      ilc.created_at,
      ilc.updated_at,
      ilc.title,
      ilc.topic,
      ilc.problem_image_url,
      ilc.status
    )::public."LuminaConversationV1"
    FROM private.lumina_conversation ilc
    WHERE ilc.id = c.id)
  ELSE NULL
  END
)::public."ConversationWithLuminaV1"
FROM private.conversation c
LEFT JOIN private.lumina_conversation lc ON lc.id = c.id
WHERE c.owner_entity_id = auth.uid()
OR EXISTS (
  SELECT 1 FROM private.conversation_participant cp
  WHERE cp.conversation_id = c.id
  AND cp.entity_id = auth.uid()
  AND cp.deactivated_at IS NULL
)
ORDER BY c.updated_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:conversation:readAll" TO authenticated;

-- =====================
-- PROBLEM ATTEMPT FUNCTIONS
-- =====================

-- Create a problem attempt
CREATE OR REPLACE FUNCTION public."app:lumina:problemAttempt:create"(
  "problemImageUrl" text,
  "conversationId" uuid DEFAULT NULL,
  "extractedProblem" text DEFAULT NULL,
  "topic" public.math_topic DEFAULT NULL,
  "wasCorrectFirstTry" boolean DEFAULT false,
  "processedLocally" boolean DEFAULT true,
  "processingTimeInMs" int DEFAULT NULL
)
RETURNS public."ProblemAttemptV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  _result public."ProblemAttemptV1";
BEGIN
  IF "problemImageUrl" IS NULL THEN
    RAISE EXCEPTION 'problemImageUrl cannot be null';
  END IF;
  
  INSERT INTO private.problem_attempt (
    user_id,
    conversation_id,
    problem_image_url,
    extracted_problem,
    topic,
    was_correct_first_try,
    processed_locally,
    processing_time_in_ms
  )
  VALUES (
    auth.uid(),
    "conversationId",
    "problemImageUrl",
    "extractedProblem",
    "topic",
    COALESCE("wasCorrectFirstTry", false),
    COALESCE("processedLocally", true),
    "processingTimeInMs"
  )
  RETURNING ROW(
    id,
    created_at,
    updated_at,
    user_id,
    conversation_id,
    problem_image_url,
    extracted_problem,
    topic,
    was_correct_first_try,
    processed_locally,
    processing_time_in_ms,
    attempted_at
  )::public."ProblemAttemptV1"
  INTO _result;
  
  RETURN _result;
END;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:problemAttempt:create" TO authenticated;

-- Read recent problem attempts
CREATE OR REPLACE FUNCTION public."app:lumina:problemAttempt:readRecent"(
  "limit" int DEFAULT 10
)
RETURNS SETOF public."ProblemAttemptV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  pa.id,
  pa.created_at,
  pa.updated_at,
  pa.user_id,
  pa.conversation_id,
  pa.problem_image_url,
  pa.extracted_problem,
  pa.topic,
  pa.was_correct_first_try,
  pa.processed_locally,
  pa.processing_time_in_ms,
  pa.attempted_at
)::public."ProblemAttemptV1"
FROM private.problem_attempt pa
WHERE pa.user_id = auth.uid()
ORDER BY pa.attempted_at DESC
LIMIT "limit";
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:problemAttempt:readRecent" TO authenticated;

-- =====================
-- STREAK HISTORY FUNCTIONS
-- =====================

-- Read streak history for date range
CREATE OR REPLACE FUNCTION public."app:lumina:streakHistory:read"(
  "startDate" date DEFAULT CURRENT_DATE - 30,
  "endDate" date DEFAULT CURRENT_DATE
)
RETURNS SETOF public."StreakHistoryV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  sh.id,
  sh.created_at,
  sh.updated_at,
  sh.user_id,
  sh.date,
  sh.problems_solved,
  sh.was_active
)::public."StreakHistoryV1"
FROM private.streak_history sh
WHERE sh.user_id = auth.uid()
AND sh.date >= "startDate"
AND sh.date <= "endDate"
ORDER BY sh.date ASC;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:streakHistory:read" TO authenticated;

-- =====================
-- COMBINED DATA FUNCTIONS
-- =====================

-- Get home screen data bundle
CREATE OR REPLACE FUNCTION public."app:lumina:home:read"()
RETURNS public."LuminaHomeDataV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  (SELECT p.given_name FROM private.profile p WHERE p.id = auth.uid()),
  COALESCE((SELECT up.current_streak FROM private.user_progress up WHERE up.id = auth.uid()), 0),
  COALESCE((SELECT up.problems_solved_today FROM private.user_progress up WHERE up.id = auth.uid()), 0),
  COALESCE(
    ARRAY(
      SELECT ROW(
        ROW(c.*)::public."ConversationV1",
        CASE WHEN lc.id IS NOT NULL THEN
          (SELECT ROW(
            ilc.id,
            ilc.created_at,
            ilc.updated_at,
            ilc.title,
            ilc.topic,
            ilc.problem_image_url,
            ilc.status
          )::public."LuminaConversationV1"
          FROM private.lumina_conversation ilc
          WHERE ilc.id = c.id)
        ELSE NULL
        END
      )::public."ConversationWithLuminaV1"
      FROM private.conversation c
      LEFT JOIN private.lumina_conversation lc ON lc.id = c.id
      WHERE c.owner_entity_id = auth.uid()
      ORDER BY c.updated_at DESC
      LIMIT 3
    ),
    '{}'::public."ConversationWithLuminaV1"[]
  )
)::public."LuminaHomeDataV1";
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:home:read" TO authenticated;

-- Get progress screen data bundle
CREATE OR REPLACE FUNCTION public."app:lumina:progressData:read"()
RETURNS public."LuminaProgressDataV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  (SELECT ROW(up.*)::public."UserProgressV1" FROM private.user_progress up WHERE up.id = auth.uid()),
  COALESCE(
    ARRAY(
      SELECT ROW(
        a.id,
        a.created_at,
        a.updated_at,
        a.user_id,
        a.achievement_type,
        a.earned_at,
        a.is_new
      )::public."AchievementV1"
      FROM private.achievement a
      WHERE a.user_id = auth.uid()
      ORDER BY a.earned_at DESC
    ),
    '{}'::public."AchievementV1"[]
  ),
  COALESCE(
    ARRAY(
      SELECT ROW(
        tm.id,
        tm.created_at,
        tm.updated_at,
        tm.user_id,
        tm.topic,
        tm.mastery_percentage,
        tm.problems_attempted,
        tm.problems_correct
      )::public."TopicMasteryV1"
      FROM private.topic_mastery tm
      WHERE tm.user_id = auth.uid()
    ),
    '{}'::public."TopicMasteryV1"[]
  ),
  COALESCE(
    ARRAY(
      SELECT ROW(
        sh.id,
        sh.created_at,
        sh.updated_at,
        sh.user_id,
        sh.date,
        sh.problems_solved,
        sh.was_active
      )::public."StreakHistoryV1"
      FROM private.streak_history sh
      WHERE sh.user_id = auth.uid()
      AND sh.date >= CURRENT_DATE - 30
      ORDER BY sh.date ASC
    ),
    '{}'::public."StreakHistoryV1"[]
  )
)::public."LuminaProgressDataV1";
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:progressData:read" TO authenticated;

-- Complete onboarding (creates all necessary records)
CREATE OR REPLACE FUNCTION public."app:lumina:onboarding:complete"(
  "givenName" text,
  "gradeLevel" public.grade_level,
  "struggleTopics" public.math_topic[],
  "learningConcerns" text DEFAULT NULL
)
RETURNS public."ProfileWithLuminaV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update base profile with given name
  UPDATE private.profile
  SET given_name = "givenName", updated_at = CURRENT_TIMESTAMP
  WHERE id = auth.uid();

  -- Create/update Lumina profile
  INSERT INTO private.lumina_profile (id, grade_level, onboarding_completed)
  VALUES (auth.uid(), "gradeLevel", true)
  ON CONFLICT (id) DO UPDATE SET
    grade_level = EXCLUDED.grade_level,
    onboarding_completed = true,
    updated_at = CURRENT_TIMESTAMP;

  -- Create/update preferences
  INSERT INTO private.user_preferences (id, struggle_topics, learning_concerns, notifications_enabled)
  VALUES (auth.uid(), "struggleTopics", "learningConcerns", true)
  ON CONFLICT (id) DO UPDATE SET
    struggle_topics = EXCLUDED.struggle_topics,
    learning_concerns = EXCLUDED.learning_concerns,
    updated_at = CURRENT_TIMESTAMP;

  -- Initialize progress
  INSERT INTO private.user_progress (id)
  VALUES (auth.uid())
  ON CONFLICT (id) DO NOTHING;

  -- Build result with a single SELECT to avoid composite type casting issues
  -- with intermediate variables (PostgreSQL can fail when assigning composite
  -- type variables into another composite type via ROW())
  RETURN (
    SELECT ROW(
      ROW(p.id, p.created_at, p.updated_at, p.username, p.full_name, p.avatar_url, p.gender, p.given_name, p.family_name, p.birth_date)::public."ProfileV1",
      ROW(lp.id, lp.created_at, lp.updated_at, lp.grade_level, lp.onboarding_completed)::public."LuminaProfileV1",
      ROW(up.id, up.created_at, up.updated_at, up.struggle_topics, up.learning_concerns, up.notifications_enabled)::public."UserPreferencesV1",
      ROW(pr.id, pr.created_at, pr.updated_at, pr.current_streak, pr.longest_streak, pr.problems_solved_today, pr.total_problems_solved, pr.last_active_date)::public."UserProgressV1"
    )::public."ProfileWithLuminaV1"
    FROM private.profile p
    JOIN private.lumina_profile lp ON lp.id = p.id
    JOIN private.user_preferences up ON up.id = p.id
    JOIN private.user_progress pr ON pr.id = p.id
    WHERE p.id = auth.uid()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:onboarding:complete" TO authenticated;

-- Check if onboarding is completed
CREATE OR REPLACE FUNCTION public."app:lumina:onboarding:isCompleted"()
RETURNS boolean
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT COALESCE(
  (SELECT onboarding_completed FROM private.lumina_profile WHERE id = auth.uid()),
  false
);
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:onboarding:isCompleted" TO authenticated;

-- Read all conversations with preview text for chat history screen
CREATE OR REPLACE FUNCTION public."app:lumina:conversation:readAllWithPreview"()
RETURNS SETOF public."ConversationHistoryItemV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  c.id,
  c.created_at,
  c.updated_at,
  lc.topic,
  lc.problem_image_url,
  COALESCE(lc.status, 'IN_PROGRESS'::public.problem_status),
  (
    SELECT cm.content_text
    FROM private.conversation_message cm
    WHERE cm.conversation_id = c.id
    ORDER BY cm.created_at ASC
    LIMIT 1
  )
)::public."ConversationHistoryItemV1"
FROM private.conversation c
LEFT JOIN private.lumina_conversation lc ON lc.id = c.id
WHERE c.owner_entity_id = auth.uid()
OR EXISTS (
  SELECT 1 FROM private.conversation_participant cp
  WHERE cp.conversation_id = c.id
  AND cp.entity_id = auth.uid()
  AND cp.deactivated_at IS NULL
)
ORDER BY c.updated_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:conversation:readAllWithPreview" TO authenticated;

-- Delete a conversation (only owner can delete)
CREATE OR REPLACE FUNCTION public."app:lumina:conversation:delete"(
  "conversationId" uuid
)
RETURNS boolean
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  _deleted boolean;
BEGIN
  IF "conversationId" IS NULL THEN
    RETURN false;
  END IF;

  -- Only allow owner to delete
  DELETE FROM private.conversation
  WHERE id = "conversationId"
  AND owner_entity_id = auth.uid();

  GET DIAGNOSTICS _deleted = ROW_COUNT;
  RETURN _deleted > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:conversation:delete" TO authenticated;
