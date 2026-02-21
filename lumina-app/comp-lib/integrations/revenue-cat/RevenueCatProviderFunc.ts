import { useContext, useEffect, useRef } from 'react';
import { useSession } from '@supabase/auth-helpers-react';

import { RevenueCatContext, type RevenueCatContextType } from './RevenueCatProvider.tsx';
import { type RevenueCatInitProps, useRevenueCatInit } from './useRevenueCatInit.ts';

/**
 * Hook to access the RevenueCat context
 */
export function useRevenueCat(): RevenueCatContextType {
  return useContext(RevenueCatContext);
}

/**
 * Return type for the useRevenueCatProviderFunc hook
 */
export interface RevenueCatProviderFunc {
  contextValue: RevenueCatContextType;
}

/**
 * Business logic hook for the RevenueCatProvider component.
 *
 * This hook:
 * - Initializes RevenueCat SDK
 * - Automatically logs in users to RevenueCat when they authenticate
 * - Returns the context value to be provided to children
 */
export function useRevenueCatProviderFunc(props: RevenueCatInitProps): RevenueCatProviderFunc {
  const { isReady, loginUser, logoutUser, initError } = useRevenueCatInit({
    enableDebugLogs: props.enableDebugLogs,
  });

  // Get session directly from Supabase
  const session = useSession();
  const userId = session?.user?.id;
  const isAuthenticated = userId != null;

  // Track last logged-in user to avoid duplicate logins
  const lastLoggedInUserIdRef = useRef<string | undefined>(undefined);

  // Login to RevenueCat when SDK is ready AND user is authenticated
  useEffect(() => {
    // Only login if SDK is ready, user is authenticated, and we haven't already logged in this user
    if (isReady && userId != null && userId !== lastLoggedInUserIdRef.current) {
      console.log('[RevenueCatProviderFunc] Logging in user to RevenueCat:', userId);
      lastLoggedInUserIdRef.current = userId;

      loginUser(userId).catch((error) => {
        console.error('[RevenueCatProviderFunc] Failed to login user to RevenueCat:', error);
        // Reset ref on failure so we can retry
        lastLoggedInUserIdRef.current = undefined;
      });
    } else if (userId == null && lastLoggedInUserIdRef.current != null) {
      // User logged out, reset the ref
      console.log('[RevenueCatProviderFunc] User logged out, resetting lastLoggedInUserIdRef');
      lastLoggedInUserIdRef.current = undefined;
    }
  }, [isReady, userId, loginUser]);

  const contextValue: RevenueCatContextType = {
    isReady,
    isAuthenticated,
    logoutUser,
    initError,
  };

  return { contextValue };
}
