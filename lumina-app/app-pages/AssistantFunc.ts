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

const WELCOME_MESSAGE = "Hey! 👋 I'm your math buddy. Snap a problem or type it out - I'll help you solve it step by step!";
const ERROR_MESSAGE = t('chat.errorMessage');
const LOADING_DOTS = '...';
const IMAGE_CONTEXT_MESSAGE = "I've captured a math problem. Can you help me solve it step by step?";

const IOS_PLATFORM = 'ios';
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NOTCH_TOP_INSET_THRESHOLD = 44;
const EXTRA_KEYBOARD_OFFSET_FOR_NOTCH = 40;
const KEYBOARD_DISMISS_DELAY_IN_MS = 100;
const IMAGE_CONTEXT_DELAY_IN_MS = 500;
const MAX_DECIMAL_PLACES = 6;

const OFFLINE_SOLVER_PREFIX = "You're offline, so I'm using on-device math mode.";
const OFFLINE_SOLVER_UNAVAILABLE_MESSAGE =
  "You're offline and I can't reach the full tutor. I can still help if you send a direct math expression like (12 + 6) * 3.";

const MATH_ALLOWED_CHARACTERS_PATTERN = /^[0-9+\-*/().\s]+$/;
const MATH_OPERATOR_PATTERN = /[+\-*/]/;
const MATH_DIGIT_PATTERN = /\d/;
const MATH_EXPRESSION_MAX_LENGTH = 120;
const NUMBER_TRAILING_ZEROES_PATTERN = /\.?0+$/;

interface FrozenAssistantParams {
  conversationId?: string;
  problemId?: string;
  imageUri?: string;
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
export interface SolutionStep {
  stepNumber: number;
  explanation: string;
}

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

  return Object.keys(context).length > 0 ? context : undefined;
}

function readFrozenAssistantParams(urlParams: AssistantProps['urlParams']): FrozenAssistantParams {
  const params = (urlParams ?? {}) as Record<string, unknown>;
  const conversationIdText = sanitizeParamValue(params.conversationId);
  const problemId = sanitizeParamValue(params.problemId);
  const imageUri = sanitizeParamValue(params.imageUri);

  const conversationId = toOptionalConversationId(conversationIdText);
  const problemConversationId = toOptionalConversationId(problemId);
  const resumeConversationId = conversationId ?? problemConversationId;
  const orchestrationContext = buildOrchestrationContext(resumeConversationId, problemId, imageUri);

  return {
    conversationId,
    problemId,
    imageUri,
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

type MathOperatorToken = '+' | '-' | '*' | '/';
type MathToken = number | MathOperatorToken | '(' | ')';

function isMathOperatorToken(token: MathToken): token is MathOperatorToken {
  return token === '+' || token === '-' || token === '*' || token === '/';
}

function isUnarySignPosition(previousToken?: MathToken): boolean {
  if (previousToken == null) {
    return true;
  }
  if (previousToken === '(') {
    return true;
  }
  return isMathOperatorToken(previousToken);
}

function tokenizeMathExpression(expression: string): MathToken[] | undefined {
  const tokens: MathToken[] = [];
  let index = 0;

  while (index < expression.length) {
    const char = expression[index];
    if (char == null) {
      return undefined;
    }

    if (char === ' ') {
      index++;
      continue;
    }

    const previousToken = tokens.length > 0 ? tokens[tokens.length - 1] : undefined;
    const isUnaryMinus = char === '-' && isUnarySignPosition(previousToken);

    if (isUnaryMinus || /[0-9.]/.test(char)) {
      const startIndex = index;
      index++;
      while (index < expression.length) {
        const nextChar = expression[index];
        if (nextChar == null || !/[0-9.]/.test(nextChar)) {
          break;
        }
        index++;
      }

      const numberText = expression.slice(startIndex, index);
      const numberValue = Number(numberText);
      if (!Number.isFinite(numberValue)) {
        return undefined;
      }
      tokens.push(numberValue);
      continue;
    }

    if (char === '+' || char === '-' || char === '*' || char === '/' || char === '(' || char === ')') {
      tokens.push(char);
      index++;
      continue;
    }

    return undefined;
  }

  return tokens.length > 0 ? tokens : undefined;
}

function readOperatorPrecedence(operator: MathOperatorToken): number {
  if (operator === '*' || operator === '/') {
    return 2;
  }
  return 1;
}

function applyMathOperation(values: number[], operator: MathOperatorToken): boolean {
  const rightValue = values.pop();
  const leftValue = values.pop();
  if (leftValue == null || rightValue == null) {
    return false;
  }

  let result = 0;
  switch (operator) {
    case '+':
      result = leftValue + rightValue;
      break;
    case '-':
      result = leftValue - rightValue;
      break;
    case '*':
      result = leftValue * rightValue;
      break;
    case '/':
      if (rightValue === 0) {
        return false;
      }
      result = leftValue / rightValue;
      break;
  }

  if (!Number.isFinite(result)) {
    return false;
  }

  values.push(result);
  return true;
}

function evaluateMathExpression(expression: string): number | undefined {
  const tokens = tokenizeMathExpression(expression);
  if (!tokens) {
    return undefined;
  }

  const values: number[] = [];
  const operators: Array<MathOperatorToken | '('> = [];

  for (const token of tokens) {
    if (typeof token === 'number') {
      values.push(token);
      continue;
    }

    if (token === '(') {
      operators.push(token);
      continue;
    }

    if (token === ')') {
      while (operators.length > 0 && operators[operators.length - 1] !== '(') {
        const operator = operators.pop();
        if (operator == null || operator === '(' || !applyMathOperation(values, operator)) {
          return undefined;
        }
      }

      if (operators[operators.length - 1] !== '(') {
        return undefined;
      }
      operators.pop();
      continue;
    }

    while (operators.length > 0) {
      const activeOperator = operators[operators.length - 1];
      if (activeOperator == null || activeOperator === '(') {
        break;
      }
      if (readOperatorPrecedence(activeOperator) < readOperatorPrecedence(token)) {
        break;
      }

      operators.pop();
      if (!applyMathOperation(values, activeOperator)) {
        return undefined;
      }
    }

    operators.push(token);
  }

  while (operators.length > 0) {
    const operator = operators.pop();
    if (operator == null || operator === '(') {
      return undefined;
    }
    if (!applyMathOperation(values, operator)) {
      return undefined;
    }
  }

  if (values.length !== 1) {
    return undefined;
  }

  const finalValue = values[0];
  return Number.isFinite(finalValue) ? finalValue : undefined;
}

function isMathExpressionCandidate(value: string): boolean {
  if (value.length === 0 || value.length > MATH_EXPRESSION_MAX_LENGTH) {
    return false;
  }
  if (!MATH_ALLOWED_CHARACTERS_PATTERN.test(value)) {
    return false;
  }
  if (!MATH_DIGIT_PATTERN.test(value) || !MATH_OPERATOR_PATTERN.test(value)) {
    return false;
  }
  return true;
}

function extractMathExpressionFromText(userText: string): string | undefined {
  const trimmedText = userText.trim().replace(/\?+$/, '').trim();
  if (isMathExpressionCandidate(trimmedText)) {
    return trimmedText;
  }

  const strippedText = trimmedText
    .replace(/[^0-9+\-*/().\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (isMathExpressionCandidate(strippedText)) {
    return strippedText;
  }

  return undefined;
}

function formatMathResult(value: number): string {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(MAX_DECIMAL_PLACES).replace(NUMBER_TRAILING_ZEROES_PATTERN, '');
}

function buildOfflineMathSteps(expression: string, resultText: string): SolutionStep[] {
  return [
    {
      stepNumber: 1,
      explanation: `Read the expression: ${expression}`,
    },
    {
      stepNumber: 2,
      explanation: `Apply order of operations (parentheses, then multiply/divide, then add/subtract).`,
    },
    {
      stepNumber: 3,
      explanation: `Final answer: ${resultText}`,
    },
  ];
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
  const mathExpression = extractMathExpressionFromText(userText);
  if (!mathExpression) {
    return undefined;
  }

  const resultValue = evaluateMathExpression(mathExpression);
  if (resultValue == null) {
    return undefined;
  }

  const resultText = formatMathResult(resultValue);
  const contentText = `${OFFLINE_SOLVER_PREFIX} Answer: ${resultText}`;
  return createAssistantBotMessage(contentText, buildOfflineMathSteps(mathExpression, resultText));
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
  quickActionOptions: QuickActionOption[];
  onSend: () => void;
  setInputText: (text: string) => void;
  onQuickActionPress: (actionId: QuickActionType) => void;
  onGoBack: () => void;
}

/**
 * Custom hook that provides business logic for the Assistant component
 */
export function useAssistant(props: AssistantProps): AssistantFunc {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isChatInitialized, setIsChatInitialized] = useState<boolean>(false);

  const messagesListRef = useRef<FlatList<ChatMessageItem>>(null);
  const inputRef = useRef<TextInput>(null);
  const hasProcessedImageRef = useRef<boolean>(false);
  const frozenParamsRef = useRef<FrozenAssistantParams | undefined>(undefined);

  const multiline = true;

  const insets = useSafeAreaInsets();
  const { customTextInputStyles } = useAssistantStyles(multiline);

  if (frozenParamsRef.current == null) {
    frozenParamsRef.current = readFrozenAssistantParams(props.urlParams);
  }

  const frozenParams = frozenParamsRef.current ?? {};
  const problemImageUri = frozenParams.imageUri;
  const resumeConversationId = frozenParams.resumeConversationId;
  const orchestrationContext = frozenParams.orchestrationContext;

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

  const { isSending, handlePostMessageToChatbot, initializeChat } = useConversationLlm({
    setMessages: handleSetLlmMessages,
  });

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
        const offlineTutorMessage = buildOfflineTutorMessage(message);
        if (offlineTutorMessage) {
          setMessages((previousMessages) => [offlineTutorMessage, ...previousMessages.slice(1)]);
          return;
        }

        const isOnline = await readIsOnlineAsync();
        if (isOnline === false) {
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
    },
    [handlePostMessageToChatbot, orchestrationContext],
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

  useEffect(() => {
    if (!problemImageUri || !isChatInitialized || hasProcessedImageRef.current) {
      return;
    }

    hasProcessedImageRef.current = true;
    const timeoutId = setTimeout(() => {
      handlePostMessageAsync(IMAGE_CONTEXT_MESSAGE).catch((error) => {
        console.error('Error sending problem image context:', error);
      });
    }, IMAGE_CONTEXT_DELAY_IN_MS);

    return () => clearTimeout(timeoutId);
  }, [handlePostMessageAsync, isChatInitialized, problemImageUri]);

  function onGoBack(): void {
    props.onGoBack();
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
    quickActionOptions: QUICK_ACTION_OPTIONS,
    onSend,
    setInputText,
    onQuickActionPress,
    onGoBack,
  };
}
