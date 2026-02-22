/**
 * Business logic for the Progress route
 */
import { useEffect, useState } from 'react';

import { supabaseClient } from '@/api/supabase-client';
import { ProgressProps } from '@/app/(tabs)/progress';
import {
  type AchievementType,
  type AchievementV1,
  type LuminaProgressDataV1,
  type MathTopic,
  type StreakHistoryV1,
  type TopicMasteryV1,
} from '@shared/generated-db-types';
import { readLuminaProgressData } from '@shared/lumina-db';

const DEFAULT_NON_NEGATIVE_COUNT = 0;
const MIN_MASTERY_PERCENTAGE = 0;
const MAX_MASTERY_PERCENTAGE = 100;

const GENERIC_PROGRESS_ERROR_MESSAGE = 'We could not load your progress right now.';
const EMPTY_ACHIEVEMENT_SUMMARY = 'No badges earned yet';
const EMPTY_ACHIEVEMENT_DETAILS = 'Solve problems to unlock your first badge.';
const EMPTY_STREAK_SUMMARY = 'No active days logged yet';
const EMPTY_STREAK_DETAILS = 'Practice one problem to start your streak history.';
const DEFAULT_TOPIC_LABEL = 'Math';
const DEFAULT_ACHIEVEMENT_LABEL = 'Achievement';

const MATH_TOPIC_LABELS: Record<MathTopic, string> = {
  FRACTIONS: 'Fractions',
  DECIMALS: 'Decimals',
  PERCENTAGES: 'Percentages',
  BASIC_ALGEBRA: 'Algebra',
  WORD_PROBLEMS: 'Word Problems',
};

const ACHIEVEMENT_LABELS: Record<AchievementType, string> = {
  FIRST_PROBLEM_SOLVED: 'First problem solved',
  FIVE_DAY_STREAK: '5-day streak',
  TEN_DAY_STREAK: '10-day streak',
  THIRTY_DAY_STREAK: '30-day streak',
  FRACTION_MASTER: 'Fractions master',
  DECIMAL_MASTER: 'Decimals master',
  PERCENTAGE_MASTER: 'Percentages master',
  ALGEBRA_MASTER: 'Algebra master',
  WORD_PROBLEM_MASTER: 'Word problems master',
  TEN_PROBLEMS_SOLVED: '10 problems solved',
  FIFTY_PROBLEMS_SOLVED: '50 problems solved',
  HUNDRED_PROBLEMS_SOLVED: '100 problems solved',
};

export interface ProgressStatItem {
  id: string;
  title: string;
  value: string;
  helperText: string;
}

export interface ProgressTopicInsight {
  label: string;
  masteryText: string;
  attemptsText: string;
}

export interface ProgressSummaryItem {
  title: string;
  value: string;
  details: string;
}

/**
 * Interface for the return value of the useProgress hook
 */
export interface ProgressFunc {
  isLoading: boolean;
  errorMessage?: string;
  isEmpty: boolean;
  statItems: ProgressStatItem[];
  focusTopicInsight?: ProgressTopicInsight;
  strongTopicInsight?: ProgressTopicInsight;
  achievementSummary: ProgressSummaryItem;
  streakSummary: ProgressSummaryItem;
  onRetry: () => void;
  onContinuePractice: () => void;
}

/**
 * Custom hook that provides business logic for the Progress component
 */
export function useProgress(props: ProgressProps): ProgressFunc {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [progressData, setProgressData] = useState<LuminaProgressDataV1 | undefined>(undefined);

  useEffect(() => {
    loadProgressDataAsync().catch((error: unknown) => {
      console.error('loadProgressDataAsync error:', error);
    });
  }, []);

  async function loadProgressDataAsync(): Promise<void> {
    try {
      setIsLoading(true);
      setErrorMessage(undefined);
      const fetchedData = await readLuminaProgressData(supabaseClient);
      setProgressData(fetchedData);
    } catch (error) {
      console.error('loadProgressDataAsync failed:', error);
      setErrorMessage(GENERIC_PROGRESS_ERROR_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  }

  function onRetry(): void {
    loadProgressDataAsync().catch((error: unknown) => {
      console.error('onRetry loadProgressDataAsync error:', error);
    });
  }

  function onContinuePractice(): void {
    props.onNavigateToAssistant();
  }

  const progress = progressData?.progress;
  const achievements = toSafeArray(progressData?.achievements);
  const topicMasteries = toSafeArray(progressData?.topicMasteries);
  const streakHistory = toSafeArray(progressData?.streakHistory);

  const currentStreak = toSafeNonNegativeCount(progress?.currentStreak);
  const longestStreak = toSafeNonNegativeCount(progress?.longestStreak);
  const solvedToday = toSafeNonNegativeCount(progress?.problemsSolvedToday);
  const totalSolved = toSafeNonNegativeCount(progress?.totalProblemsSolved);

  const statItems: ProgressStatItem[] = [
    {
      id: 'currentStreak',
      title: 'Current streak',
      value: `${currentStreak}`,
      helperText: 'days in a row',
    },
    {
      id: 'longestStreak',
      title: 'Longest streak',
      value: `${longestStreak}`,
      helperText: 'best run',
    },
    {
      id: 'solvedToday',
      title: 'Solved today',
      value: `${solvedToday}`,
      helperText: 'problems',
    },
    {
      id: 'totalSolved',
      title: 'Total solved',
      value: `${totalSolved}`,
      helperText: 'all time',
    },
  ];

  const focusTopicInsight = buildFocusTopicInsight(topicMasteries);
  const strongTopicInsightCandidate = buildStrongTopicInsight(topicMasteries);
  const strongTopicInsight = shouldDisplayStrongTopicInsight(focusTopicInsight, strongTopicInsightCandidate)
    ? strongTopicInsightCandidate
    : undefined;
  const achievementSummary = buildAchievementSummary(achievements);
  const streakSummary = buildStreakSummary(streakHistory);

  const hasProgressCounts =
    currentStreak > DEFAULT_NON_NEGATIVE_COUNT ||
    longestStreak > DEFAULT_NON_NEGATIVE_COUNT ||
    solvedToday > DEFAULT_NON_NEGATIVE_COUNT ||
    totalSolved > DEFAULT_NON_NEGATIVE_COUNT;

  const hasCollections =
    achievements.length > DEFAULT_NON_NEGATIVE_COUNT ||
    topicMasteries.length > DEFAULT_NON_NEGATIVE_COUNT ||
    streakHistory.length > DEFAULT_NON_NEGATIVE_COUNT;

  const isEmpty = !hasProgressCounts && !hasCollections;

  return {
    isLoading,
    errorMessage,
    isEmpty,
    statItems,
    focusTopicInsight,
    strongTopicInsight,
    achievementSummary,
    streakSummary,
    onRetry,
    onContinuePractice,
  };
}

function toSafeArray<T>(items: T[] | null | undefined): T[] {
  return Array.isArray(items) ? items : [];
}

function toSafeNonNegativeCount(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value) || value < DEFAULT_NON_NEGATIVE_COUNT) {
    return DEFAULT_NON_NEGATIVE_COUNT;
  }
  return Math.floor(value);
}

function toSafeMasteryPercentage(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) {
    return MIN_MASTERY_PERCENTAGE;
  }
  if (value < MIN_MASTERY_PERCENTAGE) {
    return MIN_MASTERY_PERCENTAGE;
  }
  if (value > MAX_MASTERY_PERCENTAGE) {
    return MAX_MASTERY_PERCENTAGE;
  }
  return Math.round(value);
}

function formatTopicLabel(topic: MathTopic | null | undefined): string {
  if (topic == null) {
    return DEFAULT_TOPIC_LABEL;
  }
  return MATH_TOPIC_LABELS[topic] ?? DEFAULT_TOPIC_LABEL;
}

function formatAchievementLabel(achievementType: AchievementType | null | undefined): string {
  if (achievementType == null) {
    return DEFAULT_ACHIEVEMENT_LABEL;
  }
  return ACHIEVEMENT_LABELS[achievementType] ?? DEFAULT_ACHIEVEMENT_LABEL;
}

function buildFocusTopicInsight(topicMasteries: TopicMasteryV1[]): ProgressTopicInsight | undefined {
  if (topicMasteries.length === DEFAULT_NON_NEGATIVE_COUNT) {
    return undefined;
  }

  const sortedMasteries = [...topicMasteries].sort(sortByMasteryAscending);
  const focusTopic = sortedMasteries[0];
  const masteryPercentage = toSafeMasteryPercentage(focusTopic.masteryPercentage);
  const problemsAttempted = toSafeNonNegativeCount(focusTopic.problemsAttempted);

  return {
    label: formatTopicLabel(focusTopic.topic),
    masteryText: `${masteryPercentage}% mastery`,
    attemptsText: `${problemsAttempted} attempts`,
  };
}

function buildStrongTopicInsight(topicMasteries: TopicMasteryV1[]): ProgressTopicInsight | undefined {
  if (topicMasteries.length === DEFAULT_NON_NEGATIVE_COUNT) {
    return undefined;
  }

  const sortedMasteries = [...topicMasteries].sort(sortByMasteryDescending);
  const strongTopic = sortedMasteries[0];
  const masteryPercentage = toSafeMasteryPercentage(strongTopic.masteryPercentage);
  const problemsCorrect = toSafeNonNegativeCount(strongTopic.problemsCorrect);

  return {
    label: formatTopicLabel(strongTopic.topic),
    masteryText: `${masteryPercentage}% mastery`,
    attemptsText: `${problemsCorrect} correct`,
  };
}

function shouldDisplayStrongTopicInsight(
  focusTopicInsight: ProgressTopicInsight | undefined,
  strongTopicInsight: ProgressTopicInsight | undefined,
): boolean {
  if (strongTopicInsight == null) {
    return false;
  }
  if (focusTopicInsight == null) {
    return true;
  }

  return (
    strongTopicInsight.label !== focusTopicInsight.label ||
    strongTopicInsight.masteryText !== focusTopicInsight.masteryText
  );
}

function sortByMasteryAscending(left: TopicMasteryV1, right: TopicMasteryV1): number {
  return toSafeMasteryPercentage(left.masteryPercentage) - toSafeMasteryPercentage(right.masteryPercentage);
}

function sortByMasteryDescending(left: TopicMasteryV1, right: TopicMasteryV1): number {
  return toSafeMasteryPercentage(right.masteryPercentage) - toSafeMasteryPercentage(left.masteryPercentage);
}

function buildAchievementSummary(achievements: AchievementV1[]): ProgressSummaryItem {
  if (achievements.length === DEFAULT_NON_NEGATIVE_COUNT) {
    return {
      title: 'Achievements',
      value: EMPTY_ACHIEVEMENT_SUMMARY,
      details: EMPTY_ACHIEVEMENT_DETAILS,
    };
  }

  const newBadgesCount = achievements.filter(isNewAchievement).length;
  const latestAchievement = getLatestAchievement(achievements);
  const details =
    newBadgesCount > DEFAULT_NON_NEGATIVE_COUNT
      ? `${newBadgesCount} newly earned`
      : `Latest: ${formatAchievementLabel(latestAchievement?.achievementType)}`;

  return {
    title: 'Achievements',
    value: `${achievements.length} earned`,
    details,
  };
}

function isNewAchievement(achievement: AchievementV1): boolean {
  return achievement.isNew;
}

function getLatestAchievement(achievements: AchievementV1[]): AchievementV1 | undefined {
  if (achievements.length === DEFAULT_NON_NEGATIVE_COUNT) {
    return undefined;
  }

  const sortedAchievements = [...achievements].sort(sortByEarnedAtDescending);
  return sortedAchievements[0];
}

function sortByEarnedAtDescending(left: AchievementV1, right: AchievementV1): number {
  return right.earnedAt.localeCompare(left.earnedAt);
}

function buildStreakSummary(streakHistory: StreakHistoryV1[]): ProgressSummaryItem {
  const safeStreakHistory = toSafeArray(streakHistory);
  if (safeStreakHistory.length === DEFAULT_NON_NEGATIVE_COUNT) {
    return {
      title: 'Streak history',
      value: EMPTY_STREAK_SUMMARY,
      details: EMPTY_STREAK_DETAILS,
    };
  }

  const activeDaysCount = safeStreakHistory.filter(isActiveStreakDay).length;
  const totalProblemsSolved = safeStreakHistory.reduce(sumProblemsSolved, DEFAULT_NON_NEGATIVE_COUNT);

  return {
    title: 'Streak history',
    value: `${activeDaysCount} active days`,
    details: `${totalProblemsSolved} problems solved in tracked days`,
  };
}

function isActiveStreakDay(day: StreakHistoryV1): boolean {
  return day.wasActive;
}

function sumProblemsSolved(totalCount: number, day: StreakHistoryV1): number {
  return totalCount + toSafeNonNegativeCount(day.problemsSolved);
}
