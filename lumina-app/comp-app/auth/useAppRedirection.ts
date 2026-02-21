/**
 * Hook for handling navigation at app startup or after successful authentication
 * @todo AUTO-GENERATED STUB - customize to app specific needs
 */
import { type Session } from '@supabase/supabase-js';
import { useSegments, type Route, type RouteSegments } from 'expo-router';
import { useContext, useEffect, useMemo } from 'react';

import { supabaseClient } from '@/api/supabase-client';
import { OnboardingContext } from '@/comp-lib/common/context/OnboardingContextProvider';
import { isCurrentRoutePartOfAllowedRoutes } from '@/utils/route-utils';
import type { ProfileV1 } from '@shared/generated-db-types.ts';
import { readProfile } from '@shared/profile-db';

/**
 * * Interface that defines the functions for handling app navigation redirection
 */
interface AppRedirectionFunc {
  /** Handles redirection at app startup */
  handleAppStartupRedirection: (ignoreRoutes?: RouteSegments<Route>[]) => Promise<void>;

  /** Handles redirection after successful login */
  handlePostLoginRedirection: (session: Session) => Promise<void>;

  /** Handles redirection after successful login with error handling */
  onPostLoginRedirection: (session: Session) => void;
}

/** Interface that defines the navigation functions for authentication flow */
interface AppRedirectionProps {
  /**
   * Executes when the user is not authenticated, redirecting to the auth flow
   */
  onNavigateToLogin?: () => void;

  /**
   * Executes when the user is not authenticated, redirecting to the auth flow
   */
  onNavigateToSignup?: () => void;

  /**
   * Executes when the user wants to update their password, redirecting to the update password flow.
   */
  onNavigateToUpdatePassword?: () => void;

  /**
   * Executes when the user successfully authenticates and onboarding was not completed yet, redirecting to the onboarding flow
   */
  onNavigateToOnboarding: () => void;

  /**
   * Executes when the user successfully authenticates and onboarding was already completed, redirecting to the main app or home screen
   */
  onNavigateToHome: () => void;

  /**
   * List of routes where no redirection should occur post login.
   * This is useful for flows that require the user to stay on the current route, such as updating their password.
   */
  ignorePostLoginRedirectionRoutes?: RouteSegments<Route>[];
}

export function useAppRedirection(props: AppRedirectionProps): AppRedirectionFunc {
  const { onNavigateToOnboarding, onNavigateToHome, ignorePostLoginRedirectionRoutes } = props;
  const segments = useSegments();

  const { getHasCompletedOnboarding } = useContext(OnboardingContext);

  async function checkShouldGoToOnboarding(profile?: ProfileV1): Promise<boolean> {
    // Implementation instructions: customize this logic to your app specific onboarding needs
    const isOnboardingCompleted = await getHasCompletedOnboarding(); // Web: fetch eagerly because hydration timing can leave context undefined on first render
    return !isOnboardingCompleted;
  }

  useEffect(() => {
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      console.debug('Auth state change event:', event, 'Session:', session);

      // Handle auth state events here if needed
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * This variable convert the segments dependency into a simple boolean check.
   * This is to prevent unnecessary re-renders and checks when segments change, which would trigger the redirection logic unnecessarily, breaking navigation.
   */
  const shouldSkipPostLoginRedirection = useMemo(() => {
    if (
      ignorePostLoginRedirectionRoutes &&
      isCurrentRoutePartOfAllowedRoutes(segments, ignorePostLoginRedirectionRoutes)
    ) {
      console.debug(
        '[useAppRedirection] In no redirect route ' +
          segments.toString() +
          '. No redirection should occur on app startup to allow for specific flows, such as auth update password flow.',
      );
      return true;
    }
    return false;
  }, [segments, ignorePostLoginRedirectionRoutes]);

  async function handlePostLoginRedirection(session: Session) {
    if (shouldSkipPostLoginRedirection) return;

    if (session?.user) {
      const profile = await readProfile(supabaseClient);
      const shouldGoToOnboarding = await checkShouldGoToOnboarding(profile);
      if (shouldGoToOnboarding) {
        console.debug('Redirecting to onboarding');
        onNavigateToOnboarding?.();
      } else {
        console.debug('Redirecting to home');
        onNavigateToHome?.();
      }
    }
  }

  function onPostLoginRedirection(session: Session) {
    handlePostLoginRedirection(session).catch((err) => {
      console.log('Error handlePostLoginRedirection:', err);
    });
  }

  async function handleAppStartupRedirection() {
    try {
      const { data } = await supabaseClient.auth.getSession();
      if (data?.session?.user && data.session) {
        await handlePostLoginRedirection(data.session);
      } else {
        // stay on index(welcome) page
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }

  return {
    handleAppStartupRedirection,
    handlePostLoginRedirection,
    onPostLoginRedirection,
  };
}
