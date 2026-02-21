/**
 * Business logic for the Profile route
 */
import { useState, useContext, useEffect } from 'react';

import * as Auth from '@/api/auth-api';
import { supabaseClient } from '@/api/supabase-client';
import { deleteCurrentUser } from '@/api/user-api';
import { OnboardingContext } from '@/comp-lib/common/context/OnboardingContextProvider';
import { alert } from '@/utils/alert';
import { t } from '@/i18n';
import { ProfileProps } from '@/app/(tabs)/profile';
import { CheckboxOption } from '@/comp-lib/core/custom-checkbox-list/CustomCheckboxList';
import { type GradeLevel, type MathTopic } from '@shared/generated-db-types';
import { readProfile, updateBasicProfile } from '@shared/profile-db';
import {
  readLuminaProfile,
  upsertLuminaProfile,
  readUserPreferences,
  upsertUserPreferences,
} from '@shared/lumina-db';

/**
 * Grade level options for middle school students (grades 6-9)
 * Maps to GradeLevel enum from database
 */
export const GRADE_LEVEL_OPTIONS: readonly { value: GradeLevel; label: string }[] = [
  { value: 'GRADE_6', label: 'Grade 6' },
  { value: 'GRADE_7', label: 'Grade 7' },
  { value: 'GRADE_8', label: 'Grade 8' },
  { value: 'GRADE_9', label: 'Grade 9' },
] as const;

export type GradeLevelValue = GradeLevel;

/**
 * Topic options for learning preferences
 * Maps to MathTopic enum from database
 */
export const TOPIC_OPTIONS: readonly CheckboxOption<MathTopic>[] = [
  { value: 'FRACTIONS', label: 'Fractions' },
  { value: 'DECIMALS', label: 'Decimals' },
  { value: 'PERCENTAGES', label: 'Percentages' },
  { value: 'BASIC_ALGEBRA', label: 'Early Algebra' },
  { value: 'WORD_PROBLEMS', label: 'Word Problems' },
] as const;

export type TopicValue = MathTopic;

/**
 * App version for display
 */
export const APP_VERSION = '1.0.0';

/**
 * Interface for the return value of the useProfile hook
 */
export interface ProfileFunc {
  /**
   * Loading state for async operations
   */
  isLoading: boolean;

  /**
   * Error state for async operations
   */
  error?: Error;

  /**
   * User's display name
   */
  displayName: string;

  /**
   * Whether display name is being edited
   */
  isEditingName: boolean;

  /**
   * User's grade level
   */
  gradeLevel: GradeLevelValue;

  /**
   * Whether grade level is being edited
   */
  isEditingGrade: boolean;

  /**
   * Selected learning topics
   */
  selectedTopics: TopicValue[];

  /**
   * Whether notifications are enabled
   */
  notificationsEnabled: boolean;

  /**
   * Grade level options for picker
   */
  gradeLevelOptions: typeof GRADE_LEVEL_OPTIONS;

  /**
   * Topic options for checkbox list
   */
  topicOptions: typeof TOPIC_OPTIONS;

  /**
   * App version string
   */
  appVersion: string;

  /**
   * Start editing display name
   */
  onStartEditName: () => void;

  /**
   * Cancel editing display name
   */
  onCancelEditName: () => void;

  /**
   * Update display name value
   */
  onChangeDisplayName: (name: string) => void;

  /**
   * Save display name
   */
  onSaveDisplayName: () => void;

  /**
   * Start editing grade level
   */
  onStartEditGrade: () => void;

  /**
   * Cancel editing grade level
   */
  onCancelEditGrade: () => void;

  /**
   * Update grade level
   */
  onChangeGradeLevel: (grade: GradeLevelValue) => void;

  /**
   * Save grade level
   */
  onSaveGradeLevel: () => void;

  /**
   * Handle topic selection changes
   */
  onToggleTopics: (topics: TopicValue[]) => void;

  /**
   * Toggle notifications
   */
  onToggleNotifications: (enabled: boolean) => void;

  /**
   * Navigate to chat history
   */
  onNavigateToChatHistory: () => void;

  /**
   * Share progress with parent/guardian
   */
  onShareProgress: () => void;

  /**
   * Logout handler
   */
  onLogout: (navigateAfterLogout: () => void) => void;

  /**
   * Delete account handler
   */
  onDeleteAccount: (navigateAfterLogout: () => void) => void;
}

/**
 * Custom hook that provides business logic for the Profile component
 */
export function useProfile(props: ProfileProps): ProfileFunc {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  // Profile state
  const [displayName, setDisplayName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempDisplayName, setTempDisplayName] = useState('');

  const [gradeLevel, setGradeLevel] = useState<GradeLevelValue>('GRADE_7');
  const [isEditingGrade, setIsEditingGrade] = useState(false);
  const [tempGradeLevel, setTempGradeLevel] = useState<GradeLevelValue>('GRADE_7');

  const [selectedTopics, setSelectedTopics] = useState<TopicValue[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const { resetOnboardingContext } = useContext(OnboardingContext);

  // Load profile data on mount
  useEffect(() => {
    loadProfileDataAsync().catch((err) => {
      console.error('loadProfileData error:', err);
      setError(err instanceof Error ? err : new Error('Failed to load profile'));
    });
  }, []);

  async function loadProfileDataAsync(): Promise<void> {
    setIsLoading(true);
    try {
      // Load base profile for display name
      const profile = await readProfile(supabaseClient);
      if (profile) {
        setDisplayName(profile.givenName ?? profile.fullName ?? 'Student');
      }

      // Load Lumina profile for grade level
      const luminaProfile = await readLuminaProfile(supabaseClient);
      if (luminaProfile?.gradeLevel) {
        setGradeLevel(luminaProfile.gradeLevel);
        setTempGradeLevel(luminaProfile.gradeLevel);
      }

      // Load user preferences for topics and notifications
      const preferences = await readUserPreferences(supabaseClient);
      if (preferences) {
        setSelectedTopics(preferences.struggleTopics ?? []);
        setNotificationsEnabled(preferences.notificationsEnabled ?? true);
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Name editing handlers
  function onStartEditName(): void {
    setTempDisplayName(displayName);
    setIsEditingName(true);
  }

  function onCancelEditName(): void {
    setIsEditingName(false);
    setTempDisplayName('');
  }

  function onChangeDisplayName(name: string): void {
    setTempDisplayName(name);
  }

  function onSaveDisplayName(): void {
    if (tempDisplayName.trim()) {
      const newName = tempDisplayName.trim();
      setDisplayName(newName);
      saveDisplayNameAsync(newName).catch((err) => {
        console.error('onSaveDisplayName error:', err);
      });
    }
    setIsEditingName(false);
  }

  async function saveDisplayNameAsync(name: string): Promise<void> {
    await supabaseClient.rpc('app:profile:user:update', {
      givenName: name,
    });
  }

  // Grade editing handlers
  function onStartEditGrade(): void {
    setTempGradeLevel(gradeLevel);
    setIsEditingGrade(true);
  }

  function onCancelEditGrade(): void {
    setIsEditingGrade(false);
  }

  function onChangeGradeLevel(grade: GradeLevelValue): void {
    setTempGradeLevel(grade);
  }

  function onSaveGradeLevel(): void {
    setGradeLevel(tempGradeLevel);
    saveGradeLevelAsync(tempGradeLevel).catch((err) => {
      console.error('onSaveGradeLevel error:', err);
    });
    setIsEditingGrade(false);
  }

  async function saveGradeLevelAsync(grade: GradeLevel): Promise<void> {
    await upsertLuminaProfile(supabaseClient, grade);
  }

  // Topic selection handler
  function onToggleTopics(topics: TopicValue[]): void {
    setSelectedTopics(topics);
    saveTopicsAsync(topics).catch((err) => {
      console.error('onToggleTopics error:', err);
    });
  }

  async function saveTopicsAsync(topics: MathTopic[]): Promise<void> {
    await upsertUserPreferences(supabaseClient, topics, undefined, notificationsEnabled);
  }

  // Notifications toggle handler
  function onToggleNotifications(enabled: boolean): void {
    setNotificationsEnabled(enabled);
    saveNotificationsAsync(enabled).catch((err) => {
      console.error('onToggleNotifications error:', err);
    });
  }

  async function saveNotificationsAsync(enabled: boolean): Promise<void> {
    await upsertUserPreferences(supabaseClient, selectedTopics, undefined, enabled);
  }

  // Navigation to chat history
  function onNavigateToChatHistory(): void {
    props.onNavigateToChats();
  }

  // Share progress with parent
  function onShareProgress(): void {
    alert(
      'Progress Report',
      'A summary of your learning progress will be generated and ready to share with your parent or guardian.',
      [{ text: 'OK' }],
    );
  }

  // Auth handlers
  async function handleLogout(navigateAfterLogout: () => void): Promise<void> {
    setIsLoading(true);
    const { error: logoutError } = await Auth.signOut(supabaseClient);
    setIsLoading(false);
    if (logoutError) {
      console.error('Failed to logout', logoutError);
      setError(logoutError instanceof Error ? logoutError : new Error('Failed to logout'));
      return;
    }
    resetOnboardingContext();
    navigateAfterLogout();
  }

  function onLogout(navigateAfterLogout: () => void): void {
    alert(
      t('auth.signOut'),
      t('auth.signOutConfirmation'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.signOut'),
          onPress: () => onConfirmLogout(navigateAfterLogout),
        },
      ],
      { cancelable: true },
    );
  }

  function onConfirmLogout(navigateAfterLogout: () => void): void {
    handleLogout(navigateAfterLogout).catch((err) => {
      console.error('handleLogout error', err);
    });
  }

  function onDeleteAccount(navigateAfterLogout: () => void): void {
    alert(
      t('auth.deleteAccount'),
      t('auth.deleteAccountConfirmation'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => onConfirmDeleteAccount(navigateAfterLogout),
        },
      ],
      { cancelable: true },
    );
  }

  function onConfirmDeleteAccount(navigateAfterLogout: () => void): void {
    handleDeleteAccount(navigateAfterLogout).catch((deleteError) => {
      console.error('onDeleteAccount error:', deleteError);
    });
  }

  async function handleDeleteAccount(navigateAfterLogout: () => void): Promise<void> {
    setIsLoading(true);
    try {
      await deleteCurrentUser(supabaseClient);
      const { error: logoutError } = await Auth.signOut(supabaseClient);
      setIsLoading(false);
      if (logoutError) {
        console.error('Failed to logout after account deletion', logoutError);
        setError(logoutError instanceof Error ? logoutError : new Error('Failed to logout'));
        return;
      }
    } catch (err) {
      setIsLoading(false);
      console.error('Failed to delete account:', err);
      setError(err instanceof Error ? err : new Error('Failed to delete account'));
    }
    resetOnboardingContext();
    navigateAfterLogout();
  }

  return {
    isLoading,
    error,
    displayName,
    isEditingName,
    gradeLevel,
    isEditingGrade,
    selectedTopics,
    notificationsEnabled,
    gradeLevelOptions: GRADE_LEVEL_OPTIONS,
    topicOptions: TOPIC_OPTIONS,
    appVersion: APP_VERSION,
    onStartEditName,
    onCancelEditName,
    onChangeDisplayName,
    onSaveDisplayName,
    onStartEditGrade,
    onCancelEditGrade,
    onChangeGradeLevel,
    onSaveGradeLevel,
    onToggleTopics,
    onToggleNotifications,
    onNavigateToChatHistory,
    onShareProgress,
    onLogout,
    onDeleteAccount,
  };
}
