import { SupabaseClient } from '@supabase/supabase-js';

import {
  type AchievementType,
  type AchievementV1,
  type ConversationHistoryItemV1,
  type ConversationWithLuminaV1,
  type Database,
  type datestr,
  type DifficultyLevel,
  type GradeLevel,
  type intnum,
  type LuminaConversationV1,
  type LuminaHomeDataV1,
  type LuminaProfileV1,
  type LuminaProgressDataV1,
  type MathTopic,
  type MediaLibrarySummaryV1,
  type MediaType,
  type MistakeCategory,
  type MistakeTopicSummaryV1,
  type PracticeDataV1,
  type PracticeProblemV1,
  type PracticeSessionV1,
  type PracticeSource,
  type ProblemAttemptV1,
  type ProblemStatus,
  type ProfileWithLuminaV1,
  type StreakHistoryV1,
  toIntNum,
  type TopicMasteryV1,
  type UserMediaV1,
  type UserMistakeV1,
  type UserPreferencesV1,
  type UserProgressV1,
  type uuidstr,
} from './generated-db-types.ts';

const DEFAULT_LEARNER_MEMORY_RECENT_ATTEMPT_LIMIT = 10;

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
    problemVoiceUrl?: string;
    problemTranscription?: string;
    sourceMediaId?: uuidstr;
    status?: ProblemStatus;
  },
): Promise<LuminaConversationV1 | undefined> {
  const res = await supabaseClient.rpc('app:lumina:conversation:upsert', {
    conversationId,
    title: options?.title,
    topic: options?.topic,
    problemImageUrl: options?.problemImageUrl,
    problemVoiceUrl: options?.problemVoiceUrl,
    problemTranscription: options?.problemTranscription,
    sourceMediaId: options?.sourceMediaId,
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
  options: {
    problemImageUrl?: string;
    problemVoiceUrl?: string;
    sourceMediaId?: uuidstr;
    conversationId?: uuidstr;
    extractedProblem?: string;
    topic?: MathTopic;
    wasCorrectFirstTry?: boolean;
    processedLocally?: boolean;
    processingTimeInMs?: number;
  },
): Promise<ProblemAttemptV1> {
  const res = await supabaseClient.rpc('app:lumina:problemAttempt:create', {
    problemImageUrl: options.problemImageUrl,
    problemVoiceUrl: options.problemVoiceUrl,
    sourceMediaId: options.sourceMediaId,
    conversationId: options.conversationId,
    extractedProblem: options.extractedProblem,
    topic: options.topic,
    wasCorrectFirstTry: options.wasCorrectFirstTry,
    processedLocally: options.processedLocally,
    processingTimeInMs: options.processingTimeInMs != null ? toIntNum(options.processingTimeInMs) : undefined,
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

export interface LearnerMemorySourceDataV1 {
  preferences?: UserPreferencesV1;
  topicMasteries: TopicMasteryV1[];
  recentProblemAttempts: ProblemAttemptV1[];
}

export async function readLearnerMemorySourceData(
  supabaseClient: SupabaseClient<Database>,
  options?: {
    recentAttemptLimit?: number;
  },
): Promise<LearnerMemorySourceDataV1> {
  const recentAttemptLimit = options?.recentAttemptLimit ?? DEFAULT_LEARNER_MEMORY_RECENT_ATTEMPT_LIMIT;
  const [preferences, topicMasteries, recentProblemAttempts] = await Promise.all([
    readUserPreferences(supabaseClient),
    readAllTopicMasteries(supabaseClient),
    readRecentProblemAttempts(supabaseClient, recentAttemptLimit),
  ]);

  return {
    preferences,
    topicMasteries,
    recentProblemAttempts,
  };
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

// =====================
// USER MEDIA LIBRARY
// =====================

export async function createUserMedia(
  supabaseClient: SupabaseClient<Database>,
  mediaType: MediaType,
  storagePath: string,
  fileName: string,
  mimeType: string,
  options?: {
    fileSizeBytes?: number;
    durationInMs?: number;
    transcription?: string;
    title?: string;
  },
): Promise<UserMediaV1> {
  const res = await supabaseClient.rpc('app:lumina:media:create', {
    mediaType,
    storagePath,
    fileName,
    mimeType,
    fileSizeBytes: options?.fileSizeBytes != null ? toIntNum(options.fileSizeBytes) : undefined,
    durationInMs: options?.durationInMs != null ? toIntNum(options.durationInMs) : undefined,
    transcription: options?.transcription,
    title: options?.title,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data;
}

export async function readUserMedia(
  supabaseClient: SupabaseClient<Database>,
  mediaId: uuidstr,
): Promise<UserMediaV1 | undefined> {
  const res = await supabaseClient.rpc('app:lumina:media:read', {
    mediaId,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data ?? undefined;
}

export async function readAllUserMedia(
  supabaseClient: SupabaseClient<Database>,
  options?: {
    mediaType?: MediaType;
    limit?: number;
    offset?: number;
  },
): Promise<UserMediaV1[]> {
  const res = await supabaseClient.rpc('app:lumina:media:readAll', {
    mediaType: options?.mediaType,
    limit: options?.limit != null ? toIntNum(options.limit) : undefined,
    offset: options?.offset != null ? toIntNum(options.offset) : undefined,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data ?? [];
}

export async function readRecentUserMedia(
  supabaseClient: SupabaseClient<Database>,
  limit?: number,
): Promise<UserMediaV1[]> {
  const res = await supabaseClient.rpc('app:lumina:media:readRecent', {
    limit: limit != null ? toIntNum(limit) : undefined,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data ?? [];
}

export async function readFavoriteUserMedia(
  supabaseClient: SupabaseClient<Database>,
  mediaType?: MediaType,
): Promise<UserMediaV1[]> {
  const res = await supabaseClient.rpc('app:lumina:media:readFavorites', {
    mediaType,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data ?? [];
}

export async function updateUserMedia(
  supabaseClient: SupabaseClient<Database>,
  mediaId: uuidstr,
  options?: {
    title?: string;
    transcription?: string;
    isFavorite?: boolean;
  },
): Promise<UserMediaV1 | undefined> {
  const res = await supabaseClient.rpc('app:lumina:media:update', {
    mediaId,
    title: options?.title,
    transcription: options?.transcription,
    isFavorite: options?.isFavorite,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data ?? undefined;
}

export async function recordUserMediaUsage(
  supabaseClient: SupabaseClient<Database>,
  mediaId: uuidstr,
): Promise<UserMediaV1 | undefined> {
  const res = await supabaseClient.rpc('app:lumina:media:recordUsage', {
    mediaId,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data ?? undefined;
}

export async function deleteUserMedia(
  supabaseClient: SupabaseClient<Database>,
  mediaId: uuidstr,
): Promise<boolean> {
  const res = await supabaseClient.rpc('app:lumina:media:delete', {
    mediaId,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data ?? false;
}

export async function readMediaLibrarySummary(
  supabaseClient: SupabaseClient<Database>,
): Promise<MediaLibrarySummaryV1 | undefined> {
  const res = await supabaseClient.rpc('app:lumina:media:summary');
  if (res.error) {
    throw res.error;
  }
  return res.data ?? undefined;
}

// =====================
// MEDIA UPLOAD HELPERS
// =====================

export interface UploadMediaResult {
  storagePath: string;
  publicUrl: string;
}

export async function uploadUserMediaFile(
  supabaseClient: SupabaseClient<Database>,
  userId: string,
  file: File | Blob,
  fileName: string,
  mediaType: MediaType,
): Promise<UploadMediaResult> {
  const timestamp = Date.now();
  const folder = mediaType === 'IMAGE' ? 'images' : 'recordings';
  const storagePath = `${userId}/${folder}/${timestamp}_${fileName}`;

  const { error } = await supabaseClient.storage.from('user-media').upload(storagePath, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabaseClient.storage.from('user-media').getPublicUrl(storagePath);

  return { storagePath, publicUrl };
}

export async function getSignedMediaUrl(
  supabaseClient: SupabaseClient<Database>,
  storagePath: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const { data, error } = await supabaseClient.storage
    .from('user-media')
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export async function deleteUserMediaFile(
  supabaseClient: SupabaseClient<Database>,
  storagePath: string,
): Promise<void> {
  const { error } = await supabaseClient.storage.from('user-media').remove([storagePath]);

  if (error) {
    throw error;
  }
}

// =====================
// USER MISTAKES
// =====================

export async function createUserMistake(
  supabaseClient: SupabaseClient<Database>,
  topic: MathTopic,
  problemText: string,
  options?: {
    mistakeCategory?: MistakeCategory;
    incorrectAnswer?: string;
    correctAnswer?: string;
    explanation?: string;
    problemAttemptId?: uuidstr;
  },
): Promise<UserMistakeV1> {
  const res = await supabaseClient.rpc('app:lumina:mistake:create', {
    topic,
    problemText,
    mistakeCategory: options?.mistakeCategory,
    incorrectAnswer: options?.incorrectAnswer,
    correctAnswer: options?.correctAnswer,
    explanation: options?.explanation,
    problemAttemptId: options?.problemAttemptId,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data;
}

export async function readAllUserMistakes(
  supabaseClient: SupabaseClient<Database>,
  options?: {
    topic?: MathTopic;
    unresolvedOnly?: boolean;
    limit?: number;
  },
): Promise<UserMistakeV1[]> {
  const res = await supabaseClient.rpc('app:lumina:mistake:readAll', {
    topic: options?.topic,
    unresolvedOnly: options?.unresolvedOnly,
    limit: options?.limit != null ? toIntNum(options.limit) : undefined,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data ?? [];
}

export async function readRecentUnresolvedMistakes(
  supabaseClient: SupabaseClient<Database>,
  limit?: number,
): Promise<UserMistakeV1[]> {
  const res = await supabaseClient.rpc('app:lumina:mistake:readRecentUnresolved', {
    limit: limit != null ? toIntNum(limit) : undefined,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data ?? [];
}

export async function resolveUserMistake(
  supabaseClient: SupabaseClient<Database>,
  mistakeId: uuidstr,
): Promise<UserMistakeV1 | undefined> {
  const res = await supabaseClient.rpc('app:lumina:mistake:resolve', {
    mistakeId,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data ?? undefined;
}

export async function incrementMistakeOccurrence(
  supabaseClient: SupabaseClient<Database>,
  mistakeId: uuidstr,
): Promise<UserMistakeV1 | undefined> {
  const res = await supabaseClient.rpc('app:lumina:mistake:incrementOccurrence', {
    mistakeId,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data ?? undefined;
}

export async function readMistakeSummaryByTopic(
  supabaseClient: SupabaseClient<Database>,
): Promise<MistakeTopicSummaryV1[]> {
  const res = await supabaseClient.rpc('app:lumina:mistake:summaryByTopic');
  if (res.error) {
    throw res.error;
  }
  return res.data ?? [];
}

// =====================
// PRACTICE PROBLEMS
// =====================

export async function createPracticeProblem(
  supabaseClient: SupabaseClient<Database>,
  topic: MathTopic,
  problemText: string,
  solution: string,
  source: PracticeSource,
  options?: {
    difficulty?: DifficultyLevel;
    hint?: string;
    solutionSteps?: string[];
    sourceMistakeId?: uuidstr;
  },
): Promise<PracticeProblemV1> {
  const res = await supabaseClient.rpc('app:lumina:practice:create', {
    topic,
    problemText,
    solution,
    source,
    difficulty: options?.difficulty,
    hint: options?.hint,
    solutionSteps: options?.solutionSteps,
    sourceMistakeId: options?.sourceMistakeId,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data;
}

export async function readPendingPracticeProblems(
  supabaseClient: SupabaseClient<Database>,
  options?: {
    topic?: MathTopic;
    limit?: number;
  },
): Promise<PracticeProblemV1[]> {
  const res = await supabaseClient.rpc('app:lumina:practice:readPending', {
    topic: options?.topic,
    limit: options?.limit != null ? toIntNum(options.limit) : undefined,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data ?? [];
}

export async function readPracticeProblem(
  supabaseClient: SupabaseClient<Database>,
  problemId: uuidstr,
): Promise<PracticeProblemV1 | undefined> {
  const res = await supabaseClient.rpc('app:lumina:practice:read', {
    problemId,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data ?? undefined;
}

export async function completePracticeProblem(
  supabaseClient: SupabaseClient<Database>,
  problemId: uuidstr,
  userAnswer: string,
  wasCorrect: boolean,
  timeSpentInMs?: number,
): Promise<PracticeProblemV1 | undefined> {
  const res = await supabaseClient.rpc('app:lumina:practice:complete', {
    problemId,
    userAnswer,
    wasCorrect,
    timeSpentInMs: timeSpentInMs != null ? toIntNum(timeSpentInMs) : undefined,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data ?? undefined;
}

export async function readPracticeData(
  supabaseClient: SupabaseClient<Database>,
): Promise<PracticeDataV1 | undefined> {
  const res = await supabaseClient.rpc('app:lumina:practice:getData');
  if (res.error) {
    throw res.error;
  }
  return res.data ?? undefined;
}

// =====================
// PRACTICE SESSIONS
// =====================

export async function startPracticeSession(
  supabaseClient: SupabaseClient<Database>,
): Promise<PracticeSessionV1> {
  const res = await supabaseClient.rpc('app:lumina:practiceSession:start');
  if (res.error) {
    throw res.error;
  }
  return res.data;
}

export async function getOrCreatePracticeSession(
  supabaseClient: SupabaseClient<Database>,
): Promise<PracticeSessionV1> {
  const res = await supabaseClient.rpc('app:lumina:practiceSession:getOrCreate');
  if (res.error) {
    throw res.error;
  }
  return res.data;
}

export async function recordPracticeSessionProblem(
  supabaseClient: SupabaseClient<Database>,
  sessionId: uuidstr,
  topic: MathTopic,
  wasCorrect: boolean,
  timeSpentInMs?: number,
): Promise<PracticeSessionV1 | undefined> {
  const res = await supabaseClient.rpc('app:lumina:practiceSession:recordProblem', {
    sessionId,
    topic,
    wasCorrect,
    timeSpentInMs: timeSpentInMs != null ? toIntNum(timeSpentInMs) : undefined,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data ?? undefined;
}

export async function endPracticeSession(
  supabaseClient: SupabaseClient<Database>,
  sessionId: uuidstr,
): Promise<PracticeSessionV1 | undefined> {
  const res = await supabaseClient.rpc('app:lumina:practiceSession:end', {
    sessionId,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data ?? undefined;
}
