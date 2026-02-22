/* eslint-disable local/no-business-logic-in-components */
import { getLocalStorageAsync, setLocalStorageAsync, StorageKeys } from '@/utils/LocalStore';
import React, { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';

interface OnboardingContextType {
  isOnboardingCompleted: boolean;
  completeOnboarding: () => void;
  resetOnboardingContext: () => void;
  getHasCompletedOnboarding: () => Promise<boolean | undefined>;
}

type ProviderProps = {
  value?: OnboardingContextType;
  children: ReactNode;
};

const defaultOnboardingContext: OnboardingContextType = {
  isOnboardingCompleted: false,
  completeOnboarding: () => {
    console.warn('completeOnboarding function not initialized');
  },
  resetOnboardingContext: () => {
    console.warn('resetOnboardingContext function not initialized');
  },
  getHasCompletedOnboarding: async () => {
    console.warn('getHasCompletedOnboarding function not initialized');
    return undefined;
  },
};

export const OnboardingContext = createContext<OnboardingContextType>(defaultOnboardingContext);

export const OnboardingContextProvider: React.FC<ProviderProps> = ({ value, children }) => {
  // Marks onboarding as completed when the user taps "Continue" or "Skip" on the final onboarding screen
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean>(false);

  const getHasCompletedOnboarding = useCallback(async (): Promise<boolean | undefined> => {
    const value = await getLocalStorageAsync<boolean>(StorageKeys.IS_ONBOARDING_COMPLETED);
    if (value != null) {
      setIsOnboardingCompleted(value);
    }
    return value;
  }, []);

  useEffect(() => {
    getHasCompletedOnboarding().catch((err) => {
      console.log('Error retrieving onboarding status from AsyncStorage', err);
    });
  }, [getHasCompletedOnboarding]);

  function completeOnboarding() {
    setIsOnboardingCompleted(true);
    setLocalStorageAsync<boolean>(StorageKeys.IS_ONBOARDING_COMPLETED, true).catch((err) => {
      console.error(`Error saving isOnboardingCompleted to AsyncStorage:`, err);
    });
  }

  function resetOnboardingContext() {
    setIsOnboardingCompleted(defaultOnboardingContext.isOnboardingCompleted);
    setLocalStorageAsync<boolean>(
      StorageKeys.IS_ONBOARDING_COMPLETED,
      defaultOnboardingContext.isOnboardingCompleted,
    ).catch((err) => {
      console.error(`Error saving isOnboardingCompleted to AsyncStorage:`, err);
    });
  }

  function setContextValue(): OnboardingContextType {
    const defaultValue: OnboardingContextType = {
      isOnboardingCompleted,
      completeOnboarding,
      resetOnboardingContext,
      getHasCompletedOnboarding,
    };

    return {
      ...defaultValue,
      ...value,
    };
  }

  return <OnboardingContext.Provider value={setContextValue()}>{children}</OnboardingContext.Provider>;
};
