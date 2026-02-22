import * as Crypto from 'expo-crypto';
import * as Network from 'expo-network';
import { SupabaseClient } from '@supabase/supabase-js';

import { t } from '@/i18n';
import { canBuildOfflineTutorSolutionFromText } from '@/utils/offlineMathTutor';
import { type SSE } from '@shared/api-client/api-schema-types';
import { ConversationLlmRoutes, type ConversationMessageChunk } from '@shared/api-schemas/conversation-llm-schema';
import {
  toTimestamptzStr,
  toUuidStr,
  type ConversationMessageAssetV1,
  type ConversationMessageV1,
  type Database,
  type Json,
  type uuidstr,
} from '@shared/generated-db-types';
import { runCactusLocalTutorAsync } from './cactus-local-llm-api';
import { edgeFunctionInvokeWithStream } from './edge-function-streaming-client';
import { EventStream } from './event-stream/streaming';

const ROUTE_SOURCE_LOCAL = 'local';
const ROUTE_SOURCE_CLOUD = 'cloud';
const IMAGE_URI_CONTEXT_KEY = 'imageUri';
const LOCAL_ROUTE_CONTEXT_KEY = 'routeSource';
const LOCAL_ROUTE_FALLBACK_REASON_CONTEXT_KEY = 'fallbackReason';
const LOCAL_ROUTE_LATENCY_IN_MS_CONTEXT_KEY = 'localTotalTimeInMs';
const LOCAL_ROUTE_SOLUTION_STEPS_CONTEXT_KEY = 'solutionSteps';
const LOCAL_FALLBACK_REASON_IMAGE_UNSUPPORTED_OFFLINE = 'image_unsupported_offline';
const LOCAL_FALLBACK_REASON_LOCAL_GENERATION_FAILED = 'local_generation_failed';

interface OrchestrationContext {
  imageUri?: string;
}

function readOrchestrationContext(extraContext: unknown): OrchestrationContext | undefined {
  if (extraContext == null || typeof extraContext !== 'object' || Array.isArray(extraContext)) {
    return undefined;
  }

  const contextRecord = extraContext as Record<string, unknown>;
  const imageUri = typeof contextRecord[IMAGE_URI_CONTEXT_KEY] === 'string'
    ? contextRecord[IMAGE_URI_CONTEXT_KEY].trim()
    : undefined;

  if (!imageUri) {
    return undefined;
  }

  return { imageUri };
}

async function readIsOfflineAsync(): Promise<boolean> {
  try {
    const networkState = await Network.getNetworkStateAsync();

    if (networkState.isConnected === false || networkState.isInternetReachable === false) {
      return true;
    }

    if (networkState.isConnected === true || networkState.isInternetReachable === true) {
      return false;
    }
  } catch (error) {
    console.error('readIsOfflineAsync error:', error);
  }

  return false;
}

function hasImageContext(
  extraContext?: OrchestrationContext,
  attachedAssets?: Partial<ConversationMessageAssetV1>[],
): boolean {
  if (extraContext?.imageUri != null) {
    return true;
  }

  return Array.isArray(attachedAssets) && attachedAssets.length > 0;
}

function createConversationMessage(
  conversationId: uuidstr,
  authorEntityId: uuidstr,
  contentText: string,
  prevMessageId?: uuidstr,
  context?: Json,
): ConversationMessageV1 {
  return {
    id: toUuidStr(Crypto.randomUUID()),
    createdAt: toTimestamptzStr(new Date().toISOString()),
    updatedAt: toTimestamptzStr(new Date().toISOString()),
    authorEntityId,
    contentText,
    conversationId,
    prevMessageId: prevMessageId ?? null,
    context: context ?? null,
  };
}

function createOfflineImagePromptMessage(
  conversationId: uuidstr,
  botEntityId: uuidstr,
  prevMessageId?: uuidstr,
): ConversationMessageV1 {
  return createConversationMessage(
    conversationId,
    botEntityId,
    t('assistant.offlineImageTypePrompt'),
    prevMessageId,
    {
      [LOCAL_ROUTE_CONTEXT_KEY]: ROUTE_SOURCE_LOCAL,
      [LOCAL_ROUTE_FALLBACK_REASON_CONTEXT_KEY]: LOCAL_FALLBACK_REASON_IMAGE_UNSUPPORTED_OFFLINE,
    },
  );
}

function createLocalTutorMessage(
  conversationId: uuidstr,
  botEntityId: uuidstr,
  localResultText: string,
  prevMessageId: uuidstr | undefined,
  localTotalTimeInMs?: number,
  solutionSteps?: unknown,
): ConversationMessageV1 {
  const contentText = `${t('assistant.offlineLocalPrefix')} ${localResultText}`;

  const context: Record<string, unknown> = {
    [LOCAL_ROUTE_CONTEXT_KEY]: ROUTE_SOURCE_LOCAL,
  };

  if (localTotalTimeInMs != null) {
    context[LOCAL_ROUTE_LATENCY_IN_MS_CONTEXT_KEY] = localTotalTimeInMs;
  }
  if (Array.isArray(solutionSteps) && solutionSteps.length > 0) {
    context[LOCAL_ROUTE_SOLUTION_STEPS_CONTEXT_KEY] = solutionSteps;
  }

  return createConversationMessage(conversationId, botEntityId, contentText, prevMessageId, context as Json);
}

function shouldHandleOfflineImageAsTextPrompt(
  contentText: string,
  extraContext: OrchestrationContext | undefined,
  attachedAssets: Partial<ConversationMessageAssetV1>[] | undefined,
): boolean {
  if (!hasImageContext(extraContext, attachedAssets)) {
    return false;
  }

  return !canBuildOfflineTutorSolutionFromText(contentText);
}

export async function postMessageToBot(
  supabaseClient: SupabaseClient<Database>,
  userId: uuidstr,
  conversationId: uuidstr,
  contentText: string,
  botEntityId: uuidstr,
  botPromptName: string,
  messageId?: uuidstr,
  prevMessageId?: uuidstr,
  attachedAssets?: Partial<ConversationMessageAssetV1>[],
  useOutputStream?: boolean,
  abortController?: AbortController,
  extraContext?: unknown,
): Promise<ConversationMessageV1[] | EventStream<SSE<ConversationMessageChunk>> | null> {
  const message: ConversationMessageV1 = {
    id: messageId ?? toUuidStr(Crypto.randomUUID()),
    createdAt: toTimestamptzStr(new Date().toISOString()),
    updatedAt: toTimestamptzStr(new Date().toISOString()),
    authorEntityId: userId,
    contentText: contentText,
    conversationId: conversationId,
    prevMessageId: prevMessageId ?? null,
    context: null,
  };

  const isOffline = await readIsOfflineAsync();
  if (isOffline) {
    const orchestrationContext = readOrchestrationContext(extraContext);

    if (shouldHandleOfflineImageAsTextPrompt(contentText, orchestrationContext, attachedAssets)) {
      console.info(`conversation-routing route=${ROUTE_SOURCE_LOCAL} fallbackReason=${LOCAL_FALLBACK_REASON_IMAGE_UNSUPPORTED_OFFLINE}`);
      return [createOfflineImagePromptMessage(conversationId, botEntityId, message.id)];
    }

    const localTutorResult = await runCactusLocalTutorAsync({
      userText: contentText,
    });

    if (localTutorResult != null) {
      console.info(`conversation-routing route=${ROUTE_SOURCE_LOCAL}`);
      return [
        createLocalTutorMessage(
          conversationId,
          botEntityId,
          localTutorResult.resultText,
          message.id,
          localTutorResult.totalTimeInMs,
          localTutorResult.solutionSteps,
        ),
      ];
    }

    console.info(
      `conversation-routing route=${ROUTE_SOURCE_LOCAL} fallbackReason=${LOCAL_FALLBACK_REASON_LOCAL_GENERATION_FAILED}`,
    );
    return null;
  }

  console.info(`conversation-routing route=${ROUTE_SOURCE_CLOUD}`);
  const res = await edgeFunctionInvokeWithStream(supabaseClient, ConversationLlmRoutes, 'postMessageToBot', {
    body: {
      message,
      botEntityId,
      botPromptName,
      attachedAssets,
      useOutputStream,
      extraContext,
    },
    abortController,
  });

  if (res.error) {
    throw res.error;
  }

  return res.data;
}
