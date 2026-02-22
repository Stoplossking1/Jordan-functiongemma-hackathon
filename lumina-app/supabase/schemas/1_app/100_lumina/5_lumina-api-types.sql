-- Lumina Profile API Type
CREATE TYPE public."LuminaProfileV1" AS (
  id uuid_notnull,
  "createdAt" timestamptz_notnull,
  "updatedAt" timestamptz_notnull,
  "gradeLevel" public.grade_level,
  "onboardingCompleted" bool_notnull
);

-- User Preferences API Type
CREATE TYPE public."UserPreferencesV1" AS (
  id uuid_notnull,
  "createdAt" timestamptz_notnull,
  "updatedAt" timestamptz_notnull,
  "struggleTopics" public.math_topic[],
  "learningConcerns" text,
  "notificationsEnabled" bool_notnull,
  "interestTopics" public.math_topic[]
);

-- User Progress API Type
CREATE TYPE public."UserProgressV1" AS (
  id uuid_notnull,
  "createdAt" timestamptz_notnull,
  "updatedAt" timestamptz_notnull,
  "currentStreak" int_notnull,
  "longestStreak" int_notnull,
  "problemsSolvedToday" int_notnull,
  "totalProblemsSolved" int_notnull,
  "lastActiveDate" date,
  "practiceProblemsCompleted" int_notnull
);

-- Topic Mastery API Type
CREATE TYPE public."TopicMasteryV1" AS (
  id uuid_notnull,
  "createdAt" timestamptz_notnull,
  "updatedAt" timestamptz_notnull,
  "userId" uuid_notnull,
  topic public.math_topic,
  "masteryPercentage" float4_notnull,
  "problemsAttempted" int_notnull,
  "problemsCorrect" int_notnull
);

-- Achievement API Type
CREATE TYPE public."AchievementV1" AS (
  id uuid_notnull,
  "createdAt" timestamptz_notnull,
  "updatedAt" timestamptz_notnull,
  "userId" uuid_notnull,
  "achievementType" public.achievement_type,
  "earnedAt" timestamptz_notnull,
  "isNew" bool_notnull
);

-- User Media API Type
CREATE TYPE public."UserMediaV1" AS (
  id uuid_notnull,
  "createdAt" timestamptz_notnull,
  "updatedAt" timestamptz_notnull,
  "userId" uuid_notnull,
  "mediaType" public.media_type,
  "storagePath" text,
  "fileName" text,
  "mimeType" text,
  "fileSizeBytes" int,
  "durationInMs" int,
  transcription text,
  title text,
  "isFavorite" bool_notnull,
  "lastUsedAt" timestamptz,
  "useCount" int_notnull
);

-- User Media with signed URL for frontend access
CREATE TYPE public."UserMediaWithUrlV1" AS (
  media public."UserMediaV1",
  "signedUrl" text
);

-- Lumina Conversation API Type
CREATE TYPE public."LuminaConversationV1" AS (
  id uuid_notnull,
  "createdAt" timestamptz_notnull,
  "updatedAt" timestamptz_notnull,
  title text,
  topic public.math_topic,
  "problemImageUrl" text,
  "problemVoiceUrl" text,
  "problemTranscription" text,
  "sourceMediaId" uuid,
  status public.problem_status
);

-- Problem Attempt API Type
CREATE TYPE public."ProblemAttemptV1" AS (
  id uuid_notnull,
  "createdAt" timestamptz_notnull,
  "updatedAt" timestamptz_notnull,
  "userId" uuid_notnull,
  "conversationId" uuid,
  "problemImageUrl" text,
  "problemVoiceUrl" text,
  "sourceMediaId" uuid,
  "extractedProblem" text,
  topic public.math_topic,
  "wasCorrectFirstTry" bool_notnull,
  "processedLocally" bool_notnull,
  "processingTimeInMs" int,
  "attemptedAt" timestamptz_notnull
);

-- Streak History API Type
CREATE TYPE public."StreakHistoryV1" AS (
  id uuid_notnull,
  "createdAt" timestamptz_notnull,
  "updatedAt" timestamptz_notnull,
  "userId" uuid_notnull,
  date date_notnull,
  "problemsSolved" int_notnull,
  "wasActive" bool_notnull
);

-- User Mistake API Type
CREATE TYPE public."UserMistakeV1" AS (
  id uuid_notnull,
  "createdAt" timestamptz_notnull,
  "updatedAt" timestamptz_notnull,
  "userId" uuid_notnull,
  "problemAttemptId" uuid,
  topic public.math_topic,
  "mistakeCategory" public.mistake_category,
  "problemText" text,
  "incorrectAnswer" text,
  "correctAnswer" text,
  explanation text,
  "occurrenceCount" int_notnull,
  "lastOccurredAt" timestamptz_notnull,
  "isResolved" bool_notnull,
  "resolvedAt" timestamptz
);

-- Practice Problem API Type
CREATE TYPE public."PracticeProblemV1" AS (
  id uuid_notnull,
  "createdAt" timestamptz_notnull,
  "updatedAt" timestamptz_notnull,
  "userId" uuid_notnull,
  topic public.math_topic,
  difficulty public.difficulty_level,
  source public.practice_source,
  "sourceMistakeId" uuid,
  "problemText" text,
  hint text,
  solution text,
  "solutionSteps" text[],
  "isCompleted" bool_notnull,
  "completedAt" timestamptz,
  "wasCorrect" boolean,
  "userAnswer" text,
  "timeSpentInMs" int
);

-- Practice Session API Type
CREATE TYPE public."PracticeSessionV1" AS (
  id uuid_notnull,
  "createdAt" timestamptz_notnull,
  "updatedAt" timestamptz_notnull,
  "userId" uuid_notnull,
  "startedAt" timestamptz_notnull,
  "endedAt" timestamptz,
  "problemsAttempted" int_notnull,
  "problemsCorrect" int_notnull,
  "totalTimeInMs" int_notnull,
  "topicsPracticed" public.math_topic[]
);

-- Combined profile with Lumina data
CREATE TYPE public."ProfileWithLuminaV1" AS (
  profile public."ProfileV1",
  "luminaProfile" public."LuminaProfileV1",
  preferences public."UserPreferencesV1",
  progress public."UserProgressV1"
);

-- Conversation with Lumina extension
CREATE TYPE public."ConversationWithLuminaV1" AS (
  conversation public."ConversationV1",
  "luminaData" public."LuminaConversationV1"
);

-- Home screen data bundle
CREATE TYPE public."LuminaHomeDataV1" AS (
  "givenName" text,
  "currentStreak" int_notnull,
  "problemsSolvedToday" int_notnull,
  "recentConversations" public."ConversationWithLuminaV1"[]
);

-- Progress screen data bundle
CREATE TYPE public."LuminaProgressDataV1" AS (
  progress public."UserProgressV1",
  achievements public."AchievementV1"[],
  "topicMasteries" public."TopicMasteryV1"[],
  "streakHistory" public."StreakHistoryV1"[]
);

-- Conversation history item for chat list screen
CREATE TYPE public."ConversationHistoryItemV1" AS (
  id uuid_notnull,
  "createdAt" timestamptz_notnull,
  "updatedAt" timestamptz_notnull,
  topic public.math_topic,
  "problemImageUrl" text,
  status public.problem_status,
  "previewText" text
);

-- Media library summary for quick access
CREATE TYPE public."MediaLibrarySummaryV1" AS (
  "totalImages" int_notnull,
  "totalVoiceRecordings" int_notnull,
  "recentMedia" public."UserMediaWithUrlV1"[]
);

-- Practice data bundle for practice screen
CREATE TYPE public."PracticeDataV1" AS (
  "currentSession" public."PracticeSessionV1",
  "pendingProblems" public."PracticeProblemV1"[],
  "recentMistakes" public."UserMistakeV1"[],
  "mistakesByTopic" public."MistakeTopicSummaryV1"[]
);

-- Mistake summary by topic
CREATE TYPE public."MistakeTopicSummaryV1" AS (
  topic public.math_topic,
  "totalMistakes" int_notnull,
  "unresolvedMistakes" int_notnull,
  "mostCommonCategory" public.mistake_category
);
