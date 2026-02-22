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
-- USER MEDIA LIBRARY FUNCTIONS
-- =====================

-- Create a new media entry
CREATE OR REPLACE FUNCTION public."app:lumina:media:create"(
  "mediaType" public.media_type,
  "storagePath" text,
  "fileName" text,
  "mimeType" text,
  "fileSizeBytes" int DEFAULT NULL,
  "durationInMs" int DEFAULT NULL,
  "transcription" text DEFAULT NULL,
  "title" text DEFAULT NULL
)
RETURNS public."UserMediaV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  _result public."UserMediaV1";
BEGIN
  IF "mediaType" IS NULL THEN
    RAISE EXCEPTION 'mediaType cannot be null';
  END IF;
  IF "storagePath" IS NULL THEN
    RAISE EXCEPTION 'storagePath cannot be null';
  END IF;
  IF "fileName" IS NULL THEN
    RAISE EXCEPTION 'fileName cannot be null';
  END IF;
  IF "mimeType" IS NULL THEN
    RAISE EXCEPTION 'mimeType cannot be null';
  END IF;
  
  INSERT INTO private.user_media (
    user_id,
    media_type,
    storage_path,
    file_name,
    mime_type,
    file_size_bytes,
    duration_in_ms,
    transcription,
    title
  )
  VALUES (
    auth.uid(),
    "mediaType",
    "storagePath",
    "fileName",
    "mimeType",
    "fileSizeBytes",
    "durationInMs",
    "transcription",
    "title"
  )
  RETURNING ROW(
    id,
    created_at,
    updated_at,
    user_id,
    media_type,
    storage_path,
    file_name,
    mime_type,
    file_size_bytes,
    duration_in_ms,
    transcription,
    title,
    is_favorite,
    last_used_at,
    use_count
  )::public."UserMediaV1"
  INTO _result;
  
  RETURN _result;
END;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:media:create" TO authenticated;

-- Read a single media entry by ID
CREATE OR REPLACE FUNCTION public."app:lumina:media:read"(
  "mediaId" uuid
)
RETURNS public."UserMediaV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  um.id,
  um.created_at,
  um.updated_at,
  um.user_id,
  um.media_type,
  um.storage_path,
  um.file_name,
  um.mime_type,
  um.file_size_bytes,
  um.duration_in_ms,
  um.transcription,
  um.title,
  um.is_favorite,
  um.last_used_at,
  um.use_count
)::public."UserMediaV1"
FROM private.user_media um
WHERE um.id = "mediaId"
AND um.user_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:media:read" TO authenticated;

-- Read all media for current user with optional type filter
CREATE OR REPLACE FUNCTION public."app:lumina:media:readAll"(
  "mediaType" public.media_type DEFAULT NULL,
  "limit" int DEFAULT 50,
  "offset" int DEFAULT 0
)
RETURNS SETOF public."UserMediaV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  um.id,
  um.created_at,
  um.updated_at,
  um.user_id,
  um.media_type,
  um.storage_path,
  um.file_name,
  um.mime_type,
  um.file_size_bytes,
  um.duration_in_ms,
  um.transcription,
  um.title,
  um.is_favorite,
  um.last_used_at,
  um.use_count
)::public."UserMediaV1"
FROM private.user_media um
WHERE um.user_id = auth.uid()
AND ("mediaType" IS NULL OR um.media_type = "mediaType")
ORDER BY um.created_at DESC
LIMIT "limit"
OFFSET "offset";
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:media:readAll" TO authenticated;

-- Read recent media (most recently used or created)
CREATE OR REPLACE FUNCTION public."app:lumina:media:readRecent"(
  "limit" int DEFAULT 10
)
RETURNS SETOF public."UserMediaV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  um.id,
  um.created_at,
  um.updated_at,
  um.user_id,
  um.media_type,
  um.storage_path,
  um.file_name,
  um.mime_type,
  um.file_size_bytes,
  um.duration_in_ms,
  um.transcription,
  um.title,
  um.is_favorite,
  um.last_used_at,
  um.use_count
)::public."UserMediaV1"
FROM private.user_media um
WHERE um.user_id = auth.uid()
ORDER BY COALESCE(um.last_used_at, um.created_at) DESC
LIMIT "limit";
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:media:readRecent" TO authenticated;

-- Read favorite media
CREATE OR REPLACE FUNCTION public."app:lumina:media:readFavorites"(
  "mediaType" public.media_type DEFAULT NULL
)
RETURNS SETOF public."UserMediaV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  um.id,
  um.created_at,
  um.updated_at,
  um.user_id,
  um.media_type,
  um.storage_path,
  um.file_name,
  um.mime_type,
  um.file_size_bytes,
  um.duration_in_ms,
  um.transcription,
  um.title,
  um.is_favorite,
  um.last_used_at,
  um.use_count
)::public."UserMediaV1"
FROM private.user_media um
WHERE um.user_id = auth.uid()
AND um.is_favorite = true
AND ("mediaType" IS NULL OR um.media_type = "mediaType")
ORDER BY um.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:media:readFavorites" TO authenticated;

-- Update media metadata
CREATE OR REPLACE FUNCTION public."app:lumina:media:update"(
  "mediaId" uuid,
  "title" text DEFAULT NULL,
  "transcription" text DEFAULT NULL,
  "isFavorite" boolean DEFAULT NULL
)
RETURNS public."UserMediaV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE sql
AS $$
UPDATE private.user_media
SET
  title = COALESCE("title", title),
  transcription = COALESCE("transcription", transcription),
  is_favorite = COALESCE("isFavorite", is_favorite),
  updated_at = CURRENT_TIMESTAMP
WHERE id = "mediaId"
AND user_id = auth.uid()
RETURNING ROW(
  id,
  created_at,
  updated_at,
  user_id,
  media_type,
  storage_path,
  file_name,
  mime_type,
  file_size_bytes,
  duration_in_ms,
  transcription,
  title,
  is_favorite,
  last_used_at,
  use_count
)::public."UserMediaV1";
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:media:update" TO authenticated;

-- Record media usage (increments use count and updates last used timestamp)
CREATE OR REPLACE FUNCTION public."app:lumina:media:recordUsage"(
  "mediaId" uuid
)
RETURNS public."UserMediaV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE sql
AS $$
UPDATE private.user_media
SET
  use_count = use_count + 1,
  last_used_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP
WHERE id = "mediaId"
AND user_id = auth.uid()
RETURNING ROW(
  id,
  created_at,
  updated_at,
  user_id,
  media_type,
  storage_path,
  file_name,
  mime_type,
  file_size_bytes,
  duration_in_ms,
  transcription,
  title,
  is_favorite,
  last_used_at,
  use_count
)::public."UserMediaV1";
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:media:recordUsage" TO authenticated;

-- Delete a media entry
CREATE OR REPLACE FUNCTION public."app:lumina:media:delete"(
  "mediaId" uuid
)
RETURNS boolean
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  _deleted boolean;
BEGIN
  IF "mediaId" IS NULL THEN
    RETURN false;
  END IF;

  DELETE FROM private.user_media
  WHERE id = "mediaId"
  AND user_id = auth.uid();

  GET DIAGNOSTICS _deleted = ROW_COUNT;
  RETURN _deleted > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:media:delete" TO authenticated;

-- Get media library summary
CREATE OR REPLACE FUNCTION public."app:lumina:media:summary"()
RETURNS public."MediaLibrarySummaryV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  COALESCE((
    SELECT COUNT(*)::int
    FROM private.user_media um
    WHERE um.user_id = auth.uid()
    AND um.media_type = 'IMAGE'::public.media_type
  ), 0),
  COALESCE((
    SELECT COUNT(*)::int
    FROM private.user_media um
    WHERE um.user_id = auth.uid()
    AND um.media_type = 'VOICE_RECORDING'::public.media_type
  ), 0),
  COALESCE(
    ARRAY(
      SELECT ROW(
        ROW(
          um.id,
          um.created_at,
          um.updated_at,
          um.user_id,
          um.media_type,
          um.storage_path,
          um.file_name,
          um.mime_type,
          um.file_size_bytes,
          um.duration_in_ms,
          um.transcription,
          um.title,
          um.is_favorite,
          um.last_used_at,
          um.use_count
        )::public."UserMediaV1",
        NULL::text
      )::public."UserMediaWithUrlV1"
      FROM private.user_media um
      WHERE um.user_id = auth.uid()
      ORDER BY COALESCE(um.last_used_at, um.created_at) DESC
      LIMIT 5
    ),
    '{}'::public."UserMediaWithUrlV1"[]
  )
)::public."MediaLibrarySummaryV1";
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:media:summary" TO authenticated;

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
  lc.problem_voice_url,
  lc.problem_transcription,
  lc.source_media_id,
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
  "problemVoiceUrl" text DEFAULT NULL,
  "problemTranscription" text DEFAULT NULL,
  "sourceMediaId" uuid DEFAULT NULL,
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
  
  INSERT INTO private.lumina_conversation (id, title, topic, problem_image_url, problem_voice_url, problem_transcription, source_media_id, status)
  SELECT "conversationId", "title", "topic", "problemImageUrl", "problemVoiceUrl", "problemTranscription", "sourceMediaId", COALESCE("status", 'IN_PROGRESS'::public.problem_status)
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
    problem_voice_url = COALESCE(EXCLUDED.problem_voice_url, private.lumina_conversation.problem_voice_url),
    problem_transcription = COALESCE(EXCLUDED.problem_transcription, private.lumina_conversation.problem_transcription),
    source_media_id = COALESCE(EXCLUDED.source_media_id, private.lumina_conversation.source_media_id),
    status = COALESCE(EXCLUDED.status, private.lumina_conversation.status),
    updated_at = CURRENT_TIMESTAMP
  RETURNING ROW(
    id,
    created_at,
    updated_at,
    title,
    topic,
    problem_image_url,
    problem_voice_url,
    problem_transcription,
    source_media_id,
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
      ilc.problem_voice_url,
      ilc.problem_transcription,
      ilc.source_media_id,
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
  "problemImageUrl" text DEFAULT NULL,
  "problemVoiceUrl" text DEFAULT NULL,
  "sourceMediaId" uuid DEFAULT NULL,
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
  IF "problemImageUrl" IS NULL AND "problemVoiceUrl" IS NULL AND "sourceMediaId" IS NULL THEN
    RAISE EXCEPTION 'At least one of problemImageUrl, problemVoiceUrl, or sourceMediaId must be provided';
  END IF;
  
  INSERT INTO private.problem_attempt (
    user_id,
    conversation_id,
    problem_image_url,
    problem_voice_url,
    source_media_id,
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
    "problemVoiceUrl",
    "sourceMediaId",
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
    problem_voice_url,
    source_media_id,
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
  pa.problem_voice_url,
  pa.source_media_id,
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
            ilc.problem_voice_url,
            ilc.problem_transcription,
            ilc.source_media_id,
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

-- Delete a conversation (owner or participant can delete)
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
  _user_id uuid;
BEGIN
  IF "conversationId" IS NULL THEN
    RETURN false;
  END IF;

  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Allow owner OR active participant to delete
  DELETE FROM private.conversation
  WHERE id = "conversationId"
  AND (
    owner_entity_id = _user_id
    OR EXISTS (
      SELECT 1 FROM private.conversation_participant cp
      WHERE cp.conversation_id = "conversationId"
      AND cp.entity_id = _user_id
      AND cp.deactivated_at IS NULL
    )
  );

  GET DIAGNOSTICS _deleted = ROW_COUNT;
  RETURN _deleted > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:conversation:delete" TO authenticated;

-- =====================
-- USER MISTAKE FUNCTIONS
-- =====================

-- Create a new mistake record
CREATE OR REPLACE FUNCTION public."app:lumina:mistake:create"(
  "topic" public.math_topic,
  "problemText" text,
  "mistakeCategory" public.mistake_category DEFAULT 'OTHER',
  "incorrectAnswer" text DEFAULT NULL,
  "correctAnswer" text DEFAULT NULL,
  "explanation" text DEFAULT NULL,
  "problemAttemptId" uuid DEFAULT NULL
)
RETURNS public."UserMistakeV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  _result public."UserMistakeV1";
BEGIN
  IF "topic" IS NULL THEN
    RAISE EXCEPTION 'topic cannot be null';
  END IF;
  IF "problemText" IS NULL OR "problemText" = '' THEN
    RAISE EXCEPTION 'problemText cannot be null or empty';
  END IF;
  
  INSERT INTO private.user_mistake (
    user_id,
    problem_attempt_id,
    topic,
    mistake_category,
    problem_text,
    incorrect_answer,
    correct_answer,
    explanation
  )
  VALUES (
    auth.uid(),
    "problemAttemptId",
    "topic",
    COALESCE("mistakeCategory", 'OTHER'::public.mistake_category),
    "problemText",
    "incorrectAnswer",
    "correctAnswer",
    "explanation"
  )
  RETURNING ROW(
    id,
    created_at,
    updated_at,
    user_id,
    problem_attempt_id,
    topic,
    mistake_category,
    problem_text,
    incorrect_answer,
    correct_answer,
    explanation,
    occurrence_count,
    last_occurred_at,
    is_resolved,
    resolved_at
  )::public."UserMistakeV1"
  INTO _result;
  
  RETURN _result;
END;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:mistake:create" TO authenticated;

-- Read all mistakes for current user
CREATE OR REPLACE FUNCTION public."app:lumina:mistake:readAll"(
  "topic" public.math_topic DEFAULT NULL,
  "unresolvedOnly" boolean DEFAULT false,
  "limit" int DEFAULT 50
)
RETURNS SETOF public."UserMistakeV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  um.id,
  um.created_at,
  um.updated_at,
  um.user_id,
  um.problem_attempt_id,
  um.topic,
  um.mistake_category,
  um.problem_text,
  um.incorrect_answer,
  um.correct_answer,
  um.explanation,
  um.occurrence_count,
  um.last_occurred_at,
  um.is_resolved,
  um.resolved_at
)::public."UserMistakeV1"
FROM private.user_mistake um
WHERE um.user_id = auth.uid()
AND ("topic" IS NULL OR um.topic = "topic")
AND (NOT "unresolvedOnly" OR um.is_resolved = false)
ORDER BY um.last_occurred_at DESC
LIMIT "limit";
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:mistake:readAll" TO authenticated;

-- Read recent unresolved mistakes for practice generation
CREATE OR REPLACE FUNCTION public."app:lumina:mistake:readRecentUnresolved"(
  "limit" int DEFAULT 10
)
RETURNS SETOF public."UserMistakeV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  um.id,
  um.created_at,
  um.updated_at,
  um.user_id,
  um.problem_attempt_id,
  um.topic,
  um.mistake_category,
  um.problem_text,
  um.incorrect_answer,
  um.correct_answer,
  um.explanation,
  um.occurrence_count,
  um.last_occurred_at,
  um.is_resolved,
  um.resolved_at
)::public."UserMistakeV1"
FROM private.user_mistake um
WHERE um.user_id = auth.uid()
AND um.is_resolved = false
ORDER BY um.occurrence_count DESC, um.last_occurred_at DESC
LIMIT "limit";
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:mistake:readRecentUnresolved" TO authenticated;

-- Mark a mistake as resolved
CREATE OR REPLACE FUNCTION public."app:lumina:mistake:resolve"(
  "mistakeId" uuid
)
RETURNS public."UserMistakeV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE sql
AS $$
UPDATE private.user_mistake
SET 
  is_resolved = true,
  resolved_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP
WHERE id = "mistakeId"
AND user_id = auth.uid()
RETURNING ROW(
  id,
  created_at,
  updated_at,
  user_id,
  problem_attempt_id,
  topic,
  mistake_category,
  problem_text,
  incorrect_answer,
  correct_answer,
  explanation,
  occurrence_count,
  last_occurred_at,
  is_resolved,
  resolved_at
)::public."UserMistakeV1";
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:mistake:resolve" TO authenticated;

-- Increment mistake occurrence count
CREATE OR REPLACE FUNCTION public."app:lumina:mistake:incrementOccurrence"(
  "mistakeId" uuid
)
RETURNS public."UserMistakeV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE sql
AS $$
UPDATE private.user_mistake
SET 
  occurrence_count = occurrence_count + 1,
  last_occurred_at = CURRENT_TIMESTAMP,
  is_resolved = false,
  resolved_at = NULL,
  updated_at = CURRENT_TIMESTAMP
WHERE id = "mistakeId"
AND user_id = auth.uid()
RETURNING ROW(
  id,
  created_at,
  updated_at,
  user_id,
  problem_attempt_id,
  topic,
  mistake_category,
  problem_text,
  incorrect_answer,
  correct_answer,
  explanation,
  occurrence_count,
  last_occurred_at,
  is_resolved,
  resolved_at
)::public."UserMistakeV1";
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:mistake:incrementOccurrence" TO authenticated;

-- Get mistake summary by topic
CREATE OR REPLACE FUNCTION public."app:lumina:mistake:summaryByTopic"()
RETURNS SETOF public."MistakeTopicSummaryV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  um.topic,
  COUNT(*)::int,
  COUNT(*) FILTER (WHERE um.is_resolved = false)::int,
  (
    SELECT um2.mistake_category
    FROM private.user_mistake um2
    WHERE um2.user_id = auth.uid()
    AND um2.topic = um.topic
    GROUP BY um2.mistake_category
    ORDER BY COUNT(*) DESC
    LIMIT 1
  )
)::public."MistakeTopicSummaryV1"
FROM private.user_mistake um
WHERE um.user_id = auth.uid()
GROUP BY um.topic;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:mistake:summaryByTopic" TO authenticated;

-- =====================
-- PRACTICE PROBLEM FUNCTIONS
-- =====================

-- Create a new practice problem
CREATE OR REPLACE FUNCTION public."app:lumina:practice:create"(
  "topic" public.math_topic,
  "problemText" text,
  "solution" text,
  "source" public.practice_source,
  "difficulty" public.difficulty_level DEFAULT 'MEDIUM',
  "hint" text DEFAULT NULL,
  "solutionSteps" text[] DEFAULT NULL,
  "sourceMistakeId" uuid DEFAULT NULL
)
RETURNS public."PracticeProblemV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  _result public."PracticeProblemV1";
BEGIN
  IF "topic" IS NULL THEN
    RAISE EXCEPTION 'topic cannot be null';
  END IF;
  IF "problemText" IS NULL OR "problemText" = '' THEN
    RAISE EXCEPTION 'problemText cannot be null or empty';
  END IF;
  IF "solution" IS NULL OR "solution" = '' THEN
    RAISE EXCEPTION 'solution cannot be null or empty';
  END IF;
  
  INSERT INTO private.practice_problem (
    user_id,
    topic,
    difficulty,
    source,
    source_mistake_id,
    problem_text,
    hint,
    solution,
    solution_steps
  )
  VALUES (
    auth.uid(),
    "topic",
    COALESCE("difficulty", 'MEDIUM'::public.difficulty_level),
    "source",
    "sourceMistakeId",
    "problemText",
    "hint",
    "solution",
    "solutionSteps"
  )
  RETURNING ROW(
    id,
    created_at,
    updated_at,
    user_id,
    topic,
    difficulty,
    source,
    source_mistake_id,
    problem_text,
    hint,
    solution,
    solution_steps,
    is_completed,
    completed_at,
    was_correct,
    user_answer,
    time_spent_in_ms
  )::public."PracticeProblemV1"
  INTO _result;
  
  RETURN _result;
END;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:practice:create" TO authenticated;

-- Read pending practice problems
CREATE OR REPLACE FUNCTION public."app:lumina:practice:readPending"(
  "topic" public.math_topic DEFAULT NULL,
  "limit" int DEFAULT 10
)
RETURNS SETOF public."PracticeProblemV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  pp.id,
  pp.created_at,
  pp.updated_at,
  pp.user_id,
  pp.topic,
  pp.difficulty,
  pp.source,
  pp.source_mistake_id,
  pp.problem_text,
  pp.hint,
  pp.solution,
  pp.solution_steps,
  pp.is_completed,
  pp.completed_at,
  pp.was_correct,
  pp.user_answer,
  pp.time_spent_in_ms
)::public."PracticeProblemV1"
FROM private.practice_problem pp
WHERE pp.user_id = auth.uid()
AND pp.is_completed = false
AND ("topic" IS NULL OR pp.topic = "topic")
ORDER BY pp.created_at DESC
LIMIT "limit";
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:practice:readPending" TO authenticated;

-- Read a single practice problem
CREATE OR REPLACE FUNCTION public."app:lumina:practice:read"(
  "problemId" uuid
)
RETURNS public."PracticeProblemV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  pp.id,
  pp.created_at,
  pp.updated_at,
  pp.user_id,
  pp.topic,
  pp.difficulty,
  pp.source,
  pp.source_mistake_id,
  pp.problem_text,
  pp.hint,
  pp.solution,
  pp.solution_steps,
  pp.is_completed,
  pp.completed_at,
  pp.was_correct,
  pp.user_answer,
  pp.time_spent_in_ms
)::public."PracticeProblemV1"
FROM private.practice_problem pp
WHERE pp.id = "problemId"
AND pp.user_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:practice:read" TO authenticated;

-- Complete a practice problem
CREATE OR REPLACE FUNCTION public."app:lumina:practice:complete"(
  "problemId" uuid,
  "userAnswer" text,
  "wasCorrect" boolean,
  "timeSpentInMs" int DEFAULT NULL
)
RETURNS public."PracticeProblemV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  _result public."PracticeProblemV1";
  _source_mistake_id uuid;
BEGIN
  -- Update the practice problem
  UPDATE private.practice_problem
  SET 
    is_completed = true,
    completed_at = CURRENT_TIMESTAMP,
    was_correct = "wasCorrect",
    user_answer = "userAnswer",
    time_spent_in_ms = "timeSpentInMs",
    updated_at = CURRENT_TIMESTAMP
  WHERE id = "problemId"
  AND user_id = auth.uid()
  RETURNING 
    source_mistake_id,
    ROW(
      id,
      created_at,
      updated_at,
      user_id,
      topic,
      difficulty,
      source,
      source_mistake_id,
      problem_text,
      hint,
      solution,
      solution_steps,
      is_completed,
      completed_at,
      was_correct,
      user_answer,
      time_spent_in_ms
    )::public."PracticeProblemV1"
  INTO _source_mistake_id, _result;
  
  -- If correct and there was a source mistake, mark it as resolved
  IF "wasCorrect" AND _source_mistake_id IS NOT NULL THEN
    UPDATE private.user_mistake
    SET 
      is_resolved = true,
      resolved_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = _source_mistake_id
    AND user_id = auth.uid();
  END IF;
  
  -- Update user progress
  UPDATE private.user_progress
  SET 
    practice_problems_completed = practice_problems_completed + 1,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = auth.uid();
  
  RETURN _result;
END;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:practice:complete" TO authenticated;

-- =====================
-- PRACTICE SESSION FUNCTIONS
-- =====================

-- Start a new practice session
CREATE OR REPLACE FUNCTION public."app:lumina:practiceSession:start"()
RETURNS public."PracticeSessionV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE sql
AS $$
INSERT INTO private.practice_session (user_id)
VALUES (auth.uid())
RETURNING ROW(
  id,
  created_at,
  updated_at,
  user_id,
  started_at,
  ended_at,
  problems_attempted,
  problems_correct,
  total_time_in_ms,
  topics_practiced
)::public."PracticeSessionV1";
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:practiceSession:start" TO authenticated;

-- Get current active session or start a new one
CREATE OR REPLACE FUNCTION public."app:lumina:practiceSession:getOrCreate"()
RETURNS public."PracticeSessionV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  _result public."PracticeSessionV1";
BEGIN
  -- Try to find an active session (started within last 2 hours)
  SELECT ROW(
    ps.id,
    ps.created_at,
    ps.updated_at,
    ps.user_id,
    ps.started_at,
    ps.ended_at,
    ps.problems_attempted,
    ps.problems_correct,
    ps.total_time_in_ms,
    ps.topics_practiced
  )::public."PracticeSessionV1"
  INTO _result
  FROM private.practice_session ps
  WHERE ps.user_id = auth.uid()
  AND ps.ended_at IS NULL
  AND ps.started_at > CURRENT_TIMESTAMP - INTERVAL '2 hours'
  ORDER BY ps.started_at DESC
  LIMIT 1;
  
  -- If no active session, create a new one
  IF _result IS NULL THEN
    INSERT INTO private.practice_session (user_id)
    VALUES (auth.uid())
    RETURNING ROW(
      id,
      created_at,
      updated_at,
      user_id,
      started_at,
      ended_at,
      problems_attempted,
      problems_correct,
      total_time_in_ms,
      topics_practiced
    )::public."PracticeSessionV1"
    INTO _result;
  END IF;
  
  RETURN _result;
END;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:practiceSession:getOrCreate" TO authenticated;

-- Update practice session with problem result
CREATE OR REPLACE FUNCTION public."app:lumina:practiceSession:recordProblem"(
  "sessionId" uuid,
  "topic" public.math_topic,
  "wasCorrect" boolean,
  "timeSpentInMs" int DEFAULT 0
)
RETURNS public."PracticeSessionV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE sql
AS $$
UPDATE private.practice_session
SET 
  problems_attempted = problems_attempted + 1,
  problems_correct = problems_correct + CASE WHEN "wasCorrect" THEN 1 ELSE 0 END,
  total_time_in_ms = total_time_in_ms + COALESCE("timeSpentInMs", 0),
  topics_practiced = CASE 
    WHEN "topic" = ANY(topics_practiced) THEN topics_practiced
    ELSE array_append(topics_practiced, "topic")
  END,
  updated_at = CURRENT_TIMESTAMP
WHERE id = "sessionId"
AND user_id = auth.uid()
RETURNING ROW(
  id,
  created_at,
  updated_at,
  user_id,
  started_at,
  ended_at,
  problems_attempted,
  problems_correct,
  total_time_in_ms,
  topics_practiced
)::public."PracticeSessionV1";
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:practiceSession:recordProblem" TO authenticated;

-- End a practice session
CREATE OR REPLACE FUNCTION public."app:lumina:practiceSession:end"(
  "sessionId" uuid
)
RETURNS public."PracticeSessionV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE sql
AS $$
UPDATE private.practice_session
SET 
  ended_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP
WHERE id = "sessionId"
AND user_id = auth.uid()
RETURNING ROW(
  id,
  created_at,
  updated_at,
  user_id,
  started_at,
  ended_at,
  problems_attempted,
  problems_correct,
  total_time_in_ms,
  topics_practiced
)::public."PracticeSessionV1";
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:practiceSession:end" TO authenticated;

-- Get practice data bundle for practice screen
CREATE OR REPLACE FUNCTION public."app:lumina:practice:getData"()
RETURNS public."PracticeDataV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  -- Current session (or null if none active)
  (
    SELECT ROW(
      ps.id,
      ps.created_at,
      ps.updated_at,
      ps.user_id,
      ps.started_at,
      ps.ended_at,
      ps.problems_attempted,
      ps.problems_correct,
      ps.total_time_in_ms,
      ps.topics_practiced
    )::public."PracticeSessionV1"
    FROM private.practice_session ps
    WHERE ps.user_id = auth.uid()
    AND ps.ended_at IS NULL
    AND ps.started_at > CURRENT_TIMESTAMP - INTERVAL '2 hours'
    ORDER BY ps.started_at DESC
    LIMIT 1
  ),
  -- Pending practice problems
  COALESCE(
    ARRAY(
      SELECT ROW(
        pp.id,
        pp.created_at,
        pp.updated_at,
        pp.user_id,
        pp.topic,
        pp.difficulty,
        pp.source,
        pp.source_mistake_id,
        pp.problem_text,
        pp.hint,
        pp.solution,
        pp.solution_steps,
        pp.is_completed,
        pp.completed_at,
        pp.was_correct,
        pp.user_answer,
        pp.time_spent_in_ms
      )::public."PracticeProblemV1"
      FROM private.practice_problem pp
      WHERE pp.user_id = auth.uid()
      AND pp.is_completed = false
      ORDER BY pp.created_at DESC
      LIMIT 10
    ),
    '{}'::public."PracticeProblemV1"[]
  ),
  -- Recent unresolved mistakes
  COALESCE(
    ARRAY(
      SELECT ROW(
        um.id,
        um.created_at,
        um.updated_at,
        um.user_id,
        um.problem_attempt_id,
        um.topic,
        um.mistake_category,
        um.problem_text,
        um.incorrect_answer,
        um.correct_answer,
        um.explanation,
        um.occurrence_count,
        um.last_occurred_at,
        um.is_resolved,
        um.resolved_at
      )::public."UserMistakeV1"
      FROM private.user_mistake um
      WHERE um.user_id = auth.uid()
      AND um.is_resolved = false
      ORDER BY um.occurrence_count DESC, um.last_occurred_at DESC
      LIMIT 10
    ),
    '{}'::public."UserMistakeV1"[]
  ),
  -- Mistakes summary by topic
  COALESCE(
    ARRAY(
      SELECT ROW(
        um.topic,
        COUNT(*)::int,
        COUNT(*) FILTER (WHERE um.is_resolved = false)::int,
        (
          SELECT um2.mistake_category
          FROM private.user_mistake um2
          WHERE um2.user_id = auth.uid()
          AND um2.topic = um.topic
          GROUP BY um2.mistake_category
          ORDER BY COUNT(*) DESC
          LIMIT 1
        )
      )::public."MistakeTopicSummaryV1"
      FROM private.user_mistake um
      WHERE um.user_id = auth.uid()
      GROUP BY um.topic
    ),
    '{}'::public."MistakeTopicSummaryV1"[]
  )
)::public."PracticeDataV1";
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:practice:getData" TO authenticated;
