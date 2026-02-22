import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

import { purchaseConfig } from '@/config.purchase';
import { getRevenueCatApiKey } from './revenuecat.config';

export interface RevenueCatInitProps {
  /**
   * Enable debug logging for RevenueCat SDK
   * @default true in sandbox, false in production
   */
  enableDebugLogs?: boolean;
}

export interface RevenueCatInitFunc {
  isReady: boolean;
  loginUser: (userId: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  initError?: Error;
}

/**
 * Hook that initializes the RevenueCat SDK for native in-app purchases.
 *
 * This hook:
 * - Configures RevenueCat with the appropriate API key based on environment
 * - Uses Test Store key in sandbox, platform-specific keys in production
 * - Provides methods to login/logout users with RevenueCat
 * - Sets debug logging in sandbox environment
 */
export function useRevenueCatInit(props?: RevenueCatInitProps): RevenueCatInitFunc {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<Error | undefined>(undefined);
  const isInitializedRef = useRef(false);

  const enableDebugLogs = props?.enableDebugLogs;

  // Initialize RevenueCat SDK on mount
  useEffect(() => {
    async function initializeRevenueCatAsync(): Promise<void> {
      // Prevent double initialization
      if (isInitializedRef.current) {
        return;
      }

      const apiKey = getRevenueCatApiKey();

      if (apiKey == null) {
        const error = new Error(
          `RevenueCat API key not found. Environment: ${purchaseConfig.purchaseEnv}, Platform: ${Platform.OS}. ` +
            'Please ensure the appropriate EXPO_PUBLIC_REVENUECAT_API_KEY_* environment variable is set.',
        );
        console.warn('RevenueCat initialization skipped:', error.message);
        setInitError(error);
        return;
      }

      try {
        // Set log level before configuration
        if (enableDebugLogs) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
          console.log('RevenueCat debug logs enabled');
        }

        // Configure RevenueCat SDK
        Purchases.configure({ apiKey });

        isInitializedRef.current = true;
        setIsReady(true);
        console.log(`RevenueCat SDK configured successfully for ${purchaseConfig.purchaseEnv} environment`);
      } catch (error) {
        const initErr = error instanceof Error ? error : new Error(String(error));
        console.error('RevenueCatProvider: Failed to configure RevenueCat SDK:', initErr);
        setInitError(initErr);
      }
    }

    initializeRevenueCatAsync().catch((error) => {
      console.error('RevenueCat initialization error:', error);
    });
  }, [enableDebugLogs]);

  const loginUser = useCallback(async (userId: string): Promise<void> => {
    if (!isInitializedRef.current) {
      console.warn('RevenueCat SDK not initialized. Cannot login user.');
      return;
    }

    try {
      const { created } = await Purchases.logIn(userId);
      console.log(`RevenueCat user logged in. User ID: ${userId}, Created: ${created}`);

      if (created) {
        console.log('New RevenueCat user created');
      }
    } catch (ex) {
      console.error('RevenueCatProvider: Failed to login user to RevenueCat:', ex);
      throw ex;
    }
  }, []);

  /**
   * Logout the current user from RevenueCat
   */
  const logoutUser = useCallback(async (): Promise<void> => {
    if (!isInitializedRef.current) {
      console.warn('RevenueCat SDK not initialized. Cannot logout user.');
      return;
    }

    try {
      await Purchases.logOut();
      console.log('RevenueCat user logged out');
    } catch (error) {
      console.error('RevenueCatProvider: Failed to logout user from RevenueCat:', error);
      throw error;
    }
  }, []);

  return {
    isReady,
    loginUser,
    logoutUser,
    initError,
  };
}
