import { SupabaseClient } from '@supabase/supabase-js';

import { type SSE } from '@shared/api-client/api-schema-types';
import { ConversationLlmRoutes, type ConversationMessageChunk } from '@shared/api-schemas/conversation-llm-schema';
import {
  toTimestamptzStr,
  toUuidStr,
  type ConversationMessageAssetV1,
  type ConversationMessageV1,
  type Database,
  type uuidstr,
} from '@shared/generated-db-types';
import { edgeFunctionInvokeWithStream } from './edge-function-streaming-client';
import { EventStream } from './event-stream/streaming';

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
    id: messageId ?? toUuidStr(crypto.randomUUID()),
    createdAt: toTimestamptzStr(new Date().toISOString()),
    updatedAt: toTimestamptzStr(new Date().toISOString()),
    authorEntityId: userId,
    contentText: contentText,
    conversationId: conversationId,
    prevMessageId: prevMessageId ?? null,
    context: null,
  };

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
