import { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

import type { ConversationMessageChunk } from '../../_shared-client/api-schemas/conversation-llm-schema.ts';
import type { SseStream } from '../../_shared-client/api-client/api-schema-types.ts';
import {
  findEntityTypeForParticipant,
  readConversationMessageAssets,
  readConversationWithContent,
  upsertConversationMessagesWithAssets,
  validateConversationMessageAssetsWithDefaults,
  validateConversationMessageWithDefaults,
} from '../../_shared-client/conversation-db.ts';
import {
  type ConversationMessageAssetV1,
  type ConversationMessageV1,
  type ConversationMessageWithDetailsV1,
  type Database,
  toTimestamptzStr,
  type uuidstr,
} from '../../_shared-client/generated-db-types.ts';
import { lastElement } from '../../_shared-client/utils/array-utils.ts';
import { type ApiProgressHandler } from '../ApiProgressHandler.ts';
import { sendResultOrEventStream, type SSEStreamController } from '../server/event-stream-server.ts';
import type {
  CustomLlmModelProvider,
  CustomLlmModelProviderProps,
  CustomLlmRequestCreator,
  CustomLlmRequestCreatorProps,
  CustomLlmSystemPrompt,
  CustomLlmSystemPromptProps,
  CustomLlmTools,
  CustomLlmToolsProps,
} from './custom-llm-conversation.ts';
import { makeDefaultModelOrThrow } from './defaultModel.ts';
import {
  addAssistantMessage,
  type ConversationContext,
  fromConversationMessage,
  fromConversationMessages,
  makeConversationContext,
  toCompletionMessageParam,
  toConversationMessages,
} from './llm-conversation.ts';
import { LlmAssetProvider } from './LlmAssetProvider.ts';
import { LlmProvider } from './LlmProvider.ts';
import { type LlmProviderSecrets, providerSecrets } from './LlmProviderSecrets.ts';
import { type LlmInputStreamProcessor } from './LlmStreamProcessor.ts';
import { createCompletionRequest } from './request-utils.ts';
import { SupabaseAssetProvider } from './SupabaseAssetProvider.ts';
import { LlmTool, type LlmToolContext } from './tools/llm-tools.ts';
import { BoolQuestionTool } from './tools/question-tools.ts';
import {
  invokeLlmWithTools,
  type LlmRequestCreator,
  type LlmResultCreator,
  makeDefaultToolHandler,
} from './tools/tool-invocation.ts';

const DEFAULT_SIGNED_URL_EXPIRATION_SECS = 90;

/**
 * Interface for adapting conversation LLM functionality to different runtimes
 */
export interface ConversationLlmAdapter {
  useCustomLlmTools: (props: CustomLlmToolsProps) => Promise<CustomLlmTools>;
  useCustomLlmSystemPrompt: (props: CustomLlmSystemPromptProps) => Promise<CustomLlmSystemPrompt>;
  useCustomLlmModelProvider: (props: CustomLlmModelProviderProps) => Promise<CustomLlmModelProvider>;
  useCustomLlmRequestCreator: (props: CustomLlmRequestCreatorProps) => Promise<CustomLlmRequestCreator>;
}

export async function postMessageToBot(
  supabaseClient: SupabaseClient<Database>,
  botEntityId: uuidstr | null,
  systemPrompt: string | undefined,
  adapter: ConversationLlmAdapter,
  {
    message,
    attachedAssets,
    botPromptName,
    useOutputStream,
    extraContext,
  }: {
    message?: ConversationMessageV1 | null;
    attachedAssets?: Partial<ConversationMessageAssetV1>[] | null;
    botPromptName?: string;
    useOutputStream?: boolean | null;
    extraContext?: any;
  },
): Promise<SseStream<ConversationMessageChunk> | ConversationMessageV1[]> {
  if (botEntityId == null) throw new Error('"botEntityId" missing. This should never happen.');

  const currentTs = new Date();
  const createdAt = toTimestamptzStr(currentTs.toISOString());
  if (!validateConversationMessageWithDefaults(message, createdAt)) {
    throw new Error('conversation message validation failed');
  }

  const conversationId = message.conversationId;
  const conversation = await readConversationWithContent(supabaseClient, message.conversationId);
  if (conversation == null) throw new Error('conversation missing');

  const entityType = findEntityTypeForParticipant(conversation.participants ?? undefined, message.authorEntityId);
  if (entityType == null) throw new Error(`entityType missing for ${JSON.stringify(message.authorEntityId)}`);

  message.prevMessageId ??= lastElement(conversation.messages)?.message?.id ?? null;

  if (!validateConversationMessageAssetsWithDefaults(attachedAssets, message.id, createdAt)) {
    throw new Error('conversation message asset validation failed');
  }

  const data = await upsertConversationMessagesWithAssets(supabaseClient, [message], attachedAssets ?? []);

  const messageAssets =
    attachedAssets?.length > 0 ? await readConversationMessageAssets(supabaseClient, message.id) : undefined;

  const prevLlmMessages = fromConversationMessages(conversation.messages);
  const messageWithEntity: ConversationMessageWithDetailsV1 = {
    message: {
      id: message.id,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      conversationId: message.conversationId,
      authorEntityId: message.authorEntityId,
      prevMessageId: message.prevMessageId ?? null,
      contentText: message.contentText,
      context: message.context ?? null,
    },
    entityType: entityType,
    assets: messageAssets ?? null,
  };

  const userLlmMessage = fromConversationMessage(messageWithEntity);
  const customLlmModelProvider = await adapter.useCustomLlmModelProvider({
    supabaseClient,
    conversationId,
    providerSecrets,
    botPromptName,
  });
  const llmProvider =
    customLlmModelProvider.provider ?? (await makeDefaultLlmModelProvider(providerSecrets, botPromptName));

  const abortController = new AbortController();
  const prevMessageId = message.id;
  const context = makeConversationContext(useOutputStream ?? false, currentTs, userLlmMessage, prevLlmMessages, {
    abortController: abortController,
  });

  const resMessages = await sendResultOrEventStream<ConversationMessageV1[], ConversationMessageChunk>(
    async (progress, eventStream) =>
      await continueConversationWithLlm(
        supabaseClient,
        llmProvider,
        context,
        botEntityId,
        conversationId,
        systemPrompt,
        adapter,
        prevMessageId,
        botPromptName,
        progress,
        eventStream,
        extraContext,
      ),
    useOutputStream ?? false,
    abortController,
  );

  return resMessages;
}

async function continueConversationWithLlm(
  supabaseClient: SupabaseClient<Database>,
  llmProvider: LlmProvider,
  context: ConversationContext,
  botEntityId: uuidstr,
  conversationId: uuidstr,
  systemPrompt: string | undefined,
  adapter: ConversationLlmAdapter,
  prevMessageId?: uuidstr,
  botPromptName?: string,
  progress?: ApiProgressHandler,
  eventStream?: SSEStreamController<ConversationMessageChunk>,
  extraContext?: any,
): Promise<ConversationMessageV1[]> {
  const assetProvider = new SupabaseAssetProvider(supabaseClient);
  // load all images and other assets
  await assetProvider.addAssetsForConversation(llmProvider, context, DEFAULT_SIGNED_URL_EXPIRATION_SECS);

  const customLlmTools = await adapter.useCustomLlmTools({
    supabaseClient,
    conversationId,
    botPromptName,
  });
  const llmTools = customLlmTools.tools ?? makeDefaultLlmTools(botPromptName);

  const customLlmSystemPrompt = await adapter.useCustomLlmSystemPrompt({
    supabaseClient,
    conversationId,
    botPromptName,
  });
  const llmSystemPrompt = customLlmSystemPrompt.prompt ?? makeDefaultLlmSystemPrompt(botPromptName, systemPrompt);

  const customLlmRequestCreator = await adapter.useCustomLlmRequestCreator({
    supabaseClient,
    conversationId,
    botEntityId,
    systemPrompt: llmSystemPrompt,
    prevMessageId,
    botPromptName,
    extraContext,
  });
  const llmRequestCreator = customLlmRequestCreator.creator ?? makeDefaultLlmRequestCreator(llmSystemPrompt);

  const resultCreator: LlmResultCreator<ConversationContext, void, boolean> = (
    generatedByLlm,
    receivedAsStream,
    context,
    content,
    toolResults,
    requestDurationMs,
  ) => {
    addAssistantMessage(context, botEntityId, content, undefined, requestDurationMs);
    return true;
  };

  const streamProcessor: LlmInputStreamProcessor<void> = async (llmStreamState, curState, newText, artificialChunk) => {
    if (newText != null) {
      const chunk: ConversationMessageChunk = {
        messageId: context.nextAssistantMessageId,
        content: newText,
        artificialChunk,
      };
      eventStream?.enqueueData(chunk);
    }
  };

  /*
   * Invoke the LLM with the tools and the context.
   * Invoker may decide to continue the conversation with the tools or the result, thus invoking the LLM again recursively.
   * To be able to stream the responses of all invocations, send the `done` SEE event after awaiting the invoke result.
   */
  const invokeRes = await invokeLlmWithTools(
    llmProvider,
    context,
    llmRequestCreator,
    resultCreator,
    assetProvider,
    streamProcessor,
    progress,
    llmTools,
    makeDefaultToolHandler(),
  );

  if (context.replyMessages.length > 0) {
    // store the conversation State in the reply message.
    //const lastResponse = context.replyMessages[context.replyMessages.length - 1];
    //conversationState.writeToMessageHistory(lastResponse);

    const chatMessagesToSave = toConversationMessages(context.replyMessages, conversationId, prevMessageId);

    /*
     * We support "chained" invocation to the llm to continue the conversation.
     * E.g. when the llm calls a tool, we can continue the conversation with the tool result and invoke the llm again.
     * In order to continue streaming the responses of the subsequent tool calls,
     * we only send the "done" event after the last response has been built.
     */
    // eventStream?.enqueue(makeEventStreamMessage(SSE_DATA_DONE));
    eventStream?.done();

    await upsertConversationMessagesWithAssets(supabaseClient, chatMessagesToSave);
    return chatMessagesToSave;
  } else {
    return [];
  }
}

export function makeDefaultLlmTools(botPromptName?: string): LlmTool<LlmToolContext, void, boolean>[] {
  const llmTools: LlmTool<LlmToolContext, void, boolean>[] = [];

  if (botPromptName === 'tooltest') {
    const boolTool = new BoolQuestionTool<LlmToolContext, void, boolean>(
      'is this a subscription service?',
      'subscription',
      async (boolValue) => {
        console.log(`Tool result: ${boolValue}`);
        return {
          tool: 'ok',
        };
      },
    );
    llmTools.push(boolTool);
  }

  return llmTools;
}

export function makeDefaultLlmSystemPrompt(botPromptName?: string, systemPrompt?: string): string {
  if (botPromptName !== 'chat' && !systemPrompt) {
    console.warn(`No system prompt found for bot name: ${botPromptName}`);
  }
  return systemPrompt ?? 'You are a helpful, friendly assistant.';
}

export async function makeDefaultLlmModelProvider(
  providerSecrets: LlmProviderSecrets,
  botPromptName?: string,
): Promise<LlmProvider> {
  if (botPromptName === 'chat') {
    return await makeDefaultModelOrThrow(providerSecrets);
  }

  return await makeDefaultModelOrThrow(providerSecrets);
}

export function makeDefaultLlmRequestCreator(systemPrompt: string): LlmRequestCreator<ConversationContext> {
  const llmRequestCreatorDefault: LlmRequestCreator<ConversationContext> = async (
    modelProvider: LlmProvider,
    context: ConversationContext,
    assetProvider?: LlmAssetProvider,
    tools?: OpenAI.ChatCompletionTool[],
  ): Promise<OpenAI.ChatCompletionCreateParams | undefined> => {
    const userCompletionMessage = await toCompletionMessageParam(context.requestMessage, assetProvider);
    const systemMessage: OpenAI.ChatCompletionMessageParam = {
      content: systemPrompt,
      role: 'system',
    };

    return createCompletionRequest(
      modelProvider,
      context.prevMessages,
      true,
      assetProvider,
      context.toolMessages,
      systemMessage,
      userCompletionMessage,
      tools,
      undefined,
      0,
      context.useStreaming,
    );
  };

  return llmRequestCreatorDefault;
}
