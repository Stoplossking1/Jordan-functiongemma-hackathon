/**
 * Business logic for the Home route
 */
import { useState, useEffect } from 'react';

import { supabaseClient } from '@/api/supabase-client';
import { HomeProps } from '@/app/(tabs)/home';
import { readLuminaHomeData } from '@shared/lumina-db';
import { type ConversationWithLuminaV1, type MathTopic } from '@shared/generated-db-types';

export type { MathTopic };

const HOME_ROUTE_SOURCE = 'home';
const INVALID_IMAGE_URI_ERROR_MESSAGE = 'Selected image is unavailable. Please try again.';
const OPEN_ASSISTANT_ERROR_MESSAGE = 'Could not open the tutor. Please try again.';

/**
 * Represents a recently solved math problem
 */
export interface RecentProblem {
  id: string;
  title: string;
  solvedAt: string;
  category: MathTopic | null;
}

/**
 * Formats a MathTopic enum value to a display-friendly string
 */
export function formatMathTopicDisplay(topic: MathTopic | null): string {
  if (topic == null) return 'Math';
  const topicMap: Record<MathTopic, string> = {
    FRACTIONS: 'Fractions',
    DECIMALS: 'Decimals',
    PERCENTAGES: 'Percentages',
    BASIC_ALGEBRA: 'Algebra',
    WORD_PROBLEMS: 'Word Problems',
  };
  return topicMap[topic] ?? 'Math';
}

/**
 * Formats a timestamp to a relative time string
 */
function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMins < 1) return 'Just now';
  if (diffInMins < 60) return `${diffInMins} min${diffInMins === 1 ? '' : 's'} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  return date.toLocaleDateString();
}

/**
 * Transforms conversation data to RecentProblem format
 */
function transformToRecentProblems(conversations: ConversationWithLuminaV1[] | null): RecentProblem[] {
  if (conversations == null || conversations.length === 0) return [];

  return conversations
    .filter((conv) => conv.conversation != null)
    .map((conv) => ({
      id: conv.conversation?.id ?? '',
      title: conv.luminaData?.title ?? conv.conversation?.subject ?? 'Math Problem',
      solvedAt: formatRelativeTime(conv.conversation?.updatedAt ?? conv.conversation?.createdAt ?? ''),
      category: conv.luminaData?.topic ?? null,
    }));
}

/**
 * Interface for the return value of the useHome hook
 */
export interface HomeFunc {
  /**
   * Loading state for async operations
   */
  isLoading: boolean;

  /**
   * Error state for async operations
   */
  error?: Error;

  /**
   * User's display name for personalized greeting
   */
  displayName: string;

  /**
   * Current streak count in days
   */
  streakCount: number;

  /**
   * Number of problems solved today
   */
  problemsSolvedToday: number;

  /**
   * List of recently solved problems
   */
  recentProblems: RecentProblem[];

  /**
   * Handler for camera button press - navigates to assistant
   */
  onSnapProblem: () => void;

  /**
   * Whether the problem capture sheet is visible
   */
  isProblemCaptureVisible: boolean;

  /**
   * Whether capture completion is currently submitting navigation
   */
  isSubmittingProblemCapture: boolean;

  /**
   * Any capture-related error that should be shown to the user
   */
  problemCaptureErrorMessage?: string;

  /**
   * Cancels problem capture flow from Home
   */
  onCancelProblemCapture: () => void;

  /**
   * Handles completed problem image selection/capture
   */
  onCompleteProblemCapture: (imageUri: string) => void;

  /**
   * Handler for tapping a recent problem to review
   */
  onReviewProblem: (problemId: string) => void;

  /**
   * Handler for chat history button press
   */
  onOpenChatHistory: () => void;
}

/**
 * Custom hook that provides business logic for the Home component
 */
export function useHome(props: HomeProps): HomeFunc {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [displayName, setDisplayName] = useState('Learner');
  const [streakCount, setStreakCount] = useState(0);
  const [problemsSolvedToday, setProblemsSolvedToday] = useState(0);
  const [recentProblems, setRecentProblems] = useState<RecentProblem[]>([]);
  const [isProblemCaptureVisible, setIsProblemCaptureVisible] = useState(false);
  const [isSubmittingProblemCapture, setIsSubmittingProblemCapture] = useState(false);
  const [problemCaptureErrorMessage, setProblemCaptureErrorMessage] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchHomeDataAsync().catch((error) => {
      console.error('fetchHomeDataAsync error:', error);
    });
  }, []);

  async function fetchHomeDataAsync(): Promise<void> {
    try {
      setIsLoading(true);
      setError(undefined);

      const homeData = await readLuminaHomeData(supabaseClient);

      if (homeData != null) {
        setDisplayName(homeData.givenName ?? 'Learner');
        setStreakCount(homeData.currentStreak ?? 0);
        setProblemsSolvedToday(homeData.problemsSolvedToday ?? 0);
        setRecentProblems(transformToRecentProblems(homeData.recentConversations));
      }
    } catch (err) {
      console.error('Error fetching home data:', err);
      setError(err instanceof Error ? err : new Error('Failed to load home data'));
    } finally {
      setIsLoading(false);
    }
  }

  function onSnapProblem(): void {
    setProblemCaptureErrorMessage(undefined);
    setIsProblemCaptureVisible(true);
  }

  function onCancelProblemCapture(): void {
    if (isSubmittingProblemCapture) {
      return;
    }

    setProblemCaptureErrorMessage(undefined);
    setIsProblemCaptureVisible(false);
  }

  async function navigateToAssistantWithImageAsync(imageUri: string): Promise<void> {
    const imageUriTrimmed = imageUri.trim();
    if (imageUriTrimmed.length === 0) {
      setProblemCaptureErrorMessage(INVALID_IMAGE_URI_ERROR_MESSAGE);
      return;
    }

    try {
      setIsSubmittingProblemCapture(true);
      setProblemCaptureErrorMessage(undefined);
      props.onNavigateToAssistant({
        imageUri: imageUriTrimmed,
        routeSource: HOME_ROUTE_SOURCE,
      });
      setIsProblemCaptureVisible(false);
    } catch (error) {
      console.error('navigateToAssistantWithImageAsync error:', error);
      setProblemCaptureErrorMessage(OPEN_ASSISTANT_ERROR_MESSAGE);
    } finally {
      setIsSubmittingProblemCapture(false);
    }
  }

  function onCompleteProblemCapture(imageUri: string): void {
    navigateToAssistantWithImageAsync(imageUri).catch((error) => {
      console.error('onCompleteProblemCapture error:', error);
      setProblemCaptureErrorMessage(OPEN_ASSISTANT_ERROR_MESSAGE);
      setIsSubmittingProblemCapture(false);
    });
  }

  function onReviewProblem(problemId: string): void {
    props.onNavigateToAssistant({
      problemId,
      routeSource: HOME_ROUTE_SOURCE,
    });
  }

  function onOpenChatHistory(): void {
    props.onNavigateToChats();
  }

  return {
    isLoading,
    error,
    displayName,
    streakCount,
    problemsSolvedToday,
    recentProblems,
    onSnapProblem,
    isProblemCaptureVisible,
    isSubmittingProblemCapture,
    problemCaptureErrorMessage,
    onCancelProblemCapture,
    onCompleteProblemCapture,
    onReviewProblem,
    onOpenChatHistory,
  };
}
