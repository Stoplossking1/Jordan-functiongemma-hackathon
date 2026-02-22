/**
 * Business logic for the Chat route - Chat History Screen
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { FlatList } from 'react-native';

import { supabaseClient } from '@/api/supabase-client';
import { ChatProps } from '@/app/chat';
import { alert } from '@/utils/alert';
import {
  type ConversationHistoryItemV1,
  type MathTopic,
  type ProblemStatus,
  toUuidStr,
  type uuidstr,
} from '@shared/generated-db-types';
import { readAllLuminaConversationsWithPreview, deleteLuminaConversation } from '@shared/lumina-db';

export type TopicTagDisplay = 'Fractions' | 'Decimals' | 'Percentages' | 'Algebra' | 'Word Problems' | 'Math';

const DEFAULT_TOPIC_DISPLAY: TopicTagDisplay = 'Math';
const DEFAULT_PREVIEW_TEXT = 'No messages yet';
const DEFAULT_RELATIVE_TIME = 'Recently';
const DEFAULT_LOAD_ERROR_MESSAGE = 'Could not load chats. Please try again.';
const INVALID_CHAT_ALERT_TITLE = 'Unable to open chat';
const INVALID_CHAT_ALERT_MESSAGE = 'This chat is unavailable right now.';
const DELETE_CONFIRM_TITLE = 'Delete Conversation';
const DELETE_CONFIRM_MESSAGE = 'Are you sure you want to delete this conversation?';
const DELETE_ERROR_TITLE = 'Error';
const DELETE_ERROR_MESSAGE = 'Failed to delete conversation. Please try again.';

const MILLISECONDS_IN_SECOND = 1000;
const SECONDS_IN_MINUTE = 60;
const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;
const DAYS_IN_WEEK = 7;

const MILLISECONDS_IN_MINUTE = MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE;
const MILLISECONDS_IN_HOUR = MILLISECONDS_IN_MINUTE * MINUTES_IN_HOUR;
const MILLISECONDS_IN_DAY = MILLISECONDS_IN_HOUR * HOURS_IN_DAY;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ConversationHistoryItem {
  id: uuidstr;
  thumbnailUri?: string;
  topicTag: TopicTagDisplay;
  createdAt: string;
  previewText: string;
  status: 'solved' | 'in-progress';
}

function mapMathTopicToDisplay(topic: MathTopic | null): TopicTagDisplay {
  if (topic == null) return DEFAULT_TOPIC_DISPLAY;
  const topicMap: Record<MathTopic, TopicTagDisplay> = {
    FRACTIONS: 'Fractions',
    DECIMALS: 'Decimals',
    PERCENTAGES: 'Percentages',
    BASIC_ALGEBRA: 'Algebra',
    WORD_PROBLEMS: 'Word Problems',
  };
  return topicMap[topic] ?? DEFAULT_TOPIC_DISPLAY;
}

function mapProblemStatusToDisplay(status: ProblemStatus | null): 'solved' | 'in-progress' {
  if (status === 'SOLVED') return 'solved';
  return 'in-progress';
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

function normalizeForSearch(value: string): string {
  return value.trim().toLowerCase();
}

function getSafeTimestamp(createdAt: string | null | undefined, updatedAt: string | null | undefined): string {
  const createdAtInMs = Date.parse(createdAt ?? '');
  const updatedAtInMs = Date.parse(updatedAt ?? '');

  if (Number.isFinite(updatedAtInMs)) {
    return new Date(updatedAtInMs).toISOString();
  }

  if (Number.isFinite(createdAtInMs)) {
    return new Date(createdAtInMs).toISOString();
  }

  return new Date().toISOString();
}

function toSortableTimeInMs(timestamp: string): number {
  const parsed = Date.parse(timestamp);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return parsed;
}

function toSafeConversationId(rawConversationId: string | null | undefined): uuidstr | undefined {
  const normalizedConversationId = normalizeText(rawConversationId);
  if (!UUID_REGEX.test(normalizedConversationId)) {
    return undefined;
  }
  return toUuidStr(normalizedConversationId);
}

export function formatConversationRelativeTime(dateString: string): string {
  const conversationDate = new Date(dateString);
  if (Number.isNaN(conversationDate.getTime())) {
    return DEFAULT_RELATIVE_TIME;
  }

  const now = new Date();
  const diffInMs = now.getTime() - conversationDate.getTime();
  if (diffInMs < 0) {
    return DEFAULT_RELATIVE_TIME;
  }

  const diffInMins = Math.floor(diffInMs / MILLISECONDS_IN_MINUTE);
  const diffInHours = Math.floor(diffInMs / MILLISECONDS_IN_HOUR);
  const diffInDays = Math.floor(diffInMs / MILLISECONDS_IN_DAY);

  if (diffInMins < MINUTES_IN_HOUR) {
    return `${diffInMins}m ago`;
  }
  if (diffInHours < HOURS_IN_DAY) {
    return `${diffInHours}h ago`;
  }
  if (diffInDays === 1) {
    return 'Yesterday';
  }
  if (diffInDays < DAYS_IN_WEEK) {
    return `${diffInDays}d ago`;
  }
  return conversationDate.toLocaleDateString();
}

function mapApiToConversationHistoryItem(item: ConversationHistoryItemV1): ConversationHistoryItem | undefined {
  const conversationId = toSafeConversationId(item.id);
  if (conversationId == null) {
    return undefined;
  }

  const previewText = normalizeText(item.previewText);
  const thumbnailUri = normalizeText(item.problemImageUrl);

  return {
    id: conversationId,
    thumbnailUri: thumbnailUri.length > 0 ? thumbnailUri : undefined,
    topicTag: mapMathTopicToDisplay(item.topic),
    createdAt: getSafeTimestamp(item.createdAt, item.updatedAt),
    previewText: previewText.length > 0 ? previewText : DEFAULT_PREVIEW_TEXT,
    status: mapProblemStatusToDisplay(item.status),
  };
}

/**
 * Interface for the return value of the useChat hook
 */
export interface ChatFunc {
  conversations: ConversationHistoryItem[];
  searchText: string;
  isLoading: boolean;
  isEmptyState: boolean;
  isSearchEmptyState: boolean;
  loadErrorMessage?: string;
  pendingDeleteConversationId?: uuidstr;
  listRef: React.RefObject<FlatList<ConversationHistoryItem> | null>;
  onSearchChange: (text: string) => void;
  onConversationPress: (conversationId: uuidstr) => void;
  onDeleteConversation: (conversationId: uuidstr) => void;
  onNewChat: () => void;
  onRetryLoad: () => void;
  onGoBack: () => void;
}

/**
 * Custom hook that provides business logic for the Chat History component
 */
export function useChat(props: ChatProps): ChatFunc {
  const [allConversations, setAllConversations] = useState<ConversationHistoryItem[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | undefined>(undefined);
  const [pendingDeleteConversationId, setPendingDeleteConversationId] = useState<uuidstr | undefined>(undefined);

  const listRef = useRef<FlatList<ConversationHistoryItem> | null>(null);

  useEffect(() => {
    loadConversationsAsync().catch((error) => {
      console.error('loadConversationsAsync error:', error);
    });
  }, []);

  async function loadConversationsAsync(): Promise<void> {
    try {
      setIsLoading(true);
      setLoadErrorMessage(undefined);
      const apiConversations = await readAllLuminaConversationsWithPreview(supabaseClient);
      const mappedConversations: ConversationHistoryItem[] = [];
      const knownConversationIds = new Set<uuidstr>();

      for (const apiConversation of apiConversations) {
        const mappedConversation = mapApiToConversationHistoryItem(apiConversation);
        if (mappedConversation == null) {
          continue;
        }
        if (knownConversationIds.has(mappedConversation.id)) {
          continue;
        }
        knownConversationIds.add(mappedConversation.id);
        mappedConversations.push(mappedConversation);
      }

      setAllConversations(mappedConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setLoadErrorMessage(DEFAULT_LOAD_ERROR_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  }

  const normalizedSearchText = normalizeForSearch(searchText);

  const conversations = useMemo(() => {
    const filteredConversations = normalizedSearchText.length > 0
      ? allConversations.filter((conversation) => {
          const topicTag = normalizeForSearch(conversation.topicTag);
          const previewText = normalizeForSearch(conversation.previewText);
          return topicTag.includes(normalizedSearchText) || previewText.includes(normalizedSearchText);
        })
      : allConversations;

    return [...filteredConversations].sort(
      (conversationA, conversationB) =>
        toSortableTimeInMs(conversationB.createdAt) - toSortableTimeInMs(conversationA.createdAt),
    );
  }, [allConversations, normalizedSearchText]);

  const isEmptyState = !isLoading && loadErrorMessage == null && allConversations.length === 0;
  const isSearchEmptyState =
    !isLoading &&
    loadErrorMessage == null &&
    normalizedSearchText.length > 0 &&
    allConversations.length > 0 &&
    conversations.length === 0;

  function onSearchChange(text: string): void {
    setSearchText(text ?? '');
  }

  function onConversationPress(conversationId: uuidstr): void {
    if (conversationId === pendingDeleteConversationId) {
      return;
    }
    const safeConversationId = toSafeConversationId(conversationId);
    if (safeConversationId == null) {
      alert(INVALID_CHAT_ALERT_TITLE, INVALID_CHAT_ALERT_MESSAGE);
      return;
    }
    props.onNavigateToAssistant({ conversationId: safeConversationId });
  }

  async function handleDeleteConversationAsync(conversationId: uuidstr): Promise<void> {
    if (pendingDeleteConversationId != null) {
      return;
    }

    setPendingDeleteConversationId(conversationId);

    try {
      const wasDeleted = await deleteLuminaConversation(supabaseClient, conversationId);
      if (!wasDeleted) {
        alert(DELETE_ERROR_TITLE, DELETE_ERROR_MESSAGE);
        return;
      }
      setAllConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert(DELETE_ERROR_TITLE, DELETE_ERROR_MESSAGE);
    } finally {
      setPendingDeleteConversationId(undefined);
    }
  }

  function onDeleteConversation(conversationId: uuidstr): void {
    if (pendingDeleteConversationId != null) {
      return;
    }

    const safeConversationId = toSafeConversationId(conversationId);
    if (safeConversationId == null) {
      alert(DELETE_ERROR_TITLE, DELETE_ERROR_MESSAGE);
      return;
    }

    const hasConversation = allConversations.some((conversation) => conversation.id === safeConversationId);
    if (!hasConversation) {
      alert(DELETE_ERROR_TITLE, DELETE_ERROR_MESSAGE);
      return;
    }

    alert(DELETE_CONFIRM_TITLE, DELETE_CONFIRM_MESSAGE, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          handleDeleteConversationAsync(safeConversationId).catch((error) => {
            console.error('onDeleteConversation error:', error);
          });
        },
      },
    ]);
  }

  function onRetryLoad(): void {
    loadConversationsAsync().catch((error) => {
      console.error('onRetryLoad error:', error);
    });
  }

  function onNewChat(): void {
    // Navigate to assistant without a conversationId to start a fresh chat
    props.onNavigateToAssistant({});
  }

  function onGoBack(): void {
    props.onGoBack();
  }

  return {
    conversations,
    searchText,
    isLoading,
    isEmptyState,
    isSearchEmptyState,
    loadErrorMessage,
    pendingDeleteConversationId,
    listRef,
    onSearchChange,
    onConversationPress,
    onDeleteConversation,
    onNewChat,
    onRetryLoad,
    onGoBack,
  };
}
