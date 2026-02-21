import { useSession } from '@supabase/auth-helpers-react';
import * as Crypto from 'expo-crypto';
import { useCallback, useRef, useState } from 'react';

import { postMessageToBot } from '@/api/conversation-llm-api';
import { supabaseClient } from '@/api/supabase-client';
import { handleCreateConversationWithOtherParticipants, readConversationWithContent } from '@shared/conversation-db';
import { toUuidStr, type ConversationMessageWithDetailsV1, type Json, type uuidstr } from '@shared/generated-db-types';
import { ENTITY_SYSTEM } from '@shared/profile-db';
import { checkAndCreateUserEntity } from '@shared/user-db';
import { type BaseChatMessageItem } from './message-renderer/ChatMessageRenderer';

const DEFAULT_BOT_PROMPT_NAME = 'chat';
const INITIALIZE_MODE_CREATE = 'create';
const MISSING_CHAT_CONTEXT_LOG = 'No conversation ID or user session';
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface ConversationOrchestrationContext {
  conversationId?: string;
  problemId?: string;
  imageUri?: string;
}

export interface ConversationChatMessageItem extends BaseChatMessageItem {
  context?: Json;
}

export interface InitializeConversationOptions {
  conversationId?: string;
  showHistoricalMessages?: boolean;
  extraContext?: ConversationOrchestrationContext;
}

interface InitializeInFlightState {
  key: string;
  promise: Promise<void>;
}

export interface ConversationLlmFunc {
  isSending: boolean;
  handlePostMessageToChatbot: (
    messageId: uuidstr,
    messageContentText: string,
    extraContext?: ConversationOrchestrationContext,
  ) => Promise<ConversationChatMessageItem[] | undefined>;
  initializeChat: (initialBotChatMessageItem?: BaseChatMessageItem, options?: InitializeConversationOptions) => Promise<void>;
}

export interface ConversationLlmProps {
  setMessages: (messages?: ConversationChatMessageItem[]) => void;
}

function sanitizeContextText(value?: string): string | undefined {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : undefined;
}

function mergeOrchestrationContext(
  ...contexts: Array<ConversationOrchestrationContext | undefined>
): ConversationOrchestrationContext | undefined {
  const mergedContext: ConversationOrchestrationContext = {};

  for (const context of contexts) {
    if (context == null) {
      continue;
    }

    if (context.conversationId != null) {
      mergedContext.conversationId = context.conversationId;
    }

    const problemId = sanitizeContextText(context.problemId);
    if (problemId != null) {
      mergedContext.problemId = problemId;
    }

    const imageUri = sanitizeContextText(context.imageUri);
    if (imageUri != null) {
      mergedContext.imageUri = imageUri;
    }
  }

  return Object.keys(mergedContext).length > 0 ? mergedContext : undefined;
}

function createFallbackMessageId(): uuidstr {
  return toUuidStr(Crypto.randomUUID());
}

function toOptionalUuid(value?: string): uuidstr | undefined {
  if (value == null || !UUID_V4_PATTERN.test(value)) {
    return undefined;
  }
  return toUuidStr(value);
}

function buildInitializeKey(userId: uuidstr, requestedConversationId?: string): string {
  const requestedConversationKey = sanitizeContextText(requestedConversationId);
  return `${userId}:${requestedConversationKey ?? INITIALIZE_MODE_CREATE}`;
}

export function useConversationLlm(props: ConversationLlmProps): ConversationLlmFunc {
  const [isSending, setIsSending] = useState<boolean>(false);

  const conversationIdRef = useRef<uuidstr | undefined>(undefined);
  const orchestrationContextRef = useRef<ConversationOrchestrationContext | undefined>(undefined);
  const initializedChatKeyRef = useRef<string | undefined>(undefined);
  const initializeInFlightRef = useRef<InitializeInFlightState | undefined>(undefined);

  const session = useSession();
  const { setMessages } = props;

  const handleHistoricalAndInitialMessages = useCallback(
    async (
      historicalMessages?: ConversationMessageWithDetailsV1[],
      initialBotChatMessageItem?: BaseChatMessageItem,
    ): Promise<void> => {
      if (historicalMessages && historicalMessages.length > 0) {
        const historicalChatMessageItems: ConversationChatMessageItem[] = historicalMessages.map((message) => ({
          id: message.message?.id ?? createFallbackMessageId(),
          contentText: message.message?.contentText ?? '',
          isCurrentUser: message.message?.authorEntityId === session?.user.id,
          createdAt: message.message?.createdAt ?? undefined,
          context: message.message?.context ?? undefined,
        }));

        setMessages(historicalChatMessageItems);
      } else if (initialBotChatMessageItem) {
        // do not save to DB, otherwise it gives an error "400 A conversation must start with a user message. Try again with a conversation that starts with a user message."
        setMessages([initialBotChatMessageItem]);
      }
    },
    [session?.user.id, setMessages],
  );

  const initializeChat = useCallback(
    async (initialBotChatMessageItem?: BaseChatMessageItem, options?: InitializeConversationOptions): Promise<void> => {
      if (!session?.user.id) {
        return;
      }

      const userId = toUuidStr(session.user.id);
      const requestedConversationId = sanitizeContextText(options?.conversationId);
      const requestedConversationUuid = toOptionalUuid(requestedConversationId);
      const initializeKey = buildInitializeKey(userId, requestedConversationId);

      if (initializedChatKeyRef.current === initializeKey) {
        return;
      }
      if (initializeInFlightRef.current?.key === initializeKey) {
        return initializeInFlightRef.current.promise;
      }

      const initializePromise = (async (): Promise<void> => {
        try {
          const isUserEntityCreated = await checkAndCreateUserEntity(supabaseClient, userId);
          if (!isUserEntityCreated) {
            console.error('Failed to ensure user entity exists');
            return;
          }

          let activeConversationId =
            requestedConversationUuid ?? (await handleCreateConversationWithOtherParticipants(supabaseClient, [ENTITY_SYSTEM]));

          conversationIdRef.current = activeConversationId;
          orchestrationContextRef.current = mergeOrchestrationContext(options?.extraContext, {
            conversationId: activeConversationId,
          });

          const shouldShowHistoricalMessages = options?.showHistoricalMessages ?? true;

          if (shouldShowHistoricalMessages) {
            let conversation = await readConversationWithContent(supabaseClient, activeConversationId);
            if (requestedConversationUuid != null && conversation == null) {
              activeConversationId = await handleCreateConversationWithOtherParticipants(supabaseClient, [ENTITY_SYSTEM]);
              conversationIdRef.current = activeConversationId;
              orchestrationContextRef.current = mergeOrchestrationContext(options?.extraContext, {
                conversationId: activeConversationId,
              });
              conversation = await readConversationWithContent(supabaseClient, activeConversationId);
            }
            await handleHistoricalAndInitialMessages(conversation?.messages ?? undefined, initialBotChatMessageItem);
          } else if (initialBotChatMessageItem) {
            setMessages([initialBotChatMessageItem]);
          }

          initializedChatKeyRef.current = initializeKey;
        } catch (error) {
          console.error('Error initializing chat:', error);
          conversationIdRef.current = undefined;
          if (initialBotChatMessageItem) {
            setMessages([initialBotChatMessageItem]);
          }
          throw error;
        } finally {
          if (initializeInFlightRef.current?.key === initializeKey) {
            initializeInFlightRef.current = undefined;
          }
        }
      })();

      initializeInFlightRef.current = {
        key: initializeKey,
        promise: initializePromise,
      };

      return initializePromise;
    },
    [handleHistoricalAndInitialMessages, session?.user.id, setMessages],
  );

  async function handlePostMessageToChatbot(
    messageId: uuidstr,
    messageContentText: string,
    extraContext?: ConversationOrchestrationContext,
  ): Promise<ConversationChatMessageItem[] | undefined> {
    const activeConversationId = conversationIdRef.current;
    const userId = session?.user?.id;

    if (activeConversationId == null || userId == null) {
      console.error(MISSING_CHAT_CONTEXT_LOG);
      return undefined;
    }

    orchestrationContextRef.current = mergeOrchestrationContext(
      orchestrationContextRef.current,
      extraContext,
      { conversationId: activeConversationId },
    );

    setIsSending(true);

    let botMessages: ConversationChatMessageItem[] | undefined;
    try {
      const response = await postMessageToBot(
        supabaseClient,
        toUuidStr(userId),
        activeConversationId,
        messageContentText,
        ENTITY_SYSTEM,
        DEFAULT_BOT_PROMPT_NAME,
        messageId,
        undefined,
        undefined,
        false,
        undefined,
        orchestrationContextRef.current,
      );

      if (Array.isArray(response)) {
        botMessages = response.map((botMessage) => ({
          id: botMessage.id ?? createFallbackMessageId(),
          contentText: botMessage.contentText ?? '',
          isCurrentUser: false,
          createdAt: botMessage.createdAt ?? undefined,
          context: botMessage.context ?? undefined,
        }));
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }

    return botMessages;
  }

  return {
    isSending,
    handlePostMessageToChatbot,
    initializeChat,
  };
}
