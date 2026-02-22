/**
 * App Specific LLM Request Creator for Bot. Given a bot, this function returns the request creator to be used by the LLM for that bot.
 */

import OpenAI from 'openai';

import {
  readLearnerMemorySourceData,
  type LearnerMemorySourceDataV1,
} from '../../_shared-client/lumina-db.ts';
import type {
  MathTopic,
  ProblemAttemptV1,
  TopicMasteryV1,
} from '../../_shared-client/generated-db-types.ts';
import { config } from '../../_shared/config.ts';
import type { ConversationContext } from '../../_shared/llm/llm-conversation.ts';
import { toCompletionMessageParam } from '../../_shared/llm/llm-conversation.ts';
import { createCompletionRequest } from '../../_shared/llm/request-utils.ts';
import type { LlmRequestCreator } from '../../_shared/llm/tools/tool-invocation.ts';
import type {
  CustomLlmRequestCreator,
  CustomLlmRequestCreatorProps,
} from '../../_shared/llm/custom-llm-conversation.ts';
import { CactusGatewayClient } from './cactusGatewayClient.ts';
import { hybridRoutingPolicy } from './hybridRoutingPolicy.ts';

interface OrchestrationContext {
  conversationId?: string;
  problemId?: string;
  imageUri?: string;
  voiceUri?: string;
  audioBase64?: string;
  audioMimeType?: string;
}

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1';
const GEMINI_MODEL = 'gemini-2.5-flash';
const TRANSCRIPTION_OUTPUT_MAX_TOKENS = 1024;
const TRANSCRIPTION_LOG_PREVIEW_LENGTH = 100;
const DEFAULT_LEARNER_MEMORY_RECENT_ATTEMPT_LIMIT = 10;
const MAX_TOPIC_SUMMARY_ITEMS = 3;
const MAX_MISTAKE_PATTERN_TOPICS = 2;
const MIN_ATTEMPTS_FOR_CONFIDENT_TOPIC_SIGNAL = 2;
const MIN_REPEATED_MISTAKE_COUNT = 2;
const LOW_MASTERY_MAX_PERCENT = 50;
const HIGH_MASTERY_MIN_PERCENT = 85;
const LOW_ACCURACY_MAX_RATIO = 0.55;
const HIGH_ACCURACY_MIN_RATIO = 0.85;
const FAST_PACE_MAX_PROCESSING_TIME_IN_MS = 45000;
const SLOW_PACE_MIN_PROCESSING_TIME_IN_MS = 120000;
const PERCENT_SCALE = 100;
const MAX_LEARNING_CONCERN_LENGTH = 220;
const IMAGE_CONTENT_PART_TYPE = 'image_url';

const TOPIC_LABEL_BY_TOPIC: Record<MathTopic, string> = {
  BASIC_ALGEBRA: 'basic algebra',
  DECIMALS: 'decimals',
  FRACTIONS: 'fractions',
  PERCENTAGES: 'percentages',
  WORD_PROBLEMS: 'word problems',
};

const SLOW_PACING_KEYWORDS = ['slow', 'step by step', 'struggle', 'confused', 'careful'] as const;
const FAST_PACING_KEYWORDS = ['fast', 'quick', 'challenge', 'advanced'] as const;

interface AttemptStats {
  attemptCount: number;
  firstTryAccuracyRatio?: number;
  averageProcessingTimeInMs?: number;
  incorrectAttemptsByTopic: Map<MathTopic, number>;
  unknownTopicIncorrectAttemptCount: number;
}

interface KnownTopicMastery {
  topic: MathTopic;
  masteryPercentage: number;
  problemsAttempted: number;
}

interface EnhancedSystemPromptOptions {
  extraContext?: OrchestrationContext;
  transcribedText?: string;
  hasImageAttachment: boolean;
  learnerMemorySummary?: string;
}

function hasImageContentPart(content: OpenAI.ChatCompletionMessageParam['content'] | null | undefined): boolean {
  if (!Array.isArray(content)) {
    return false;
  }

  for (const contentPart of content) {
    if (contentPart.type === IMAGE_CONTENT_PART_TYPE) {
      return true;
    }
  }

  return false;
}

async function transcribeAudioWithGemini(
  audioBase64: string,
  audioMimeType: string,
): Promise<string | undefined> {
  const apiKey = config.geminiApiKey;
  
  if (!apiKey) {
    console.warn('Gemini API key not configured for transcription');
    return undefined;
  }
  
  try {
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: 'Transcribe this audio recording. The person is describing a math problem. Output ONLY the transcription of what they said, nothing else.',
            },
            {
              inline_data: {
                mime_type: audioMimeType,
                data: audioBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: TRANSCRIPTION_OUTPUT_MAX_TOKENS,
      },
    };

    const response = await fetch(
      `${GEMINI_API_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini transcription API error:', response.status, errorText);
      return undefined;
    }

    const data = await response.json();
    const transcription = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (transcription) {
      console.log(
        'Gemini transcription successful:',
        `${transcription.substring(0, TRANSCRIPTION_LOG_PREVIEW_LENGTH)}...`,
      );
      return transcription.trim();
    }
    
    return undefined;
  } catch (error) {
    console.error('Gemini transcription failed:', error);
    return undefined;
  }
}

async function transcribeAudioWithCactus(
  audioBase64: string,
  audioMimeType: string,
): Promise<string | undefined> {
  try {
    const cactusClient = new CactusGatewayClient(hybridRoutingPolicy.cactusGatewayUrl);
    
    // Check if gateway is healthy
    const isHealthy = await cactusClient.checkHealth();
    if (!isHealthy) {
      console.warn('Cactus gateway not available for transcription');
      return undefined;
    }
    
    const result = await cactusClient.transcribe(
      audioBase64,
      audioMimeType,
      'Transcribe this audio recording of someone describing a math problem. Output only the transcription, nothing else.',
    );
    
    console.log('Cactus transcription result:', result.text, 'time:', result.totalTimeInMs, 'ms');
    return result.text;
  } catch (error) {
    console.error('Cactus transcription failed:', error);
    return undefined;
  }
}

async function transcribeAudio(
  audioBase64: string,
  audioMimeType: string,
): Promise<string | undefined> {
  // Try Cactus gateway first (which uses Gemini internally)
  const cactusResult = await transcribeAudioWithCactus(audioBase64, audioMimeType);
  if (cactusResult) {
    return cactusResult;
  }
  
  // Fall back to direct Gemini API call if Cactus is unavailable
  console.log('Falling back to direct Gemini API for transcription');
  return transcribeAudioWithGemini(audioBase64, audioMimeType);
}

function isVoiceRequest(extraContext?: OrchestrationContext): boolean {
  return extraContext?.voiceUri != null || extraContext?.audioBase64 != null;
}

function containsAnyKeyword(text: string, keywords: readonly string[]): boolean {
  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      return true;
    }
  }
  return false;
}

function sanitizeSingleLineText(text: string, maxLength: number): string {
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  if (normalizedText.length <= maxLength) {
    return normalizedText;
  }
  return `${normalizedText.slice(0, maxLength).trim()}...`;
}

function formatMathTopic(topic: MathTopic): string {
  return TOPIC_LABEL_BY_TOPIC[topic] ?? topic.toLowerCase().replace(/_/g, ' ');
}

function formatLabelList(labels: string[]): string {
  if (labels.length < 1) {
    return '';
  }
  if (labels.length === 1) {
    return labels[0];
  }
  const leadingLabels = labels.slice(0, labels.length - 1);
  const trailingLabel = labels[labels.length - 1];
  return `${leadingLabels.join(', ')} and ${trailingLabel}`;
}

function takeTopicLabels(topics: MathTopic[], maxItems: number): string[] {
  const seenTopics = new Set<MathTopic>();
  const topicLabels: string[] = [];
  for (const topic of topics) {
    if (seenTopics.has(topic)) {
      continue;
    }
    seenTopics.add(topic);
    topicLabels.push(formatMathTopic(topic));
    if (topicLabels.length >= maxItems) {
      break;
    }
  }
  return topicLabels;
}

function compareTopicMasteryAscending(
  firstTopicMastery: KnownTopicMastery,
  secondTopicMastery: KnownTopicMastery,
): number {
  return firstTopicMastery.masteryPercentage - secondTopicMastery.masteryPercentage;
}

function compareTopicMasteryDescending(
  firstTopicMastery: KnownTopicMastery,
  secondTopicMastery: KnownTopicMastery,
): number {
  return secondTopicMastery.masteryPercentage - firstTopicMastery.masteryPercentage;
}

function toKnownTopicMasteries(topicMasteries: TopicMasteryV1[]): KnownTopicMastery[] {
  const knownTopicMasteries: KnownTopicMastery[] = [];
  for (const topicMastery of topicMasteries) {
    if (topicMastery.topic == null) {
      continue;
    }
    knownTopicMasteries.push({
      topic: topicMastery.topic,
      masteryPercentage: topicMastery.masteryPercentage,
      problemsAttempted: topicMastery.problemsAttempted,
    });
  }
  return knownTopicMasteries;
}

function buildTopicDifficultySummary(
  topicMasteries: TopicMasteryV1[],
  struggleTopics?: MathTopic[],
): string | undefined {
  const knownTopicMasteries = toKnownTopicMasteries(topicMasteries);
  const ascendingTopicMasteries = [...knownTopicMasteries].sort(compareTopicMasteryAscending);
  const descendingTopicMasteries = [...knownTopicMasteries].sort(compareTopicMasteryDescending);

  const difficultTopics: MathTopic[] = [];
  for (const topicMastery of ascendingTopicMasteries) {
    if (
      topicMastery.masteryPercentage <= LOW_MASTERY_MAX_PERCENT
      && topicMastery.problemsAttempted >= MIN_ATTEMPTS_FOR_CONFIDENT_TOPIC_SIGNAL
    ) {
      difficultTopics.push(topicMastery.topic);
    }
  }

  if (difficultTopics.length < 1 && struggleTopics != null) {
    for (const struggleTopic of struggleTopics) {
      difficultTopics.push(struggleTopic);
    }
  }

  const strongTopics: MathTopic[] = [];
  for (const topicMastery of descendingTopicMasteries) {
    if (
      topicMastery.masteryPercentage >= HIGH_MASTERY_MIN_PERCENT
      && topicMastery.problemsAttempted >= MIN_ATTEMPTS_FOR_CONFIDENT_TOPIC_SIGNAL
    ) {
      strongTopics.push(topicMastery.topic);
    }
  }

  const topicDifficultyParts: string[] = [];
  const difficultTopicLabels = takeTopicLabels(difficultTopics, MAX_TOPIC_SUMMARY_ITEMS);
  if (difficultTopicLabels.length > 0) {
    topicDifficultyParts.push(`needs support in ${formatLabelList(difficultTopicLabels)}`);
  }

  const strongTopicLabels = takeTopicLabels(strongTopics, MAX_TOPIC_SUMMARY_ITEMS);
  if (strongTopicLabels.length > 0) {
    topicDifficultyParts.push(`strong in ${formatLabelList(strongTopicLabels)}`);
  }

  if (topicDifficultyParts.length < 1) {
    return undefined;
  }
  return `${topicDifficultyParts.join('; ')}.`;
}

function computeAttemptStats(recentProblemAttempts: ProblemAttemptV1[]): AttemptStats {
  let correctFirstTryCount = 0;
  let totalProcessingTimeInMs = 0;
  let attemptsWithProcessingTimeCount = 0;
  const incorrectAttemptsByTopic = new Map<MathTopic, number>();
  let unknownTopicIncorrectAttemptCount = 0;

  for (const recentProblemAttempt of recentProblemAttempts) {
    if (recentProblemAttempt.wasCorrectFirstTry) {
      correctFirstTryCount += 1;
    } else if (recentProblemAttempt.topic != null) {
      const topicIncorrectAttempts = incorrectAttemptsByTopic.get(recentProblemAttempt.topic) ?? 0;
      incorrectAttemptsByTopic.set(recentProblemAttempt.topic, topicIncorrectAttempts + 1);
    } else {
      unknownTopicIncorrectAttemptCount += 1;
    }

    if (recentProblemAttempt.processingTimeInMs != null) {
      totalProcessingTimeInMs += recentProblemAttempt.processingTimeInMs;
      attemptsWithProcessingTimeCount += 1;
    }
  }

  const firstTryAccuracyRatio =
    recentProblemAttempts.length > 0 ? correctFirstTryCount / recentProblemAttempts.length : undefined;
  const averageProcessingTimeInMs =
    attemptsWithProcessingTimeCount > 0
      ? totalProcessingTimeInMs / attemptsWithProcessingTimeCount
      : undefined;

  return {
    attemptCount: recentProblemAttempts.length,
    firstTryAccuracyRatio,
    averageProcessingTimeInMs,
    incorrectAttemptsByTopic,
    unknownTopicIncorrectAttemptCount,
  };
}

function inferPreferredPacingInstruction(
  learningConcerns: string | undefined,
  attemptStats: AttemptStats,
): string {
  const normalizedLearningConcerns = learningConcerns?.toLowerCase().trim();
  if (normalizedLearningConcerns != null) {
    if (containsAnyKeyword(normalizedLearningConcerns, SLOW_PACING_KEYWORDS)) {
      return 'slow and guided with explicit checkpoints before moving to the next step';
    }
    if (containsAnyKeyword(normalizedLearningConcerns, FAST_PACING_KEYWORDS)) {
      return 'quicker pace with concise explanations and periodic checks for understanding';
    }
  }

  if (
    attemptStats.firstTryAccuracyRatio != null
    && attemptStats.firstTryAccuracyRatio <= LOW_ACCURACY_MAX_RATIO
  ) {
    return 'slow and guided with more worked examples before independent practice';
  }

  if (
    attemptStats.averageProcessingTimeInMs != null
    && attemptStats.averageProcessingTimeInMs >= SLOW_PACE_MIN_PROCESSING_TIME_IN_MS
  ) {
    return 'slow and guided with smaller steps and frequent comprehension checks';
  }

  if (
    attemptStats.firstTryAccuracyRatio != null
    && attemptStats.firstTryAccuracyRatio >= HIGH_ACCURACY_MIN_RATIO
    && attemptStats.averageProcessingTimeInMs != null
    && attemptStats.averageProcessingTimeInMs <= FAST_PACE_MAX_PROCESSING_TIME_IN_MS
  ) {
    return 'faster pace with challenge prompts after each solution';
  }

  return 'balanced pace with step-by-step explanations and short recap checks';
}

function buildMistakePatternSummary(attemptStats: AttemptStats): string | undefined {
  if (attemptStats.attemptCount < 1) {
    return undefined;
  }

  const repeatedMistakeTopics: { topic: MathTopic; incorrectAttemptCount: number }[] = [];
  for (const [topic, incorrectAttemptCount] of attemptStats.incorrectAttemptsByTopic.entries()) {
    if (incorrectAttemptCount >= MIN_REPEATED_MISTAKE_COUNT) {
      repeatedMistakeTopics.push({ topic, incorrectAttemptCount });
    }
  }

  repeatedMistakeTopics.sort(function compareRepeatedMistakes(firstMistake, secondMistake): number {
    return secondMistake.incorrectAttemptCount - firstMistake.incorrectAttemptCount;
  });

  const repeatedMistakeTopicLabels = takeTopicLabels(
    repeatedMistakeTopics.map(function toTopic(repeatedMistake): MathTopic {
      return repeatedMistake.topic;
    }),
    MAX_MISTAKE_PATTERN_TOPICS,
  );

  const mistakePatternParts: string[] = [];
  if (attemptStats.firstTryAccuracyRatio != null) {
    const firstTryAccuracyPercent = Math.round(attemptStats.firstTryAccuracyRatio * PERCENT_SCALE);
    mistakePatternParts.push(`first-try accuracy is ${firstTryAccuracyPercent}%`);
  }

  if (repeatedMistakeTopicLabels.length > 0) {
    mistakePatternParts.push(`repeated first-try mistakes in ${formatLabelList(repeatedMistakeTopicLabels)}`);
  }

  if (attemptStats.unknownTopicIncorrectAttemptCount > 0) {
    mistakePatternParts.push('some incorrect attempts had no tagged topic');
  }

  if (mistakePatternParts.length < 1) {
    return undefined;
  }
  return `${mistakePatternParts.join('; ')}.`;
}

function buildLearnerMemorySummary(memorySourceData: LearnerMemorySourceDataV1): string | undefined {
  const hasPreferences = memorySourceData.preferences != null;
  const hasTopicMasteryData = memorySourceData.topicMasteries.length > 0;
  const hasProblemAttemptData = memorySourceData.recentProblemAttempts.length > 0;

  if (!hasPreferences && !hasTopicMasteryData && !hasProblemAttemptData) {
    return undefined;
  }

  const attemptStats = computeAttemptStats(memorySourceData.recentProblemAttempts);
  const learningConcerns = memorySourceData.preferences?.learningConcerns ?? undefined;
  const pacingInstruction = inferPreferredPacingInstruction(learningConcerns, attemptStats);
  const topicDifficultySummary = buildTopicDifficultySummary(
    memorySourceData.topicMasteries,
    memorySourceData.preferences?.struggleTopics ?? undefined,
  );
  const mistakePatternSummary = buildMistakePatternSummary(attemptStats);

  const memoryLines: string[] = [
    '## Learner Memory - Persistent Personalization',
    'Use this memory consistently across turns unless the learner asks for a different style.',
    `- Preferred pacing: ${pacingInstruction}.`,
  ];

  if (topicDifficultySummary != null) {
    memoryLines.push(`- Topic difficulty: ${topicDifficultySummary}`);
  }

  if (mistakePatternSummary != null) {
    memoryLines.push(`- Mistake patterns: ${mistakePatternSummary}`);
  }

  const struggleTopics = memorySourceData.preferences?.struggleTopics ?? undefined;
  if (struggleTopics != null && struggleTopics.length > 0) {
    const struggleTopicLabels = takeTopicLabels(struggleTopics, MAX_TOPIC_SUMMARY_ITEMS);
    memoryLines.push(`- Learner-reported struggle topics: ${formatLabelList(struggleTopicLabels)}.`);
  }

  if (learningConcerns != null && learningConcerns.trim().length > 0) {
    const sanitizedLearningConcerns = sanitizeSingleLineText(learningConcerns, MAX_LEARNING_CONCERN_LENGTH);
    memoryLines.push(`- Learner-reported concern: "${sanitizedLearningConcerns}".`);
  }

  memoryLines.push(
    '- Tutoring directive: Adjust depth and pacing to this profile, and check understanding after each major step.',
  );

  return memoryLines.join('\n');
}

async function readLearnerMemorySummary(
  props: CustomLlmRequestCreatorProps,
): Promise<string | undefined> {
  try {
    const memorySourceData = await readLearnerMemorySourceData(props.supabaseClient, {
      recentAttemptLimit: DEFAULT_LEARNER_MEMORY_RECENT_ATTEMPT_LIMIT,
    });
    return buildLearnerMemorySummary(memorySourceData);
  } catch (error) {
    console.error('readLearnerMemorySummary error:', error);
    return undefined;
  }
}

function buildEnhancedSystemPrompt(
  basePrompt: string,
  options: EnhancedSystemPromptOptions,
): string {
  let enhancedPrompt = basePrompt;

  if (options.learnerMemorySummary) {
    enhancedPrompt += `\n\n${options.learnerMemorySummary}`;
  }

  if (options.hasImageAttachment || options.extraContext?.imageUri) {
    const imageReference = options.hasImageAttachment
      ? 'The latest user message includes an attached image asset in the conversation.'
      : `Fallback image URL: ${options.extraContext?.imageUri ?? ''}`;
    const imageContextAddition = `

## Current Session Context - IMAGE ATTACHED
**IMPORTANT: The student has attached an image of a math problem to this conversation.**

${imageReference}

Before giving tutoring steps, you MUST pass this extraction and validation gate:
1. Extraction: Read the image and extract the exact math problem statement, values, symbols, and constraints.
2. Validation: Verify the extracted details against the image. If any key detail is ambiguous or unreadable, ask a concise clarification question and stop.
3. Tutoring: Only after validated extraction, provide step-by-step help solving the problem.

If extraction confidence is low, do not guess missing values or symbols. Ask the student to confirm or re-upload a clearer image.

Remember to use LaTeX notation for all mathematical expressions in your response.`;

    enhancedPrompt += imageContextAddition;
  }

  if (options.transcribedText) {
    const voiceContextAddition = `

## Current Session Context - VOICE RECORDING TRANSCRIBED
**IMPORTANT: The student recorded a voice message describing a math problem.**

**Transcription of the student's voice message:**
"${options.transcribedText}"

The student described this math problem verbally. Use the transcription above to understand what they need help with.

**Your task:**
1. Acknowledge that you received and understood their voice message
2. Identify the math problem from the transcription
3. Provide step-by-step help solving the problem
4. If the transcription is unclear, ask for clarification

Remember to use LaTeX notation for all mathematical expressions in your response.`;

    enhancedPrompt += voiceContextAddition;
  } else if (options.extraContext?.voiceUri || options.extraContext?.audioBase64) {
    // Audio was provided but transcription failed
    const voiceContextAddition = `

## Current Session Context - VOICE RECORDING ATTACHED
**IMPORTANT: The student attached a voice recording, but transcription was not available.**

Please politely ask the student to type out their math problem so you can help them.

Remember to use LaTeX notation for all mathematical expressions in your response.`;

    enhancedPrompt += voiceContextAddition;
  }

  return enhancedPrompt;
}

export default async function useCustomLlmRequestCreator(
  props: CustomLlmRequestCreatorProps,
): Promise<CustomLlmRequestCreator> {
  const extraContext = props.extraContext as OrchestrationContext | undefined;
  const hasVoiceInput = isVoiceRequest(extraContext);
  
  // If we have audio, transcribe it (tries Cactus gateway first, falls back to direct Gemini)
  let transcribedText: string | undefined;
  if (extraContext?.audioBase64 && extraContext?.audioMimeType) {
    transcribedText = await transcribeAudio(
      extraContext.audioBase64,
      extraContext.audioMimeType,
    );
    console.log('Audio transcribed:', transcribedText ? 'success' : 'failed');
  }

  let learnerMemorySummary: string | undefined;
  if (!hasVoiceInput) {
    learnerMemorySummary = await readLearnerMemorySummary(props);
  }
  
  const creator: LlmRequestCreator<ConversationContext> = async function createLuminaLlmRequest(
    modelProvider,
    context,
    assetProvider,
    tools,
  ): ReturnType<LlmRequestCreator<ConversationContext>> {
    const userCompletionMessage = await toCompletionMessageParam(context.requestMessage, assetProvider);
    const hasImageAttachment = hasImageContentPart(userCompletionMessage?.content);
    const enhancedSystemPrompt = buildEnhancedSystemPrompt(props.systemPrompt, {
      extraContext,
      transcribedText,
      hasImageAttachment,
      learnerMemorySummary,
    });
    
    const systemMessage: OpenAI.ChatCompletionMessageParam = {
      content: enhancedSystemPrompt,
      role: 'system',
    };

    return await createCompletionRequest(
      modelProvider,
      context.prevMessages,
      true,
      assetProvider,
      context.toolMessages,
      systemMessage,
      userCompletionMessage,
      tools,
      undefined,
      hybridRoutingPolicy.localTemperature,
      context.useStreaming,
    );
  };

  return { creator };
}
