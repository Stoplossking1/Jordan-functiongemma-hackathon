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
  "notificationsEnabled" bool_notnull
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
  "lastActiveDate" date
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

-- Lumina Conversation API Type
CREATE TYPE public."LuminaConversationV1" AS (
  id uuid_notnull,
  "createdAt" timestamptz_notnull,
  "updatedAt" timestamptz_notnull,
  title text,
  topic public.math_topic,
  "problemImageUrl" text,
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
