export type bigserialnum = number & { _type: "bigserial" }
export type smallserialnum = number & { _type: "smallserial" }
export type serialnum = number & { _type: "serial" }

export type smallintnum = number & { _type: "smallint" }
export type intnum = number & { _type: "int" }
export type bigintnum = number & { _type: "bigint" }
export type floatnum = number & { _type: "real" }
export type doublenum = number & { _type: "double" }
export type moneynum = number & { _type: "money" }

export type byteastr = string & { _type: "bytea" }
export type bpcharstr = string & { _type: "bpchar" }
export type varcharstr = string & { _type: "varchar" }
export type datestr = string & { _type: "date" }
// case insensitive text
export type citextstr = string & { _type: "citext" }
// time without timezone
export type timestr = string & { _type: "time" }
// time with timezone
export type timetzstr = string & { _type: "timetz" }
// timestamp without timezone
export type timestampstr = string & { _type: "timestamp" }
// timestamp with timezone
export type timestamptzstr = string & { _type: "timestamptz" }
export type uuidstr = string & { _type: "uuid" }
export type vectorstr = string & { _type: "vector" }

export type emailstr = string & { _type: "email" }
export type urlstr = string & { _type: "url" }

export const toBigSerialNum = (n: number): bigserialnum => n as bigserialnum
export const toSmallSerialNum = (n: number): smallserialnum =>
  n as smallserialnum
export const toSerialNum = (n: number): serialnum => n as serialnum

export const toSmallIntNum = (n: number): smallintnum => n as smallintnum
export const toIntNum = (n: number): intnum => n as intnum
export const toBigIntNum = (n: number): bigintnum => n as bigintnum
export const toFloatNum = (n: number): floatnum => n as floatnum
export const toDoubleNum = (n: number): doublenum => n as doublenum
export const toMoneyNum = (n: number): moneynum => n as moneynum

export const toByteaStr = (s: string): byteastr => s as byteastr
export const toBpcharStr = (s: string): bpcharstr => s as bpcharstr
export const toVarcharStr = (s: string): varcharstr => s as varcharstr
export const toDateStr = (s: string): datestr => s as datestr
export const toCitextStr = (s: string): citextstr => s as citextstr
export const toTimeStr = (s: string): timestr => s as timestr
export const toTimetzStr = (s: string): timetzstr => s as timetzstr
export const toTimestampStr = (s: string): timestampstr => s as timestampstr
export const toTimestamptzStr = (s: string): timestamptzstr =>
  s as timestamptzstr
export const toUuidStr = (s: string): uuidstr => s as uuidstr
export const toVectorStr = (s: string): vectorstr => s as vectorstr

export const toEmailStr = (s: string): emailstr => s as emailstr
export const toUrlStr = (s: string): urlstr => s as urlstr

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enum exports
export type AchievementType =
  | "FIRST_PROBLEM_SOLVED"
  | "FIVE_DAY_STREAK"
  | "TEN_DAY_STREAK"
  | "THIRTY_DAY_STREAK"
  | "FRACTION_MASTER"
  | "DECIMAL_MASTER"
  | "PERCENTAGE_MASTER"
  | "ALGEBRA_MASTER"
  | "WORD_PROBLEM_MASTER"
  | "TEN_PROBLEMS_SOLVED"
  | "FIFTY_PROBLEMS_SOLVED"
  | "HUNDRED_PROBLEMS_SOLVED"

export type EntityType = "PERSON" | "SYSTEM" | "BOT"

export type GenderType = "MALE" | "FEMALE" | "NON_BINARY"

export type GradeLevel = "GRADE_6" | "GRADE_7" | "GRADE_8" | "GRADE_9"

export type MathTopic =
  | "FRACTIONS"
  | "DECIMALS"
  | "PERCENTAGES"
  | "BASIC_ALGEBRA"
  | "WORD_PROBLEMS"

export type ProblemStatus = "SOLVED" | "IN_PROGRESS" | "NEEDS_REVIEW"

export type MediaType = "IMAGE" | "VOICE_RECORDING"

export type MistakeCategory =
  | "COMPUTATIONAL"
  | "CONCEPTUAL"
  | "PROCEDURAL"
  | "SIGN_ERROR"
  | "UNIT_CONVERSION"
  | "MISREAD_PROBLEM"
  | "INCOMPLETE_SOLUTION"
  | "OTHER"

export type DifficultyLevel = "EASY" | "MEDIUM" | "HARD"

export type PracticeSource =
  | "MISTAKE_BASED"
  | "INTEREST_BASED"
  | "TOPIC_REVIEW"
  | "DAILY_CHALLENGE"

// Composite Type exports
export type AchievementV1 = {
  id: uuidstr
  createdAt: timestamptzstr
  updatedAt: timestamptzstr
  userId: uuidstr
  achievementType: AchievementType | null
  earnedAt: timestamptzstr
  isNew: boolean
}

export type AssetV1 = {
  id: uuidstr
  bucketId: string | null
  name: string | null
  ownerId: string | null
  mimeType: string | null
}

export type ConversationHistoryItemV1 = {
  id: uuidstr
  createdAt: timestamptzstr
  updatedAt: timestamptzstr
  topic: MathTopic | null
  problemImageUrl: string | null
  status: ProblemStatus | null
  previewText: string | null
}

export type ConversationMessageAssetV1 = {
  id: uuidstr
  createdAt: timestamptzstr
  updatedAt: timestamptzstr
  conversationMessageId: uuidstr
  objectId: uuidstr
  orderIndex: smallintnum
}

export type ConversationMessageAssetWithDetailsV1 = {
  objectId: uuidstr
  orderIndex: smallintnum
  bucketId: string | null
  name: string | null
  mimeType: string | null
}

export type ConversationMessageAssetWithObjectV1 = {
  objectId: uuidstr
  orderIndex: smallintnum
  bucketId: string | null
  name: string | null
  mimeType: string | null
}

export type ConversationMessageV1 = {
  id: uuidstr
  createdAt: timestamptzstr
  updatedAt: timestamptzstr
  conversationId: uuidstr
  prevMessageId: uuidstr | null
  authorEntityId: uuidstr
  contentText: string | null
  context: Json | null
}

export type ConversationMessageWithDetailsV1 = {
  message: ConversationMessageV1 | null
  entityType: EntityType | null
  assets: ConversationMessageAssetWithDetailsV1[] | null
}

export type ConversationMessageWithEntityTypeV1 = {
  message: ConversationMessageV1 | null
  entityType: EntityType | null
}

export type ConversationParticipantV1 = {
  createdAt: timestamptzstr
  updatedAt: timestamptzstr
  conversationId: uuidstr
  entityId: uuidstr
  deactivatedAt: timestamptzstr | null
}

export type ConversationParticipantWithDetailsV1 = {
  participant: ConversationParticipantV1 | null
  entityType: EntityType | null
  profile: ProfileV1 | null
}

export type ConversationV1 = {
  id: uuidstr
  createdAt: timestamptzstr
  updatedAt: timestamptzstr
  ownerEntityId: uuidstr
  subject: string | null
}

export type ConversationWithContentV1 = {
  conversation: ConversationV1 | null
  messages: ConversationMessageWithDetailsV1[] | null
  participants: ConversationParticipantWithDetailsV1[] | null
}

export type ConversationWithLuminaV1 = {
  conversation: ConversationV1 | null
  luminaData: LuminaConversationV1 | null
}

export type ConversationWithMessagesAndEntityTypeV1 = {
  conversation: ConversationV1 | null
  messages: ConversationMessageWithEntityTypeV1[] | null
}

export type EntityV1 = {
  id: uuidstr
  createdAt: timestamptzstr
  updatedAt: timestamptzstr
  entityType: EntityType | null
  userId: uuidstr | null
  name: string | null
}

export type LuminaConversationV1 = {
  id: uuidstr
  createdAt: timestamptzstr
  updatedAt: timestamptzstr
  title: string | null
  topic: MathTopic | null
  problemImageUrl: string | null
  problemVoiceUrl: string | null
  problemTranscription: string | null
  sourceMediaId: uuidstr | null
  status: ProblemStatus | null
}

export type LuminaHomeDataV1 = {
  givenName: string | null
  currentStreak: intnum
  problemsSolvedToday: intnum
  recentConversations: ConversationWithLuminaV1[] | null
}

export type LuminaProfileV1 = {
  id: uuidstr
  createdAt: timestamptzstr
  updatedAt: timestamptzstr
  gradeLevel: GradeLevel | null
  onboardingCompleted: boolean
}

export type LuminaProgressDataV1 = {
  progress: UserProgressV1 | null
  achievements: AchievementV1[] | null
  topicMasteries: TopicMasteryV1[] | null
  streakHistory: StreakHistoryV1[] | null
}

export type ProblemAttemptV1 = {
  id: uuidstr
  createdAt: timestamptzstr
  updatedAt: timestamptzstr
  userId: uuidstr
  conversationId: uuidstr | null
  problemImageUrl: string | null
  problemVoiceUrl: string | null
  sourceMediaId: uuidstr | null
  extractedProblem: string | null
  topic: MathTopic | null
  wasCorrectFirstTry: boolean
  processedLocally: boolean
  processingTimeInMs: intnum | null
  attemptedAt: timestamptzstr
}

export type ProfileUpdateV1 = {
  updatedAt: timestamptzstr | null
  username: string | null
  fullName: string | null
  avatarUrl: string | null
  gender: GenderType | null
  givenName: string | null
  familyName: string | null
  birthDate: datestr | null
}

export type ProfileV1 = {
  id: uuidstr
  createdAt: timestamptzstr
  updatedAt: timestamptzstr
  username: string | null
  fullName: string | null
  avatarUrl: string | null
  gender: GenderType | null
  givenName: string | null
  familyName: string | null
  birthDate: datestr | null
}

export type ProfileWithEmailV1 = {
  profile: ProfileV1 | null
  email: emailstr | null
}

export type ProfileWithLuminaV1 = {
  profile: ProfileV1 | null
  luminaProfile: LuminaProfileV1 | null
  preferences: UserPreferencesV1 | null
  progress: UserProgressV1 | null
}

export type StreakHistoryV1 = {
  id: uuidstr
  createdAt: timestamptzstr
  updatedAt: timestamptzstr
  userId: uuidstr
  date: datestr
  problemsSolved: intnum
  wasActive: boolean
}

export type TopicMasteryV1 = {
  id: uuidstr
  createdAt: timestamptzstr
  updatedAt: timestamptzstr
  userId: uuidstr
  topic: MathTopic | null
  masteryPercentage: floatnum
  problemsAttempted: intnum
  problemsCorrect: intnum
}

export type UserPreferencesV1 = {
  id: uuidstr
  createdAt: timestamptzstr
  updatedAt: timestamptzstr
  struggleTopics: MathTopic[] | null
  learningConcerns: string | null
  notificationsEnabled: boolean
}

export type UserProgressV1 = {
  id: uuidstr
  createdAt: timestamptzstr
  updatedAt: timestamptzstr
  currentStreak: intnum
  longestStreak: intnum
  problemsSolvedToday: intnum
  totalProblemsSolved: intnum
  lastActiveDate: datestr | null
}

export type UserMediaV1 = {
  id: uuidstr
  createdAt: timestamptzstr
  updatedAt: timestamptzstr
  userId: uuidstr
  mediaType: MediaType | null
  storagePath: string | null
  fileName: string | null
  mimeType: string | null
  fileSizeBytes: intnum | null
  durationInMs: intnum | null
  transcription: string | null
  title: string | null
  isFavorite: boolean
  lastUsedAt: timestamptzstr | null
  useCount: intnum
}

export type UserMediaWithUrlV1 = {
  media: UserMediaV1 | null
  signedUrl: string | null
}

export type MediaLibrarySummaryV1 = {
  totalImages: intnum
  totalVoiceRecordings: intnum
  recentMedia: UserMediaWithUrlV1[] | null
}

export type UserMistakeV1 = {
  id: uuidstr
  createdAt: timestamptzstr
  updatedAt: timestamptzstr
  userId: uuidstr
  problemAttemptId: uuidstr | null
  topic: MathTopic | null
  mistakeCategory: MistakeCategory | null
  problemText: string | null
  incorrectAnswer: string | null
  correctAnswer: string | null
  explanation: string | null
  occurrenceCount: intnum
  lastOccurredAt: timestamptzstr
  isResolved: boolean
  resolvedAt: timestamptzstr | null
}

export type PracticeProblemV1 = {
  id: uuidstr
  createdAt: timestamptzstr
  updatedAt: timestamptzstr
  userId: uuidstr
  topic: MathTopic | null
  difficulty: DifficultyLevel | null
  source: PracticeSource | null
  sourceMistakeId: uuidstr | null
  problemText: string | null
  hint: string | null
  solution: string | null
  solutionSteps: string[] | null
  isCompleted: boolean
  completedAt: timestamptzstr | null
  wasCorrect: boolean | null
  userAnswer: string | null
  timeSpentInMs: intnum | null
}

export type PracticeSessionV1 = {
  id: uuidstr
  createdAt: timestamptzstr
  updatedAt: timestamptzstr
  userId: uuidstr
  startedAt: timestamptzstr
  endedAt: timestamptzstr | null
  problemsAttempted: intnum
  problemsCorrect: intnum
  totalTimeInMs: intnum
  topicsPracticed: MathTopic[] | null
}

export type MistakeTopicSummaryV1 = {
  topic: MathTopic | null
  totalMistakes: intnum
  unresolvedMistakes: intnum
  mostCommonCategory: MistakeCategory | null
}

export type PracticeDataV1 = {
  currentSession: PracticeSessionV1 | null
  pendingProblems: PracticeProblemV1[] | null
  recentMistakes: UserMistakeV1[] | null
  mistakesByTopic: MistakeTopicSummaryV1[] | null
}

export type UserV1 = {
  id: uuidstr
  email: emailstr | null
  role: varcharstr | null
  emailConfirmedAt: timestamptzstr | null
  lastSignInAt: timestamptzstr | null
  createdAt: timestamptzstr | null
  updatedAt: timestamptzstr | null
  phone: string | null
  isSsoUser: boolean
  deletedAt: timestamptzstr | null
}

export type Database = {
  public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      "admin:assets:user:read": {
        Args: { ownerId: uuidstr | null }
        Returns: AssetV1[]
      }
      "admin:conversation:readWithMessagesAndEntityTypes": {
        Args: { conversationId: uuidstr | null }
        Returns: ConversationWithMessagesAndEntityTypeV1
      }
      "admin:conversation:user:create": {
        Args: {
          authorEntityId: uuidstr | null
          otherEntityIds: uuidstr[] | null
        }
        Returns: uuidstr
      }
      "admin:entity:getByEmail": {
        Args: { userEmail: string | null }
        Returns: {
          entityId: uuidstr
          email: string
        }[]
      }
      "admin:user:deleteRelatedData": {
        Args: { userId: uuidstr | null }
        Returns: undefined
      }
      "app:assets:user:read": {
        Args: Record<PropertyKey, never>
        Returns: AssetV1[]
      }
      "app:conversation:message:asset:user:readAllWithObject": {
        Args: { conversationMessageId: uuidstr | null }
        Returns: ConversationMessageAssetWithObjectV1[]
      }
      "app:conversation:message:create": {
        Args: {
          conversationId: uuidstr | null
          contentText: string | null
          botEntityId: uuidstr | null
          prevMessageId?: uuidstr | null
        }
        Returns: ConversationMessageV1
      }
      "app:conversation:message:upsertAllWithAssets": {
        Args: {
          messages: ConversationMessageV1[] | null
          assets: ConversationMessageAssetV1[] | null
        }
        Returns: {
          messageCount: intnum
          assetCount: intnum
        }[]
      }
      "app:conversation:user:create": {
        Args: { otherEntityIds: uuidstr[] | null }
        Returns: uuidstr
      }
      "app:conversation:user:readAll": {
        Args: Record<PropertyKey, never>
        Returns: ConversationV1[]
      }
      "app:conversation:user:readWithContent": {
        Args: { conversationId: uuidstr | null }
        Returns: ConversationWithContentV1
      }
      "app:conversation:user:readWithMessagesAndEntityTypes": {
        Args: { conversationId: uuidstr | null }
        Returns: ConversationWithMessagesAndEntityTypeV1
      }
      "app:conversation:user:readWithOtherParticipantsExact": {
        Args: { otherParticipantEntityIds: uuidstr[] | null }
        Returns: ConversationV1[]
      }
      "app:entity:exists": {
        Args: { entityId: uuidstr | null }
        Returns: boolean
      }
      "app:entity:user:create": {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      "app:entity:user:read": {
        Args: Record<PropertyKey, never>
        Returns: EntityV1
      }
      "app:entity:user:update": {
        Args: { newEntityType?: EntityType | null; newName?: string | null }
        Returns: boolean
      }
      "app:lumina:achievement:award": {
        Args: { achievementType: AchievementType | null }
        Returns: AchievementV1
      }
      "app:lumina:achievement:markViewed": {
        Args: { achievementId: uuidstr | null }
        Returns: AchievementV1
      }
      "app:lumina:achievement:readAll": {
        Args: Record<PropertyKey, never>
        Returns: AchievementV1[]
      }
      "app:lumina:conversation:delete": {
        Args: { conversationId: uuidstr | null }
        Returns: boolean
      }
      "app:lumina:conversation:read": {
        Args: { conversationId: uuidstr | null }
        Returns: LuminaConversationV1
      }
      "app:lumina:conversation:readAll": {
        Args: Record<PropertyKey, never>
        Returns: ConversationWithLuminaV1[]
      }
      "app:lumina:conversation:readAllWithPreview": {
        Args: Record<PropertyKey, never>
        Returns: ConversationHistoryItemV1[]
      }
      "app:lumina:conversation:upsert": {
        Args: {
          conversationId: uuidstr | null
          title?: string | null
          topic?: MathTopic | null
          problemImageUrl?: string | null
          problemVoiceUrl?: string | null
          problemTranscription?: string | null
          sourceMediaId?: uuidstr | null
          status?: ProblemStatus | null
        }
        Returns: LuminaConversationV1
      }
      "app:lumina:home:read": {
        Args: Record<PropertyKey, never>
        Returns: LuminaHomeDataV1
      }
      "app:lumina:media:create": {
        Args: {
          mediaType: MediaType | null
          storagePath: string | null
          fileName: string | null
          mimeType: string | null
          fileSizeBytes?: intnum | null
          durationInMs?: intnum | null
          transcription?: string | null
          title?: string | null
        }
        Returns: UserMediaV1
      }
      "app:lumina:media:read": {
        Args: { mediaId: uuidstr | null }
        Returns: UserMediaV1
      }
      "app:lumina:media:readAll": {
        Args: {
          mediaType?: MediaType | null
          limit?: intnum | null
          offset?: intnum | null
        }
        Returns: UserMediaV1[]
      }
      "app:lumina:media:readRecent": {
        Args: { limit?: intnum | null }
        Returns: UserMediaV1[]
      }
      "app:lumina:media:readFavorites": {
        Args: { mediaType?: MediaType | null }
        Returns: UserMediaV1[]
      }
      "app:lumina:media:update": {
        Args: {
          mediaId: uuidstr | null
          title?: string | null
          transcription?: string | null
          isFavorite?: boolean | null
        }
        Returns: UserMediaV1
      }
      "app:lumina:media:recordUsage": {
        Args: { mediaId: uuidstr | null }
        Returns: UserMediaV1
      }
      "app:lumina:media:delete": {
        Args: { mediaId: uuidstr | null }
        Returns: boolean
      }
      "app:lumina:media:summary": {
        Args: Record<PropertyKey, never>
        Returns: MediaLibrarySummaryV1
      }
      "app:lumina:onboarding:complete": {
        Args: {
          givenName: string | null
          gradeLevel: GradeLevel | null
          struggleTopics: MathTopic[] | null
          learningConcerns?: string | null
        }
        Returns: ProfileWithLuminaV1
      }
      "app:lumina:onboarding:isCompleted": {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      "app:lumina:preferences:read": {
        Args: Record<PropertyKey, never>
        Returns: UserPreferencesV1
      }
      "app:lumina:preferences:upsert": {
        Args: {
          struggleTopics: MathTopic[] | null
          learningConcerns?: string | null
          notificationsEnabled?: boolean | null
        }
        Returns: UserPreferencesV1
      }
      "app:lumina:problemAttempt:create": {
        Args: {
          problemImageUrl?: string | null
          problemVoiceUrl?: string | null
          sourceMediaId?: uuidstr | null
          conversationId?: uuidstr | null
          extractedProblem?: string | null
          topic?: MathTopic | null
          wasCorrectFirstTry?: boolean | null
          processedLocally?: boolean | null
          processingTimeInMs?: intnum | null
        }
        Returns: ProblemAttemptV1
      }
      "app:lumina:problemAttempt:readRecent": {
        Args: { limit?: intnum | null }
        Returns: ProblemAttemptV1[]
      }
      "app:lumina:profile:completeOnboarding": {
        Args: Record<PropertyKey, never>
        Returns: LuminaProfileV1
      }
      "app:lumina:profile:read": {
        Args: Record<PropertyKey, never>
        Returns: LuminaProfileV1
      }
      "app:lumina:profile:upsert": {
        Args: {
          gradeLevel: GradeLevel | null
          onboardingCompleted?: boolean | null
        }
        Returns: LuminaProfileV1
      }
      "app:lumina:progress:init": {
        Args: Record<PropertyKey, never>
        Returns: UserProgressV1
      }
      "app:lumina:progress:read": {
        Args: Record<PropertyKey, never>
        Returns: UserProgressV1
      }
      "app:lumina:progress:recordProblemSolved": {
        Args: Record<PropertyKey, never>
        Returns: UserProgressV1
      }
      "app:lumina:progressData:read": {
        Args: Record<PropertyKey, never>
        Returns: LuminaProgressDataV1
      }
      "app:lumina:streakHistory:read": {
        Args: { startDate?: datestr | null; endDate?: datestr | null }
        Returns: StreakHistoryV1[]
      }
      "app:lumina:topicMastery:readAll": {
        Args: Record<PropertyKey, never>
        Returns: TopicMasteryV1[]
      }
      "app:lumina:topicMastery:recordAttempt": {
        Args: { topic: MathTopic | null; wasCorrect: boolean | null }
        Returns: TopicMasteryV1
      }
      "app:lumina:mistake:create": {
        Args: {
          topic: MathTopic | null
          problemText: string | null
          mistakeCategory?: MistakeCategory | null
          incorrectAnswer?: string | null
          correctAnswer?: string | null
          explanation?: string | null
          problemAttemptId?: uuidstr | null
        }
        Returns: UserMistakeV1
      }
      "app:lumina:mistake:readAll": {
        Args: {
          topic?: MathTopic | null
          unresolvedOnly?: boolean | null
          limit?: intnum | null
        }
        Returns: UserMistakeV1[]
      }
      "app:lumina:mistake:readRecentUnresolved": {
        Args: { limit?: intnum | null }
        Returns: UserMistakeV1[]
      }
      "app:lumina:mistake:resolve": {
        Args: { mistakeId: uuidstr | null }
        Returns: UserMistakeV1
      }
      "app:lumina:mistake:incrementOccurrence": {
        Args: { mistakeId: uuidstr | null }
        Returns: UserMistakeV1
      }
      "app:lumina:mistake:summaryByTopic": {
        Args: Record<PropertyKey, never>
        Returns: MistakeTopicSummaryV1[]
      }
      "app:lumina:practice:create": {
        Args: {
          topic: MathTopic | null
          problemText: string | null
          solution: string | null
          source: PracticeSource | null
          difficulty?: DifficultyLevel | null
          hint?: string | null
          solutionSteps?: string[] | null
          sourceMistakeId?: uuidstr | null
        }
        Returns: PracticeProblemV1
      }
      "app:lumina:practice:readPending": {
        Args: {
          topic?: MathTopic | null
          limit?: intnum | null
        }
        Returns: PracticeProblemV1[]
      }
      "app:lumina:practice:read": {
        Args: { problemId: uuidstr | null }
        Returns: PracticeProblemV1
      }
      "app:lumina:practice:complete": {
        Args: {
          problemId: uuidstr | null
          userAnswer: string | null
          wasCorrect: boolean | null
          timeSpentInMs?: intnum | null
        }
        Returns: PracticeProblemV1
      }
      "app:lumina:practice:getData": {
        Args: Record<PropertyKey, never>
        Returns: PracticeDataV1
      }
      "app:lumina:practiceSession:start": {
        Args: Record<PropertyKey, never>
        Returns: PracticeSessionV1
      }
      "app:lumina:practiceSession:getOrCreate": {
        Args: Record<PropertyKey, never>
        Returns: PracticeSessionV1
      }
      "app:lumina:practiceSession:recordProblem": {
        Args: {
          sessionId: uuidstr | null
          topic: MathTopic | null
          wasCorrect: boolean | null
          timeSpentInMs?: intnum | null
        }
        Returns: PracticeSessionV1
      }
      "app:lumina:practiceSession:end": {
        Args: { sessionId: uuidstr | null }
        Returns: PracticeSessionV1
      }
      "app:profile:user:read": {
        Args: Record<PropertyKey, never>
        Returns: ProfileV1
      }
      "app:profile:user:readWithEmail": {
        Args: Record<PropertyKey, never>
        Returns: ProfileWithEmailV1
      }
      "app:profile:user:update": {
        Args: {
          avatarUrl?: string | null
          username?: string | null
          fullName?: string | null
          givenName?: string | null
          familyName?: string | null
          birthDate?: datestr | null
          gender?: GenderType | null
          updatedAt?: timestamptzstr | null
        }
        Returns: ProfileV1
      }
      int_id_from_millis: {
        Args: { millis_since_1970: bigintnum | null }
        Returns: intnum
      }
      int_id_from_timestamp: {
        Args: { ts?: timestamptzstr | null }
        Returns: intnum
      }
      uuid_add_millis_and_id: {
        Args: {
          uuid1: uuidstr | null
          millis_since1970?: bigintnum | null
          uuid2?: uuidstr | null
        }
        Returns: uuidstr
      }
      uuid_add_timestamp_and_id: {
        Args: {
          uuid1: uuidstr | null
          ts?: timestamptzstr | null
          uuid2?: uuidstr | null
        }
        Returns: uuidstr
      }
      uuid_at: {
        Args: { time_id: bigintnum | null; space_id?: bigintnum | null }
        Returns: uuidstr
      }
      uuid_from_base64: {
        Args: { uuid_base64: string | null }
        Returns: uuidstr
      }
      uuid_from_longs: {
        Args: { msb: bigintnum | null; lsb: bigintnum | null }
        Returns: uuidstr
      }
      uuid_from_millis: {
        Args: { millis_since_1970: bigintnum | null; uuid1: uuidstr | null }
        Returns: uuidstr
      }
      uuid_from_timestamp: {
        Args: { ts?: timestamptzstr | null; uuid1?: uuidstr | null }
        Returns: uuidstr
      }
      uuid_to_base64: {
        Args: { uuid1: uuidstr | null }
        Returns: string
      }
      uuid_to_millis: {
        Args: { uuid1: uuidstr | null }
        Returns: bigintnum
      }
    }
    Enums: {
      achievement_type: AchievementType
      entity_type: EntityType
      gender_type: GenderType
      grade_level: GradeLevel
      math_topic: MathTopic
      media_type: MediaType
      problem_status: ProblemStatus
      mistake_category: MistakeCategory
      difficulty_level: DifficultyLevel
      practice_source: PracticeSource
    }
    CompositeTypes: {
      AchievementV1: AchievementV1
      AssetV1: AssetV1
      ConversationHistoryItemV1: ConversationHistoryItemV1
      ConversationMessageAssetV1: ConversationMessageAssetV1
      ConversationMessageAssetWithDetailsV1: ConversationMessageAssetWithDetailsV1
      ConversationMessageAssetWithObjectV1: ConversationMessageAssetWithObjectV1
      ConversationMessageV1: ConversationMessageV1
      ConversationMessageWithDetailsV1: ConversationMessageWithDetailsV1
      ConversationMessageWithEntityTypeV1: ConversationMessageWithEntityTypeV1
      ConversationParticipantV1: ConversationParticipantV1
      ConversationParticipantWithDetailsV1: ConversationParticipantWithDetailsV1
      ConversationV1: ConversationV1
      ConversationWithContentV1: ConversationWithContentV1
      ConversationWithLuminaV1: ConversationWithLuminaV1
      ConversationWithMessagesAndEntityTypeV1: ConversationWithMessagesAndEntityTypeV1
      EntityV1: EntityV1
      LuminaConversationV1: LuminaConversationV1
      LuminaHomeDataV1: LuminaHomeDataV1
      LuminaProfileV1: LuminaProfileV1
      LuminaProgressDataV1: LuminaProgressDataV1
      MediaLibrarySummaryV1: MediaLibrarySummaryV1
      MistakeTopicSummaryV1: MistakeTopicSummaryV1
      PracticeDataV1: PracticeDataV1
      PracticeProblemV1: PracticeProblemV1
      PracticeSessionV1: PracticeSessionV1
      ProblemAttemptV1: ProblemAttemptV1
      ProfileUpdateV1: ProfileUpdateV1
      ProfileV1: ProfileV1
      ProfileWithEmailV1: ProfileWithEmailV1
      ProfileWithLuminaV1: ProfileWithLuminaV1
      StreakHistoryV1: StreakHistoryV1
      TopicMasteryV1: TopicMasteryV1
      UserMediaV1: UserMediaV1
      UserMediaWithUrlV1: UserMediaWithUrlV1
      UserMistakeV1: UserMistakeV1
      UserPreferencesV1: UserPreferencesV1
      UserProgressV1: UserProgressV1
      UserV1: UserV1
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      achievement_type: [
        "FIRST_PROBLEM_SOLVED",
        "FIVE_DAY_STREAK",
        "TEN_DAY_STREAK",
        "THIRTY_DAY_STREAK",
        "FRACTION_MASTER",
        "DECIMAL_MASTER",
        "PERCENTAGE_MASTER",
        "ALGEBRA_MASTER",
        "WORD_PROBLEM_MASTER",
        "TEN_PROBLEMS_SOLVED",
        "FIFTY_PROBLEMS_SOLVED",
        "HUNDRED_PROBLEMS_SOLVED",
      ],
      entity_type: ["PERSON", "SYSTEM", "BOT"],
      gender_type: ["MALE", "FEMALE", "NON_BINARY"],
      grade_level: ["GRADE_6", "GRADE_7", "GRADE_8", "GRADE_9"],
      math_topic: [
        "FRACTIONS",
        "DECIMALS",
        "PERCENTAGES",
        "BASIC_ALGEBRA",
        "WORD_PROBLEMS",
      ],
      media_type: ["IMAGE", "VOICE_RECORDING"],
      problem_status: ["SOLVED", "IN_PROGRESS", "NEEDS_REVIEW"],
    },
  },
} as const
