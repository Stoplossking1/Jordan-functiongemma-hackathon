/**
 * Business logic for the Preferences route
 */
import { useState, useContext } from 'react';

import { supabaseClient } from '@/api/supabase-client';
import { PreferencesProps } from '@/app/onboarding/preferences';
import { OnboardingContext } from '@/comp-lib/common/context/OnboardingContextProvider';
import { completeLuminaOnboarding } from '@shared/lumina-db';
import { type GradeLevel, type MathTopic } from '@shared/generated-db-types';

/** Math topic option for selection */
export interface MathTopicOption {
  value: MathTopic;
  label: string;
}

const MATH_TOPIC_OPTIONS: MathTopicOption[] = [
  { value: 'FRACTIONS', label: 'Fractions' },
  { value: 'DECIMALS', label: 'Decimals' },
  { value: 'PERCENTAGES', label: 'Percentages' },
  { value: 'BASIC_ALGEBRA', label: 'Basic Algebra' },
  { value: 'WORD_PROBLEMS', label: 'Word Problems' },
];

const CONCERNS_MAX_LENGTH = 100;
const CURRENT_STEP = 2;
const TOTAL_STEPS = 2;

/**
 * Interface for the return value of the usePreferences hook
 */
export interface PreferencesFunc {
  /** Available math topic options */
  topicOptions: MathTopicOption[];
  /** Currently selected topic values */
  selectedTopics: MathTopic[];
  /** Optional learning concerns text */
  concernsText: string;
  /** Maximum length for concerns text */
  concernsMaxLength: number;
  /** Current onboarding step */
  currentStep: number;
  /** Total onboarding steps */
  totalSteps: number;
  /** Error message for topic selection */
  topicError: string;
  /** Whether submit button should be enabled */
  isSubmitEnabled: boolean;
  /** Toggle a topic selection */
  onToggleTopic: (topicValue: MathTopic) => void;
  /** Update concerns text */
  onConcernsChange: (text: string) => void;
  /** Handle form submission */
  onHandleSubmit: () => void;
}

/**
 * Custom hook that provides business logic for the Preferences component
 */
export function usePreferences(props: PreferencesProps): PreferencesFunc {
  const [selectedTopics, setSelectedTopics] = useState<MathTopic[]>([]);
  const [concernsText, setConcernsText] = useState<string>('');
  const [topicError, setTopicError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { completeOnboarding } = useContext(OnboardingContext);

  // Get profile data from URL params (passed from profile onboarding step)
  const givenName = (props.urlParams.givenName as string) ?? '';
  const gradeLevel = (props.urlParams.gradeLevel as GradeLevel) ?? 'GRADE_6';

  const isSubmitEnabled = selectedTopics.length > 0 && !isSubmitting;

  function onToggleTopic(topicValue: MathTopic): void {
    setSelectedTopics((prev) => {
      if (prev.includes(topicValue)) {
        return prev.filter((t) => t !== topicValue);
      }
      return [...prev, topicValue];
    });
    // Clear error when user makes a selection
    if (topicError) {
      setTopicError('');
    }
  }

  function onConcernsChange(text: string): void {
    // Enforce max length
    if (text.length <= CONCERNS_MAX_LENGTH) {
      setConcernsText(text);
    }
  }

  function onHandleSubmit(): void {
    // Validate at least one topic selected
    if (selectedTopics.length === 0) {
      setTopicError('Please select at least one topic');
      return;
    }

    // Prevent double submission
    if (isSubmitting) {
      return;
    }

    handleSubmitAsync().catch((error) => {
      console.error('onHandleSubmit error:', error);
      setIsSubmitting(false);
      setTopicError('Something went wrong. Please try again.');
    });
  }

  async function handleSubmitAsync(): Promise<void> {
    setIsSubmitting(true);

    // Call the API to complete onboarding with all collected data
    await completeLuminaOnboarding(
      supabaseClient,
      givenName,
      gradeLevel,
      selectedTopics,
      concernsText || undefined,
    );

    // Complete onboarding in context and navigate
    completeOnboarding();
    props.onNavigateNextPage?.();
  }

  return {
    topicOptions: MATH_TOPIC_OPTIONS,
    selectedTopics,
    concernsText,
    concernsMaxLength: CONCERNS_MAX_LENGTH,
    currentStep: CURRENT_STEP,
    totalSteps: TOTAL_STEPS,
    topicError,
    isSubmitEnabled,
    onToggleTopic,
    onConcernsChange,
    onHandleSubmit,
  };
}
