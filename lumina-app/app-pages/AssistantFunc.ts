/**
 * Business logic for the Assistant route - AI Math Tutor Chat Interface
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Platform, FlatList, TextInput, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Crypto from 'expo-crypto';
import * as Network from 'expo-network';

import { t } from '@/i18n';
import { toTimestamptzStr, toUuidStr, type Json } from '@shared/generated-db-types';
import { type BaseChatMessageItem } from '@/comp-lib/chat/message-renderer/ChatMessageRenderer';
import { AssistantProps } from '@/app/assistant';
import {
  useConversationLlm,
  type ConversationChatMessageItem,
  type ConversationOrchestrationContext,
} from '@/comp-lib/chat/ConversationLlmFunc';
import { useAssistantStyles } from './AssistantStyles';
import { DEFAULT_SINGLELINE_INPUT_HEIGHT } from '@/comp-lib/core/custom-text-input/CustomTextInputStyles';
import { type CapturedMedia, type MediaCaptureMode } from '@/comp-app/media-capture/MediaCaptureFunc';
import { type MediaItemWithUrl } from '@/comp-app/media-library/MediaLibraryFunc';
import { type RecordedVoice } from '@/comp-app/inline-voice-recorder/InlineVoiceRecorder';
import { supabaseClient } from '@/api/supabase-client';
import { createUserMedia, uploadUserMediaFile, recordUserMediaUsage, getSignedMediaUrl } from '@shared/lumina-db';
import { transcribeAudio } from '@/api/transcription-api';
import { isCactusLocalRuntimeAvailableAsync, prepareCactusLocalModelAsync } from '@/api/cactus-local-llm-api';
import { buildOfflineTutorSolutionFromText, type OfflineTutorSolution, type OfflineTutorStep } from '@/utils/offlineMathTutor';
import {
  createOfflineQueueRetryMessage,
  enqueueOfflineQueueMessageAsync,
  hasReachedOfflineQueueRetryLimit,
  readOfflineQueueAsync,
  removeOfflineQueueMessageAsync,
  shouldReplayOfflineQueueMessage,
  updateOfflineQueueMessageAsync,
  type OfflineQueueMessage,
} from '@/utils/OfflineMessageQueue';

const WELCOME_MESSAGE = "Hey! 👋 I'm your math buddy. Snap a problem, record yourself explaining it, or type it out - I'll help you solve it step by step!";
const ERROR_MESSAGE = t('chat.errorMessage');
const LOADING_DOTS = '...';
const IMAGE_CONTEXT_MESSAGE = "I've taken a photo of a math problem. Please look at the attached image and help me solve it step by step. If you can see the problem in the image, start by identifying what type of problem it is and then guide me through the solution.";

const IOS_PLATFORM = 'ios';
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NOTCH_TOP_INSET_THRESHOLD = 44;
const EXTRA_KEYBOARD_OFFSET_FOR_NOTCH = 40;
const KEYBOARD_DISMISS_DELAY_IN_MS = 100;
const MEDIA_CONTEXT_DELAY_IN_MS = 500;

const OFFLINE_SOLVER_PREFIX = "You're offline, so I'm using on-device math mode.";
const OFFLINE_SOLVER_UNAVAILABLE_MESSAGE =
  "You're offline and I can't reach the full tutor. I can still help with fractions, decimals, and basic algebra like x + 4 = 11.";
const OFFLINE_REPLAY_RETRY_LIMIT_MESSAGE =
  "I couldn't resend one of your queued messages after several retries. Please resend it when you're back online.";
const LOCAL_RUNTIME_UNAVAILABLE_MESSAGE = t('assistant.localRuntimeUnavailableNotice');

interface FrozenAssistantParams {
  conversationId?: string;
  problemId?: string;
  imageUri?: string;
  voiceUri?: string;
  mediaType?: MediaCaptureMode;
  resumeConversationId?: string;
  orchestrationContext?: ConversationOrchestrationContext;
}

/** Quick action chip types */
export type QuickActionType = 'explain_again' | 'show_another_way' | 'practice_similar';

/** Quick action chip option */
export interface QuickActionOption {
  id: QuickActionType;
  label: string;
}

/** Available quick action chips */
export const QUICK_ACTION_OPTIONS: QuickActionOption[] = [
  { id: 'explain_again', label: 'Explain again' },
  { id: 'show_another_way', label: 'Show another way' },
  { id: 'practice_similar', label: 'Practice similar' },
];

/** Solution step for step-by-step explanations */
export type SolutionStep = OfflineTutorStep;

/** Context structure stored in conversation message context JSONB field */
export interface MessageContext {
  solutionSteps?: SolutionStep[];
  isCelebration?: boolean;
  celebrationText?: string;
}

export interface ChatMessageItem extends BaseChatMessageItem {
  solutionSteps?: SolutionStep[];
  isCelebration?: boolean;
  celebrationText?: string;
}

/** Parse message context from JSONB field */
function parseMessageContext(context: Json | null | undefined): MessageContext {
  if (context == null || typeof context !== 'object' || Array.isArray(context)) {
    return {};
  }

  const contextRecord = context as Record<string, unknown>;
  return {
    solutionSteps: Array.isArray(contextRecord.solutionSteps)
      ? (contextRecord.solutionSteps as SolutionStep[])
      : undefined,
    isCelebration: typeof contextRecord.isCelebration === 'boolean' ? contextRecord.isCelebration : undefined,
    celebrationText: typeof contextRecord.celebrationText === 'string' ? contextRecord.celebrationText : undefined,
  };
}

function readParamAsString(paramValue: unknown): string | undefined {
  if (typeof paramValue === 'string') {
    return paramValue;
  }
  if (Array.isArray(paramValue) && typeof paramValue[0] === 'string') {
    return paramValue[0];
  }
  return undefined;
}

function sanitizeParamValue(paramValue: unknown): string | undefined {
  const value = readParamAsString(paramValue)?.trim();
  return value ? value : undefined;
}

function toOptionalConversationId(paramValue?: string): string | undefined {
  if (paramValue == null || !UUID_V4_PATTERN.test(paramValue)) {
    return undefined;
  }
  return paramValue;
}

function buildOrchestrationContext(
  conversationId?: string,
  problemId?: string,
  imageUri?: string,
  voiceUri?: string,
): ConversationOrchestrationContext | undefined {
  const context: ConversationOrchestrationContext = {};

  if (conversationId != null) {
    context.conversationId = conversationId;
  }
  if (problemId != null) {
    context.problemId = problemId;
  }
  if (imageUri != null) {
    context.imageUri = imageUri;
  }
  if (voiceUri != null) {
    context.voiceUri = voiceUri;
  }

  return Object.keys(context).length > 0 ? context : undefined;
}

function readFrozenAssistantParams(urlParams: AssistantProps['urlParams']): FrozenAssistantParams {
  const params = (urlParams ?? {}) as Record<string, unknown>;
  const conversationIdText = sanitizeParamValue(params.conversationId);
  const problemId = sanitizeParamValue(params.problemId);
  const imageUri = sanitizeParamValue(params.imageUri);
  const voiceUri = sanitizeParamValue(params.voiceUri);
  const mediaTypeParam = sanitizeParamValue(params.mediaType);
  const mediaType: MediaCaptureMode | undefined = mediaTypeParam === 'voice' ? 'voice' : mediaTypeParam === 'image' ? 'image' : undefined;

  const conversationId = toOptionalConversationId(conversationIdText);
  const problemConversationId = toOptionalConversationId(problemId);
  const resumeConversationId = conversationId ?? problemConversationId;
  const orchestrationContext = buildOrchestrationContext(resumeConversationId, problemId, imageUri, voiceUri);

  return {
    conversationId,
    problemId,
    imageUri,
    voiceUri,
    mediaType,
    resumeConversationId,
    orchestrationContext,
  };
}

function mapConversationMessageToAssistantMessage(message: ConversationChatMessageItem): ChatMessageItem {
  const parsedContext = parseMessageContext(message.context);
  return {
    id: message.id,
    contentText: message.contentText,
    isCurrentUser: message.isCurrentUser,
    createdAt: message.createdAt,
    solutionSteps: parsedContext.solutionSteps,
    isCelebration: parsedContext.isCelebration,
    celebrationText: parsedContext.celebrationText,
  };
}

function buildOfflineTutorSolution(userText: string): OfflineTutorSolution | undefined {
  return buildOfflineTutorSolutionFromText(userText);
}

function createAssistantBotMessage(contentText: string, solutionSteps?: SolutionStep[]): ChatMessageItem {
  return {
    id: toUuidStr(Crypto.randomUUID()),
    contentText,
    isCurrentUser: false,
    createdAt: toTimestamptzStr(new Date().toISOString()),
    solutionSteps,
  };
}

async function readIsOnlineAsync(): Promise<boolean | undefined> {
  try {
    const networkState = await Network.getNetworkStateAsync();
    if (networkState.isConnected === false || networkState.isInternetReachable === false) {
      return false;
    }

    if (networkState.isConnected === true || networkState.isInternetReachable === true) {
      return true;
    }
  } catch (error) {
    console.error('readIsOnlineAsync error:', error);
  }

  return undefined;
}

function buildOfflineTutorMessage(userText: string): ChatMessageItem | undefined {
  const offlineSolution = buildOfflineTutorSolution(userText);
  if (offlineSolution == null) {
    return undefined;
  }

  const contentText = `${OFFLINE_SOLVER_PREFIX} Answer: ${offlineSolution.resultText}`;
  return createAssistantBotMessage(contentText, offlineSolution.solutionSteps);
}

function readQueueConversationId(
  orchestrationContext?: ConversationOrchestrationContext,
  resumeConversationId?: string,
): string | undefined {
  const contextConversationId = orchestrationContext?.conversationId?.trim();
  if (contextConversationId) {
    return contextConversationId;
  }

  const resumeConversationIdText = resumeConversationId?.trim();
  if (resumeConversationIdText) {
    return resumeConversationIdText;
  }

  return undefined;
}

function isImageOnlyContextRequest(
  messageText: string,
  orchestrationContext?: ConversationOrchestrationContext,
): boolean {
  if (orchestrationContext?.imageUri == null) {
    return false;
  }

  return messageText.trim() === IMAGE_CONTEXT_MESSAGE;
}

function readNextReplayableQueueMessage(
  queuedMessages: OfflineQueueMessage[],
  conversationId: string,
  nowDate: Date,
): OfflineQueueMessage | undefined {
  for (const queuedMessage of queuedMessages) {
    if (queuedMessage.conversationId !== conversationId) {
      continue;
    }
    if (shouldReplayOfflineQueueMessage(queuedMessage, nowDate)) {
      return queuedMessage;
    }
  }

  return undefined;
}

/**
 * Interface for the return value of the useAssistant hook
 */
export interface AssistantFunc {
  messages: ChatMessageItem[];
  isSending: boolean;
  inputText: string;
  isSendDisabled: boolean;
  messagesListRef: React.RefObject<FlatList<ChatMessageItem> | null>;
  inputRef: React.RefObject<TextInput | null>;
  multiline: boolean;
  keyboardVerticalOffset: number;
  problemImageUri: string | undefined;
  problemVoiceUri: string | undefined;
  quickActionOptions: QuickActionOption[];
  isMediaCaptureVisible: boolean;
  isMediaLibraryVisible: boolean;
  isSubmittingMedia: boolean;
  mediaCaptureMode: MediaCaptureMode;
  isInlineRecording: boolean;
  onSend: () => void;
  setInputText: (text: string) => void;
  onQuickActionPress: (actionId: QuickActionType) => void;
  onGoBack: () => void;
  onNewChat: () => void;
  onOpenMediaCapture: (mode?: MediaCaptureMode) => void;
  onCloseMediaCapture: () => void;
  onSubmitMedia: (media: CapturedMedia) => void;
  onOpenMediaLibrary: () => void;
  onCloseMediaLibrary: () => void;
  onSelectLibraryMedia: (media: MediaItemWithUrl) => void;
  onStartInlineRecording: () => void;
  onInlineRecordingComplete: (recording: RecordedVoice) => void;
  onInlineRecordingError: (error: string) => void;
  onInlineRecordingCancel: () => void;
}

/**
 * Custom hook that provides business logic for the Assistant component
 */
export function useAssistant(props: AssistantProps): AssistantFunc {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isChatInitialized, setIsChatInitialized] = useState<boolean>(false);
  const [isMediaCaptureVisible, setIsMediaCaptureVisible] = useState<boolean>(false);
  const [isMediaLibraryVisible, setIsMediaLibraryVisible] = useState<boolean>(false);
  const [isSubmittingMedia, setIsSubmittingMedia] = useState<boolean>(false);
  const [mediaCaptureMode, setMediaCaptureMode] = useState<MediaCaptureMode>('image');
  const [currentMediaUri, setCurrentMediaUri] = useState<{ imageUri?: string; voiceUri?: string }>({});
  const [isInlineRecording, setIsInlineRecording] = useState<boolean>(false);

  const messagesListRef = useRef<FlatList<ChatMessageItem>>(null);
  const inputRef = useRef<TextInput>(null);
  const hasProcessedMediaRef = useRef<boolean>(false);
  const hasShownLocalRuntimeUnavailableNoticeRef = useRef<boolean>(false);
  const frozenParamsRef = useRef<FrozenAssistantParams | undefined>(undefined);
  const isQueueReplayInFlightRef = useRef<boolean>(false);

  const multiline = true;

  const insets = useSafeAreaInsets();
  const { customTextInputStyles } = useAssistantStyles(multiline);

  if (frozenParamsRef.current == null) {
    frozenParamsRef.current = readFrozenAssistantParams(props.urlParams);
  }

  const frozenParams = frozenParamsRef.current ?? {};
  const problemImageUri = currentMediaUri.imageUri ?? frozenParams.imageUri;
  const problemVoiceUri = currentMediaUri.voiceUri ?? frozenParams.voiceUri;
  const resumeConversationId = frozenParams.resumeConversationId;
  
  // Build orchestration context including current media
  const orchestrationContext = buildOrchestrationContext(
    resumeConversationId,
    frozenParams.problemId,
    problemImageUri,
    problemVoiceUri,
  );

  const inputHeightRaw =
    (customTextInputStyles?.container?.minHeight as number) ??
    (customTextInputStyles?.container?.height as number) ??
    DEFAULT_SINGLELINE_INPUT_HEIGHT;

  const needsExtraOffset = insets.top > NOTCH_TOP_INSET_THRESHOLD;
  const extraOffset = needsExtraOffset ? EXTRA_KEYBOARD_OFFSET_FOR_NOTCH : 0;
  const keyboardVerticalOffset = inputHeightRaw - insets.top + insets.bottom + extraOffset;

  const handleSetLlmMessages = useCallback((messageList?: ConversationChatMessageItem[]): void => {
    const chatMessages = messageList?.map(mapConversationMessageToAssistantMessage) ?? [];
    setMessages(chatMessages.reverse());
  }, []);

  const { isSending, handlePostMessageToChatbot, initializeChat, resetConversation } = useConversationLlm({
    setMessages: handleSetLlmMessages,
  });

  const replayOfflineQueueAsync = useCallback(async (): Promise<void> => {
    if (!isChatInitialized || isQueueReplayInFlightRef.current) {
      return;
    }

    const isOnline = await readIsOnlineAsync();
    if (isOnline !== true) {
      return;
    }

    const currentQueueConversationId = readQueueConversationId(orchestrationContext, resumeConversationId);
    if (currentQueueConversationId == null) {
      return;
    }

    isQueueReplayInFlightRef.current = true;
    try {
      while (true) {
        const queuedMessages = await readOfflineQueueAsync();
        const nowDate = new Date();
        const nextQueuedMessage = readNextReplayableQueueMessage(queuedMessages, currentQueueConversationId, nowDate);
        if (nextQueuedMessage == null) {
          return;
        }

        const replayResponse = await handlePostMessageToChatbot(
          toUuidStr(nextQueuedMessage.messageId),
          nextQueuedMessage.contentText,
          {
            conversationId: nextQueuedMessage.conversationId,
          },
        );

        if (replayResponse != null) {
          await removeOfflineQueueMessageAsync(nextQueuedMessage.messageId);

          const replayBotMessages = replayResponse.map(mapConversationMessageToAssistantMessage).reverse();
          if (replayBotMessages.length > 0) {
            setMessages((previousMessages) => [...replayBotMessages, ...previousMessages]);
          }
          continue;
        }

        const retryQueuedMessage = createOfflineQueueRetryMessage(nextQueuedMessage, nowDate);
        if (hasReachedOfflineQueueRetryLimit(retryQueuedMessage)) {
          await removeOfflineQueueMessageAsync(nextQueuedMessage.messageId);
          const retryLimitMessage = createAssistantBotMessage(OFFLINE_REPLAY_RETRY_LIMIT_MESSAGE);
          setMessages((previousMessages) => [retryLimitMessage, ...previousMessages]);
          continue;
        }

        await updateOfflineQueueMessageAsync(retryQueuedMessage);
        return;
      }
    } catch (error) {
      console.error('replayOfflineQueueAsync error:', error);
    } finally {
      isQueueReplayInFlightRef.current = false;
    }
  }, [handlePostMessageToChatbot, isChatInitialized, orchestrationContext, resumeConversationId]);

  useEffect(() => {
    const initialBotMessage: ChatMessageItem = {
      id: toUuidStr(Crypto.randomUUID()),
      contentText: WELCOME_MESSAGE,
      isCurrentUser: false,
      createdAt: toTimestamptzStr(new Date().toISOString()),
    };

    const initialBotBaseMessage: BaseChatMessageItem = {
      id: initialBotMessage.id,
      contentText: initialBotMessage.contentText,
      isCurrentUser: initialBotMessage.isCurrentUser,
      createdAt: initialBotMessage.createdAt,
    };

    initializeChat(initialBotBaseMessage, {
      conversationId: resumeConversationId,
      extraContext: orchestrationContext,
    })
      .then(() => {
        setIsChatInitialized(true);
      })
      .catch((error) => {
        console.log('Error initializeChat:', error);
      });
  }, [initializeChat, orchestrationContext, resumeConversationId]);

  useEffect(() => {
    prepareCactusLocalModelAsync().catch((error) => {
      console.error('prepareCactusLocalModelAsync error:', error);
    });
  }, []);

  useEffect(() => {
    if (!isChatInitialized || hasShownLocalRuntimeUnavailableNoticeRef.current) {
      return;
    }

    let isMounted = true;
    async function maybeShowLocalRuntimeNoticeAsync(): Promise<void> {
      const isLocalRuntimeAvailable = await isCactusLocalRuntimeAvailableAsync();
      if (!isMounted || isLocalRuntimeAvailable) {
        return;
      }

      hasShownLocalRuntimeUnavailableNoticeRef.current = true;
      const localRuntimeUnavailableMessage = createAssistantBotMessage(LOCAL_RUNTIME_UNAVAILABLE_MESSAGE);
      setMessages((previousMessages) => {
        const existingMessage = previousMessages.some(
          (messageItem) => messageItem.contentText === LOCAL_RUNTIME_UNAVAILABLE_MESSAGE,
        );
        if (existingMessage) {
          return previousMessages;
        }
        return [localRuntimeUnavailableMessage, ...previousMessages];
      });
    }

    maybeShowLocalRuntimeNoticeAsync().catch((error) => {
      console.error('maybeShowLocalRuntimeNoticeAsync error:', error);
    });

    return () => {
      isMounted = false;
    };
  }, [isChatInitialized]);

  useEffect(() => {
    if (!isChatInitialized) {
      return;
    }

    replayOfflineQueueAsync().catch((error) => {
      console.error('initial replayOfflineQueueAsync error:', error);
    });
  }, [isChatInitialized, replayOfflineQueueAsync]);

  useEffect(() => {
    const subscription = Network.addNetworkStateListener((state: Network.NetworkState) => {
      const isConnected = state.isConnected === true || state.isInternetReachable === true;
      if (!isConnected) {
        return;
      }

      replayOfflineQueueAsync().catch((error) => {
        console.error('network replayOfflineQueueAsync error:', error);
      });
    });

    return () => {
      subscription?.remove();
    };
  }, [replayOfflineQueueAsync]);

  const isSendDisabled = isSending || !inputText.trim();

  const handlePostMessageAsync = useCallback(
    async (message: string): Promise<void> => {
      const userMessage: ChatMessageItem = {
        id: toUuidStr(Crypto.randomUUID()),
        contentText: message,
        isCurrentUser: true,
        createdAt: toTimestamptzStr(new Date().toISOString()),
      };
      setMessages((previousMessages) => [userMessage, ...previousMessages]);

      const botLoadingMessage: ChatMessageItem = {
        id: toUuidStr(Crypto.randomUUID()),
        contentText: LOADING_DOTS,
        isCurrentUser: false,
      };
      setMessages((previousMessages) => [botLoadingMessage, ...previousMessages]);

      const chatBotResponse = await handlePostMessageToChatbot(userMessage.id, userMessage.contentText, orchestrationContext);

      if (!chatBotResponse) {
        const isOnline = await readIsOnlineAsync();
        const queueConversationId = readQueueConversationId(orchestrationContext, resumeConversationId);
        const imageOnlyContextRequest = isImageOnlyContextRequest(userMessage.contentText, orchestrationContext);
        if (isOnline !== true && queueConversationId != null && !imageOnlyContextRequest) {
          const queuedMessage: OfflineQueueMessage = {
            messageId: userMessage.id,
            conversationId: queueConversationId,
            contentText: userMessage.contentText,
            createdAt: userMessage.createdAt ?? new Date().toISOString(),
            retryCount: 0,
          };
          await enqueueOfflineQueueMessageAsync(queuedMessage);
        }

        if (isOnline !== true && imageOnlyContextRequest) {
          const offlineImagePromptMessage = createAssistantBotMessage(t('assistant.offlineImageTypePrompt'));
          setMessages((previousMessages) => [offlineImagePromptMessage, ...previousMessages.slice(1)]);
          return;
        }

        const offlineTutorMessage = buildOfflineTutorMessage(message);
        if (offlineTutorMessage) {
          setMessages((previousMessages) => [offlineTutorMessage, ...previousMessages.slice(1)]);
          return;
        }

        if (isOnline !== true) {
          const offlineUnavailableMessage = createAssistantBotMessage(OFFLINE_SOLVER_UNAVAILABLE_MESSAGE);
          setMessages((previousMessages) => [offlineUnavailableMessage, ...previousMessages.slice(1)]);
          return;
        }

        const errorBotMessage = createAssistantBotMessage(ERROR_MESSAGE);
        setMessages((previousMessages) => [errorBotMessage, ...previousMessages.slice(1)]);
        return;
      }

      const botMessages = chatBotResponse.map(mapConversationMessageToAssistantMessage).reverse();
      setMessages((previousMessages) => [...botMessages, ...previousMessages.slice(1)]);
      replayOfflineQueueAsync().catch((error) => {
        console.error('post-send replayOfflineQueueAsync error:', error);
      });
    },
    [handlePostMessageToChatbot, orchestrationContext, replayOfflineQueueAsync, resumeConversationId],
  );

  async function handleOnSend(): Promise<void> {
    if (!inputText.trim()) {
      return;
    }

    setInputText('');
    inputRef.current?.clear();

    if (Platform.OS !== IOS_PLATFORM) {
      inputRef.current?.blur();
    }

    setTimeout(() => {
      messagesListRef.current?.scrollToOffset({ offset: 0, animated: true });
      Keyboard.dismiss();
      inputRef.current?.clear();
    }, KEYBOARD_DISMISS_DELAY_IN_MS);

    await handlePostMessageAsync(inputText.trim());
  }

  function onSend(): void {
    handleOnSend().catch((error) => {
      console.error('Error sending message:', error);
    });
  }

  function onQuickActionPress(actionId: QuickActionType): void {
    handleQuickActionAsync(actionId).catch((error) => {
      console.error('Error handling quick action:', error);
    });
  }

  async function handleQuickActionAsync(actionId: QuickActionType): Promise<void> {
    let messageText = '';

    switch (actionId) {
      case 'explain_again':
        messageText = 'Can you explain that again in a simpler way?';
        break;
      case 'show_another_way':
        messageText = 'Can you show me another way to solve this?';
        break;
      case 'practice_similar':
        messageText = 'Give me a similar problem to practice!';
        break;
    }

    if (!messageText) {
      return;
    }

    setInputText(messageText);
    await handlePostMessageAsync(messageText);
    setInputText('');
  }

  // Process initial media from URL params
  useEffect(() => {
    const hasInitialImage = frozenParams.imageUri != null;
    const hasInitialVoice = frozenParams.voiceUri != null;
    
    if ((!hasInitialImage && !hasInitialVoice) || !isChatInitialized || hasProcessedMediaRef.current) {
      return;
    }

    hasProcessedMediaRef.current = true;
    
    async function processInitialMedia(): Promise<void> {
      let contextMessage: string;
      
      if (hasInitialVoice && frozenParams.voiceUri) {
        // Fetch and transcribe the voice recording
        try {
          console.log('Transcribing initial voice recording...');
          const response = await fetch(frozenParams.voiceUri);
          const blob = await response.blob();
          const transcriptionResult = await transcribeAudio(blob, 'voice.m4a');
          
          if (transcriptionResult.text) {
            // Send the transcribed text directly
            contextMessage = transcriptionResult.text;
            console.log('Initial voice transcription successful:', contextMessage);
          } else {
            contextMessage = "I tried to process a voice recording but couldn't transcribe it. Could you please type out the math problem?";
          }
        } catch (audioError) {
          console.error('Initial voice transcription failed:', audioError);
          contextMessage = "I tried to process a voice recording but couldn't transcribe it. Could you please type out the math problem?";
        }
      } else {
        contextMessage = IMAGE_CONTEXT_MESSAGE;
      }
      
      await handlePostMessageAsync(contextMessage);
    }
    
    const timeoutId = setTimeout(() => {
      processInitialMedia().catch((error) => {
        console.error('Error sending media context:', error);
      });
    }, MEDIA_CONTEXT_DELAY_IN_MS);

    return () => clearTimeout(timeoutId);
  }, [handlePostMessageAsync, isChatInitialized, frozenParams.imageUri, frozenParams.voiceUri]);

  function onGoBack(): void {
    props.onGoBack();
  }

  function onNewChat(): void {
    // Reset all state to start a fresh conversation
    setMessages([]);
    setInputText('');
    setIsChatInitialized(false);
    setCurrentMediaUri({});
    hasProcessedMediaRef.current = false;
    frozenParamsRef.current = undefined;
    
    // Reset the conversation in the LLM hook
    resetConversation();
    
    // Re-initialize with welcome message
    const initialBotMessage: ChatMessageItem = {
      id: toUuidStr(Crypto.randomUUID()),
      contentText: WELCOME_MESSAGE,
      isCurrentUser: false,
      createdAt: toTimestamptzStr(new Date().toISOString()),
    };

    const initialBotBaseMessage: BaseChatMessageItem = {
      id: initialBotMessage.id,
      contentText: initialBotMessage.contentText,
      isCurrentUser: initialBotMessage.isCurrentUser,
      createdAt: initialBotMessage.createdAt,
    };

    initializeChat(initialBotBaseMessage, {})
      .then(() => {
        setIsChatInitialized(true);
      })
      .catch((error) => {
        console.error('onNewChat initialization error:', error);
      });
  }

  function onOpenMediaCapture(mode: MediaCaptureMode = 'image'): void {
    setMediaCaptureMode(mode);
    setIsMediaCaptureVisible(true);
  }

  function onCloseMediaCapture(): void {
    setIsMediaCaptureVisible(false);
  }

  async function handleSubmitMediaAsync(media: CapturedMedia): Promise<void> {
    try {
      setIsSubmittingMedia(true);

      // Get user ID for storage path
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user == null) {
        throw new Error('User not authenticated');
      }

      // Create a file from the URI
      const response = await fetch(media.uri);
      const blob = await response.blob();
      const fileName = media.fileName ?? `${Date.now()}.${media.type === 'image' ? 'jpg' : 'm4a'}`;

      // For voice recordings, transcribe the audio first using Gemini
      let transcribedText: string | undefined;
      if (media.type === 'voice') {
        try {
          console.log('Transcribing voice recording...');
          const transcriptionResult = await transcribeAudio(blob, fileName);
          transcribedText = transcriptionResult.text;
          console.log('Voice transcription successful:', transcribedText);
        } catch (transcriptionError) {
          console.error('Voice transcription failed:', transcriptionError);
          // Continue without transcription - will send a generic message
        }
      }

      // Try to upload to storage (may fail if bucket doesn't exist)
      let publicUrl: string | undefined;
      try {
        const uploadResult = await uploadUserMediaFile(
          supabaseClient,
          user.id,
          blob,
          fileName,
          media.type === 'image' ? 'IMAGE' : 'VOICE_RECORDING',
        );
        publicUrl = uploadResult.publicUrl;

        // Save to database only if upload succeeded
        await createUserMedia(
          supabaseClient,
          media.type === 'image' ? 'IMAGE' : 'VOICE_RECORDING',
          uploadResult.storagePath,
          fileName,
          media.mimeType ?? (media.type === 'image' ? 'image/jpeg' : 'audio/m4a'),
          {
            durationInMs: media.durationInMs,
          },
        );
      } catch (storageError) {
        console.warn('Storage upload failed (bucket may not exist):', storageError);
        // Continue without storage - we can still send the transcribed text
      }

      // Update current media URI if we have one
      if (publicUrl) {
        if (media.type === 'image') {
          setCurrentMediaUri({ imageUri: publicUrl, voiceUri: undefined });
        } else {
          setCurrentMediaUri({ imageUri: undefined, voiceUri: publicUrl });
        }
      }

      setIsMediaCaptureVisible(false);

      // Build the message based on media type
      let contextMessage: string;
      if (media.type === 'voice') {
        if (transcribedText) {
          // Send the transcribed text directly as the user's message
          contextMessage = transcribedText;
        } else {
          // Transcription failed - ask user to type the problem
          contextMessage = "I tried to record a voice message but couldn't process it. Could you please type out the math problem instead?";
        }
      } else {
        contextMessage = IMAGE_CONTEXT_MESSAGE;
      }
      
      setTimeout(() => {
        handlePostMessageAsync(contextMessage).catch(console.error);
      }, MEDIA_CONTEXT_DELAY_IN_MS);
    } catch (error) {
      console.error('handleSubmitMediaAsync error:', error);
    } finally {
      setIsSubmittingMedia(false);
    }
  }

  function onSubmitMedia(media: CapturedMedia): void {
    handleSubmitMediaAsync(media).catch(console.error);
  }

  function onOpenMediaLibrary(): void {
    setIsMediaLibraryVisible(true);
  }

  function onCloseMediaLibrary(): void {
    setIsMediaLibraryVisible(false);
  }

  async function handleSelectLibraryMediaAsync(media: MediaItemWithUrl): Promise<void> {
    try {
      setIsSubmittingMedia(true);

      // Record usage
      await recordUserMediaUsage(supabaseClient, media.id);

      // Get signed URL if not available
      let mediaUrl = media.signedUrl;
      if (mediaUrl == null && media.storagePath != null) {
        mediaUrl = await getSignedMediaUrl(supabaseClient, media.storagePath);
      }

      if (mediaUrl == null) {
        throw new Error('Could not get media URL');
      }

      // For voice recordings, fetch and transcribe using Gemini
      let transcribedText: string | undefined;
      if (media.mediaType === 'VOICE_RECORDING') {
        try {
          console.log('Transcribing library voice recording...');
          const response = await fetch(mediaUrl);
          const blob = await response.blob();
          const transcriptionResult = await transcribeAudio(blob, media.fileName ?? 'voice.m4a');
          transcribedText = transcriptionResult.text;
          console.log('Library voice transcription successful:', transcribedText);
        } catch (audioError) {
          console.error('Library voice transcription failed:', audioError);
          // Continue without transcription
        }
      }

      // Update current media URI
      if (media.mediaType === 'IMAGE') {
        setCurrentMediaUri({ imageUri: mediaUrl, voiceUri: undefined });
      } else {
        setCurrentMediaUri({ imageUri: undefined, voiceUri: mediaUrl });
      }

      setIsMediaLibraryVisible(false);

      // Build the message based on media type
      let contextMessage: string;
      if (media.mediaType === 'VOICE_RECORDING') {
        if (transcribedText) {
          // Send the transcribed text directly as the user's message
          contextMessage = transcribedText;
        } else {
          // Transcription failed - ask user to type the problem
          contextMessage = "I selected a voice recording but couldn't transcribe it. Could you please type out the math problem instead?";
        }
      } else {
        contextMessage = IMAGE_CONTEXT_MESSAGE;
      }
      
      setTimeout(() => {
        handlePostMessageAsync(contextMessage).catch(console.error);
      }, MEDIA_CONTEXT_DELAY_IN_MS);
    } catch (error) {
      console.error('handleSelectLibraryMediaAsync error:', error);
    } finally {
      setIsSubmittingMedia(false);
    }
  }

  function onSelectLibraryMedia(media: MediaItemWithUrl): void {
    handleSelectLibraryMediaAsync(media).catch(console.error);
  }

  function onStartInlineRecording(): void {
    setIsInlineRecording(true);
  }

  async function handleInlineRecordingCompleteAsync(recording: RecordedVoice): Promise<void> {
    try {
      setIsInlineRecording(false);
      setIsSubmittingMedia(true);

      // Transcribe the audio
      let transcribedText: string | undefined;
      try {
        console.log('Transcribing inline voice recording...');
        const response = await fetch(recording.uri);
        const blob = await response.blob();
        const transcriptionResult = await transcribeAudio(blob, 'voice.m4a');
        transcribedText = transcriptionResult.text;
        console.log('Inline voice transcription successful:', transcribedText);
      } catch (transcriptionError) {
        console.error('Inline voice transcription failed:', transcriptionError);
      }

      // Try to upload to storage (optional - may fail if bucket doesn't exist)
      let publicUrl: string | undefined;
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user != null) {
          const response = await fetch(recording.uri);
          const blob = await response.blob();
          const fileName = `${Date.now()}.${recording.mimeType.includes('webm') ? 'webm' : 'm4a'}`;

          const uploadResult = await uploadUserMediaFile(
            supabaseClient,
            user.id,
            blob,
            fileName,
            'VOICE_RECORDING',
          );
          publicUrl = uploadResult.publicUrl;

          await createUserMedia(
            supabaseClient,
            'VOICE_RECORDING',
            uploadResult.storagePath,
            fileName,
            recording.mimeType,
            { durationInMs: recording.durationInMs },
          );
        }
      } catch (storageError) {
        console.warn('Storage upload failed (bucket may not exist):', storageError);
      }

      // Update current media URI if we have one
      if (publicUrl) {
        setCurrentMediaUri({ imageUri: undefined, voiceUri: publicUrl });
      }

      // Build and send the message
      let contextMessage: string;
      if (transcribedText) {
        contextMessage = transcribedText;
      } else {
        contextMessage = "I tried to record a voice message but couldn't process it. Could you please type out the math problem instead?";
      }

      await handlePostMessageAsync(contextMessage);
    } catch (error) {
      console.error('handleInlineRecordingCompleteAsync error:', error);
    } finally {
      setIsSubmittingMedia(false);
    }
  }

  function onInlineRecordingComplete(recording: RecordedVoice): void {
    handleInlineRecordingCompleteAsync(recording).catch(console.error);
  }

  function onInlineRecordingError(error: string): void {
    console.error('Inline recording error:', error);
    setIsInlineRecording(false);
  }

  function onInlineRecordingCancel(): void {
    setIsInlineRecording(false);
  }

  return {
    messages,
    isSending,
    inputText,
    isSendDisabled,
    messagesListRef,
    inputRef,
    multiline,
    keyboardVerticalOffset,
    problemImageUri,
    problemVoiceUri,
    quickActionOptions: QUICK_ACTION_OPTIONS,
    isMediaCaptureVisible,
    isMediaLibraryVisible,
    isSubmittingMedia,
    mediaCaptureMode,
    isInlineRecording,
    onSend,
    setInputText,
    onQuickActionPress,
    onGoBack,
    onNewChat,
    onOpenMediaCapture,
    onCloseMediaCapture,
    onSubmitMedia,
    onOpenMediaLibrary,
    onCloseMediaLibrary,
    onSelectLibraryMedia,
    onStartInlineRecording,
    onInlineRecordingComplete,
    onInlineRecordingError,
    onInlineRecordingCancel,
  };
}
