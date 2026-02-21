import { SupabaseClient } from '@supabase/supabase-js';

import {
  type AchievementType,
  type AchievementV1,
  type ConversationHistoryItemV1,
  type ConversationWithLuminaV1,
  type Database,
  type datestr,
  type GradeLevel,
  type intnum,
  type LuminaConversationV1,
  type LuminaHomeDataV1,
  type LuminaProfileV1,
  type LuminaProgressDataV1,
  type MathTopic,
  type ProblemAttemptV1,
  type ProblemStatus,
  type ProfileWithLuminaV1,
  type StreakHistoryV1,
  toIntNum,
  type TopicMasteryV1,
  type UserPreferencesV1,
  type UserProgressV1,
  type uuidstr,
} from './generated-db-types.ts';

// =====================
// LUMINA PROFILE
// =====================

export async function readLuminaProfile(
  supabaseClient: SupabaseClient<Database>,
): Promise<LuminaProfileV1 | undefined> {
  const res = await supabaseClient.rpc('app:lumina:profile:read');
  if (res.error) {
    throw res.error;
  }
  return res.data ?? undefined;
}

export async function upsertLuminaProfile(
  supabaseClient: SupabaseClient<Database>,
  gradeLevel: GradeLevel,
  onboardingCompleted?: boolean,
): Promise<LuminaProfileV1> {
  const res = await supabaseClient.rpc('app:lumina:profile:upsert', {
    gradeLevel,
    onboardingCompleted,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data;
}

export async function completeLuminaProfileOnboarding(
  supabaseClient: SupabaseClient<Database>,
): Promise<LuminaProfileV1> {
  const res = await supabaseClient.rpc('app:lumina:profile:completeOnboarding');
  if (res.error) {
    throw res.error;
  }
  return res.data;
}

// =====================
// USER PREFERENCES
// =====================

export async function readUserPreferences(
  supabaseClient: SupabaseClient<Database>,
): Promise<UserPreferencesV1 | undefined> {
  const res = await supabaseClient.rpc('app:lumina:preferences:read');
  if (res.error) {
    throw res.error;
  }
  return res.data ?? undefined;
}

export async function upsertUserPreferences(
  supabaseClient: SupabaseClient<Database>,
  struggleTopics: MathTopic[],
  learningConcerns?: string,
  notificationsEnabled?: boolean,
): Promise<UserPreferencesV1> {
  const res = await supabaseClient.rpc('app:lumina:preferences:upsert', {
    struggleTopics,
    learningConcerns,
    notificationsEnabled,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data;
}

// =====================
// USER PROGRESS
// =====================

export async function readUserProgress(
  supabaseClient: SupabaseClient<Database>,
): Promise<UserProgressV1 | undefined> {
  const res = await supabaseClient.rpc('app:lumina:progress:read');
  if (res.error) {
    throw res.error;
  }
  return res.data ?? undefined;
}

export async function initUserProgress(
  supabaseClient: SupabaseClient<Database>,
): Promise<UserProgressV1 | undefined> {
  const res = await supabaseClient.rpc('app:lumina:progress:init');
  if (res.error) {
    throw res.error;
  }
  return res.data ?? undefined;
}

export async function recordProblemSolved(
  supabaseClient: SupabaseClient<Database>,
): Promise<UserProgressV1> {
  const res = await supabaseClient.rpc('app:lumina:progress:recordProblemSolved');
  if (res.error) {
    throw res.error;
  }
  return res.data;
}

// =====================
// TOPIC MASTERY
// =====================

export async function readAllTopicMasteries(
  supabaseClient: SupabaseClient<Database>,
): Promise<TopicMasteryV1[]> {
  const res = await supabaseClient.rpc('app:lumina:topicMastery:readAll');
  if (res.error) {
    throw res.error;
  }
  return res.data ?? [];
}

export async function recordTopicAttempt(
  supabaseClient: SupabaseClient<Database>,
  topic: MathTopic,
  wasCorrect: boolean,
): Promise<TopicMasteryV1> {
  const res = await supabaseClient.rpc('app:lumina:topicMastery:recordAttempt', {
    topic,
    wasCorrect,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data;
}

// =====================
// ACHIEVEMENTS
// =====================

export async function readAllAchievements(
  supabaseClient: SupabaseClient<Database>,
): Promise<AchievementV1[]> {
  const res = await supabaseClient.rpc('app:lumina:achievement:readAll');
  if (res.error) {
    throw res.error;
  }
  return res.data ?? [];
}

export async function awardAchievement(
  supabaseClient: SupabaseClient<Database>,
  achievementType: AchievementType,
): Promise<AchievementV1 | undefined> {
  const res = await supabaseClient.rpc('app:lumina:achievement:award', {
    achievementType,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data ?? undefined;
}

export async function markAchievementViewed(
  supabaseClient: SupabaseClient<Database>,
  achievementId: uuidstr,
): Promise<AchievementV1 | undefined> {
  const res = await supabaseClient.rpc('app:lumina:achievement:markViewed', {
    achievementId,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data ?? undefined;
}

// =====================
// LUMINA CONVERSATION
// =====================

export async function readLuminaConversation(
  supabaseClient: SupabaseClient<Database>,
  conversationId: uuidstr,
): Promise<LuminaConversationV1 | undefined> {
  const res = await supabaseClient.rpc('app:lumina:conversation:read', {
    conversationId,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data ?? undefined;
}

export async function upsertLuminaConversation(
  supabaseClient: SupabaseClient<Database>,
  conversationId: uuidstr,
  options?: {
    title?: string;
    topic?: MathTopic;
    problemImageUrl?: string;
    status?: ProblemStatus;
  },
): Promise<LuminaConversationV1 | undefined> {
  const res = await supabaseClient.rpc('app:lumina:conversation:upsert', {
    conversationId,
    title: options?.title,
    topic: options?.topic,
    problemImageUrl: options?.problemImageUrl,
    status: options?.status,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data ?? undefined;
}

export async function readAllLuminaConversations(
  supabaseClient: SupabaseClient<Database>,
): Promise<ConversationWithLuminaV1[]> {
  const res = await supabaseClient.rpc('app:lumina:conversation:readAll');
  if (res.error) {
    throw res.error;
  }
  return res.data ?? [];
}

export async function readAllLuminaConversationsWithPreview(
  supabaseClient: SupabaseClient<Database>,
): Promise<ConversationHistoryItemV1[]> {
  const res = await supabaseClient.rpc('app:lumina:conversation:readAllWithPreview');
  if (res.error) {
    throw res.error;
  }
  return res.data ?? [];
}

export async function deleteLuminaConversation(
  supabaseClient: SupabaseClient<Database>,
  conversationId: uuidstr,
): Promise<boolean> {
  const res = await supabaseClient.rpc('app:lumina:conversation:delete', {
    conversationId,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data ?? false;
}

// =====================
// PROBLEM ATTEMPT
// =====================

export async function createProblemAttempt(
  supabaseClient: SupabaseClient<Database>,
  problemImageUrl: string,
  options?: {
    conversationId?: uuidstr;
    extractedProblem?: string;
    topic?: MathTopic;
    wasCorrectFirstTry?: boolean;
    processedLocally?: boolean;
    processingTimeInMs?: number;
  },
): Promise<ProblemAttemptV1> {
  const res = await supabaseClient.rpc('app:lumina:problemAttempt:create', {
    problemImageUrl,
    conversationId: options?.conversationId,
    extractedProblem: options?.extractedProblem,
    topic: options?.topic,
    wasCorrectFirstTry: options?.wasCorrectFirstTry,
    processedLocally: options?.processedLocally,
    processingTimeInMs: options?.processingTimeInMs != null ? toIntNum(options.processingTimeInMs) : undefined,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data;
}

export async function readRecentProblemAttempts(
  supabaseClient: SupabaseClient<Database>,
  limit?: number,
): Promise<ProblemAttemptV1[]> {
  const res = await supabaseClient.rpc('app:lumina:problemAttempt:readRecent', {
    limit: limit != null ? toIntNum(limit) : undefined,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data ?? [];
}

// =====================
// STREAK HISTORY
// =====================

export async function readStreakHistory(
  supabaseClient: SupabaseClient<Database>,
  startDate?: datestr,
  endDate?: datestr,
): Promise<StreakHistoryV1[]> {
  const res = await supabaseClient.rpc('app:lumina:streakHistory:read', {
    startDate,
    endDate,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data ?? [];
}

// =====================
// COMBINED DATA
// =====================

export async function readLuminaHomeData(
  supabaseClient: SupabaseClient<Database>,
): Promise<LuminaHomeDataV1 | undefined> {
  const res = await supabaseClient.rpc('app:lumina:home:read');
  if (res.error) {
    throw res.error;
  }
  return res.data ?? undefined;
}

export async function readLuminaProgressData(
  supabaseClient: SupabaseClient<Database>,
): Promise<LuminaProgressDataV1 | undefined> {
  const res = await supabaseClient.rpc('app:lumina:progressData:read');
  if (res.error) {
    throw res.error;
  }
  return res.data ?? undefined;
}

// =====================
// ONBOARDING
// =====================

export async function completeLuminaOnboarding(
  supabaseClient: SupabaseClient<Database>,
  givenName: string,
  gradeLevel: GradeLevel,
  struggleTopics: MathTopic[],
  learningConcerns?: string,
): Promise<ProfileWithLuminaV1> {
  const res = await supabaseClient.rpc('app:lumina:onboarding:complete', {
    givenName,
    gradeLevel,
    struggleTopics,
    learningConcerns,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data;
}

export async function isLuminaOnboardingCompleted(
  supabaseClient: SupabaseClient<Database>,
): Promise<boolean> {
  const res = await supabaseClient.rpc('app:lumina:onboarding:isCompleted');
  if (res.error) {
    throw res.error;
  }
  return res.data ?? false;
}
