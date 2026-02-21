import { OpenAI } from 'openai';

import {
  toTimestamptzStr,
  toUuidStr,
  type ConversationMessageAssetWithDetailsV1,
  type ConversationMessageV1,
  type ConversationMessageWithDetailsV1,
  type EntityType,
  type Json,
  type timestamptzstr,
  type uuidstr,
} from '../../_shared-client/generated-db-types.ts';
import { mapNotNull } from '../../_shared-client/utils/array-utils.ts';
import { LlmAssetProvider } from './LlmAssetProvider.ts';
import { LlmProvider } from './LlmProvider.ts';
import type { LlmToolContext } from './tools/llm-tools.ts';

export type LlmConversationMessage = {
  id: uuidstr; // now required
  createdAt: timestamptzstr; // now required
  authorEntityId: uuidstr; // now required
  entityType: EntityType; // new required field
  message: Partial<ConversationMessageV1>;
  assets?: ConversationMessageAssetWithDetailsV1[];
  summary?: string;
  tokenCount?: number;
  toolMessages?: Array<OpenAI.ChatCompletionAssistantMessageParam | OpenAI.ChatCompletionToolMessageParam>;
  // conversationState?: ConversationState;
};

interface ConversationMessageContext {
  toolMessages?: Array<OpenAI.ChatCompletionAssistantMessageParam | OpenAI.ChatCompletionToolMessageParam>;
}

export function getMostRecentAssistantMessage(
  prevMessages?: LlmConversationMessage[],
): LlmConversationMessage | undefined {
  if (prevMessages != null && prevMessages.length > 0) {
    for (let i = prevMessages.length - 1; i >= 0; i--) {
      const prevMessage = prevMessages[i];
      // the stack is supposed to be stored on the most recent message from the assistant (and not the user)
      if (prevMessage.entityType === 'SYSTEM' || prevMessage.entityType === 'BOT') {
        return prevMessage;
      }
    }
  }
  return undefined;
}

export function fromConversationMessages(
  conversationMessages: ConversationMessageWithDetailsV1[] | null,
): LlmConversationMessage[] {
  const prevMessages = conversationMessages ? mapNotNull(conversationMessages, (m) => fromConversationMessage(m)) : [];
  return prevMessages;
}

export function fromConversationMessage(
  conversationMessage: ConversationMessageWithDetailsV1 | null,
): LlmConversationMessage | undefined {
  if (
    !conversationMessage?.message?.id ||
    !conversationMessage?.message?.createdAt ||
    !conversationMessage?.message?.authorEntityId ||
    !conversationMessage?.entityType
  ) {
    return undefined;
  }

  // const conversationState = ConversationState.fromOuterJson(conversationMessage.context);
  const toolMessages = (conversationMessage.message.context as ConversationMessageContext)?.toolMessages;

  return {
    ...conversationMessage,
    id: conversationMessage.message.id,
    createdAt: conversationMessage.message.createdAt,
    authorEntityId: conversationMessage.message.authorEntityId,
    entityType: conversationMessage.entityType,
    message: conversationMessage.message ?? undefined,
    assets: conversationMessage.assets ?? undefined,
    toolMessages: toolMessages,
  };
}

export async function toCompletionMessageParamsWithTools(
  message: LlmConversationMessage,
  assetProvider?: LlmAssetProvider,
): Promise<OpenAI.ChatCompletionMessageParam[]> {
  const openAiMessage = await toCompletionMessageParam(message, assetProvider);
  const requestMessages: OpenAI.ChatCompletionMessageParam[] = [];
  if (openAiMessage) {
    // add all tool messages that belong to this message, they need to be added before it
    if (message.toolMessages != null) {
      requestMessages.push(...message.toolMessages);
    }
    requestMessages.push(openAiMessage);
  }
  return requestMessages;
}

export async function toCompletionMessageParam(
  message?: LlmConversationMessage,
  assetProvider?: LlmAssetProvider,
): Promise<OpenAI.ChatCompletionMessageParam | undefined> {
  if (message == null) {
    return undefined;
  }
  if (message.entityType === 'PERSON') {
    const content = await toContent(message, assetProvider);
    return content
      ? {
          role: 'user',
          content: content,
        }
      : undefined;
  } else {
    return {
      role: 'assistant',
      content: message.message.contentText,
    };
  }
}

export async function toContent(
  message?: LlmConversationMessage,
  assetProvider?: LlmAssetProvider,
): Promise<string | OpenAI.ChatCompletionContentPart[] | undefined> {
  if (message?.assets?.length) {
    const res: OpenAI.ChatCompletionContentPart[] = [];
    if (message.message.contentText != null) {
      res.push({ type: 'text', text: message.message.contentText });
    }
    const assets = await assetProvider?.makeContentPartsForAsset(message.assets);
    if (assets) {
      res.push(...assets);
    }
    return res;
  } else if (message?.message.contentText != null) {
    return message.message.contentText;
  }
  return undefined;
}

export function toConversationMessages(
  botReplyMessages: LlmConversationMessage[],
  conversationId: uuidstr,
  prevMessageId?: uuidstr,
): ConversationMessageV1[] {
  const conversationMessagesToSave: ConversationMessageV1[] = [];

  for (const reply of botReplyMessages) {
    // TODO: create multiple chat messages or rather combine them all into one?
    const fromBotMessage: ConversationMessageV1 | undefined = toConversationMessage(
      reply,
      conversationId,
      prevMessageId,
    );

    if (fromBotMessage) {
      conversationMessagesToSave.push(fromBotMessage);
    }
  }
  return conversationMessagesToSave;
}

export function toConversationMessage(
  message: LlmConversationMessage,
  conversationId: uuidstr,
  prevMessageId?: uuidstr,
): ConversationMessageV1 | undefined {
  const createdAt = message.createdAt ?? toTimestamptzStr(new Date().toISOString());
  return {
    id: message.id ?? toUuidStr(crypto.randomUUID()),
    createdAt: createdAt,
    updatedAt: createdAt,
    conversationId: message.message.conversationId ?? conversationId,
    authorEntityId: message.authorEntityId,
    //entityType: message.entityType,
    contentText: message.message.contentText ?? null,
    //summary: message.summary,
    prevMessageId: prevMessageId ?? null,
    context: makeConversationMessageContext(message) ?? null,
  };
}

function makeConversationMessageContext(message: LlmConversationMessage): Json | undefined {
  //const conversationStateJson = message.conversationState?.toOuterJson();
  // return conversationStateJson || message.toolMessages != null
  const res =
    message.toolMessages != null
      ? {
          ...(message.toolMessages && { toolMessages: message.toolMessages }),
          //...conversationStateJson,
        }
      : undefined;

  // a little hacky...
  const resJson: Json = res as unknown as Json;
  return resJson;
}

export function makeUserMessage(
  id: uuidstr | undefined,
  createdAt: timestamptzstr,
  authorEntityId: uuidstr,
  contentText: string,
): LlmConversationMessage {
  return {
    id: id ?? toUuidStr(crypto.randomUUID()),
    createdAt: createdAt,
    authorEntityId: authorEntityId,
    message: {
      updatedAt: createdAt,
      contentText: contentText,
    },
    entityType: 'PERSON',
  };
}

export function makeAssistantMessage(
  id: uuidstr | undefined,
  createdAt: timestamptzstr,
  botEntityId: uuidstr,
  contentText?: string,
  summary?: string,
  toolMessages?: Array<OpenAI.ChatCompletionAssistantMessageParam | OpenAI.ChatCompletionToolMessageParam>,
): LlmConversationMessage {
  return {
    id: id ?? toUuidStr(crypto.randomUUID()),
    createdAt: createdAt,
    authorEntityId: botEntityId,
    entityType: 'BOT',
    message: {
      contentText: contentText,
    },
    summary: summary,
    toolMessages: toolMessages,
  };
}

export async function updateTokenCount(
  message: LlmConversationMessage,
  llmProvider: LlmProvider,
  assetProvider?: LlmAssetProvider,
): Promise<number> {
  const openAiMessage = await toCompletionMessageParam(message, assetProvider);
  if (!openAiMessage) {
    return 0;
  }
  // also include tokenCount for attached context messages
  const count =
    llmProvider.countMessageTokens(openAiMessage) +
    (message.toolMessages ? llmProvider.countMessagesTokens(message.toolMessages) : 0);
  message.tokenCount = count;
  return count;
}

export function updateTokenCountForSummaryOnly(
  message: LlmConversationMessage,
  llmProvider: LlmProvider,
  extraContent: string,
): number {
  const count = llmProvider.countTextTokens(message.summary + extraContent);

  message.tokenCount = count;
  return count;
}

export interface ConversationContext extends LlmToolContext {
  requestMessage?: LlmConversationMessage;
  prevMessages: LlmConversationMessage[];
  replyMessages: LlmConversationMessage[];
  requestOrCurrentTs: Date;
  nextAssistantMessageId: uuidstr;
}

export function makeConversationContext(
  useStreaming: boolean,
  currentTs: Date,
  requestMessage: LlmConversationMessage | undefined,
  prevMessages: LlmConversationMessage[],
  optional?: Partial<ConversationContext>,
): ConversationContext {
  let requestOrCurrentTs = optional?.requestOrCurrentTs;
  if (!requestOrCurrentTs) {
    if (requestMessage?.createdAt) {
      // TODO: test this conversion
      requestOrCurrentTs = new Date(requestMessage?.createdAt);
    } else {
      requestOrCurrentTs = currentTs;
    }
  }
  return {
    ...optional,
    useStreaming,
    requestMessage: requestMessage,
    prevMessages: prevMessages,
    replyMessages: optional?.replyMessages ?? [],
    requestOrCurrentTs: requestOrCurrentTs,
    nextAssistantMessageId: toUuidStr(crypto.randomUUID()),
  };
}

export function addAssistantMessage(
  context: ConversationContext,
  botEntityId: uuidstr,
  message?: string,
  summary?: string,
  requestDurationMs?: number,
): LlmConversationMessage {
  const id = context.nextAssistantMessageId;
  context.nextAssistantMessageId = toUuidStr(crypto.randomUUID());

  const endTs = requestDurationMs
    ? new Date(context.requestOrCurrentTs.getTime() + requestDurationMs)
    : context.requestOrCurrentTs;
  const endAt = toTimestamptzStr(endTs.toISOString());

  const res = makeAssistantMessage(id, endAt, botEntityId, message, summary, context.toolMessages);

  context.replyMessages.push(res);
  // reset tool messages so next assistant message doesn't store it
  context.toolMessages = undefined;

  return res;
}
