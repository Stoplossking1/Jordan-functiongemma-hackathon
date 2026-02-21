import { type Route, type RouteSegments, SplashScreen } from 'expo-router';

import { LayoutProps } from '@/app/_layout';
import { useEffect } from 'react';
import { useAppRedirection } from './useAppRedirection';

// Define the public routes that do not require authentication to be passed to the useAppRedirection hook
const PUBLIC_ROUTES: RouteSegments<Route>[] = [
  ['auth', 'login'],
  ['auth', 'signup'],
  ['auth', 'reset-password'],

  // Add more public routes as needed
];

// Define routes where no redirection should occur on app startup.
const IGNORE_POST_LOGIN_REDIRECTION_ROUTES: RouteSegments<Route>[] = [
  ...PUBLIC_ROUTES,
  /**
   * "/auth/update-password" route is used for updating the password after login.
   * It contins url parameters that are critical for the auth update password flow, thus no redirection should occur.
   */
  ['auth', 'update-password'],

  // Add more routes that should not trigger app startup redirection as needed
];

export function useAppStartRedirection(props: LayoutProps): void {
  const { handleAppStartupRedirection } = useAppRedirection({
    onNavigateToLogin: props.onNavigateToLogin,
    onNavigateToHome: props.onNavigateToHome,
    onNavigateToOnboarding: props.onNavigateToOnboarding,
    ignorePostLoginRedirectionRoutes: IGNORE_POST_LOGIN_REDIRECTION_ROUTES,
  });

  useEffect(() => {
    async function handleRedirection() {
      await handleAppStartupRedirection();
      setTimeout(() => {
        SplashScreen.hideAsync().catch((err) => {
          console.log('Error hiding splash screen:', err);
        });
      }, 500); // prevent index flickering that navigation animation causes
    }

    handleRedirection().catch((error) => {
      console.error('handleRedirection error:', error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // NOTE: do not add any dependencies, otherwise "handleAppStartupRedirection" will execute twice and we need it to execute only once on app start
}
