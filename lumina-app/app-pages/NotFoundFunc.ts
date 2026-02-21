/**
 * Business logic for the NotFound route
 */
import { useState } from 'react';

import { t } from '@/i18n';
import { NotFoundProps } from '@/app/+not-found';

/**
 * Interface for the return value of the useNotFound hook
 */
export interface NotFoundFunc {
  /**
   * Loading state for async operations
   */
  isLoading: boolean;

  /**
   * Error state for async operations
   */
  error?: Error;

  /**
   * Friendly title message for the 404 page
   */
  titleMessage: string;

  /**
   * Supportive subtitle message
   */
  subtitleMessage: string;

  /**
   * Button text for navigation action
   */
  goHomeButtonTitle: string;

  /**
   * Handler for navigating to home
   */
  onGoHomePress: () => void;
}

/**
 * Custom hook that provides business logic for the NotFound component
 */
export function useNotFound(props: NotFoundProps): NotFoundFunc {
  const [isLoading] = useState(false);
  const [error] = useState<Error | undefined>(undefined);

  const titleMessage = t('notFound.title');
  const subtitleMessage = t('notFound.subtitle');
  const goHomeButtonTitle = t('notFound.goHomeButton');

  function onGoHomePress(): void {
    props.onNavigateToHome();
  }

  return {
    isLoading,
    error,
    titleMessage,
    subtitleMessage,
    goHomeButtonTitle,
    onGoHomePress,
  };
}
