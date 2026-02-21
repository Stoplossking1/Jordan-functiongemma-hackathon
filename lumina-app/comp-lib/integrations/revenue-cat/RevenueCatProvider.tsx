import { type PropsWithChildren, type ReactNode, createContext } from 'react';

import { useRevenueCatProviderFunc } from './RevenueCatProviderFunc.ts';
import type { RevenueCatInitProps } from './useRevenueCatInit.ts';

export interface RevenueCatContextType {
  isReady: boolean;
  isAuthenticated: boolean;
  logoutUser: () => Promise<void>;
  initError?: Error;
}

const defaultContextValue: RevenueCatContextType = {
  isReady: false,
  isAuthenticated: false,
  logoutUser: async () => {
    console.warn('RevenueCatProvider: logoutUser called outside of provider');
  },
  initError: undefined,
};

export const RevenueCatContext = createContext<RevenueCatContextType>(defaultContextValue);

export interface RevenueCatProviderProps extends PropsWithChildren, RevenueCatInitProps {}

/**
 * Provider component that initializes the RevenueCat SDK and manages user authentication.
 *
 * This provider:
 * - Initializes RevenueCat SDK on mount with the appropriate API key
 * - Automatically logs in users to RevenueCat when they authenticate in the app
 * - Provides context for checking SDK readiness and user authentication status
 *
 * Usage:
 * ```tsx
 * <RevenueCatProvider>
 *   <App />
 * </RevenueCatProvider>
 * ```
 */
export function RevenueCatProvider(props: RevenueCatProviderProps): ReactNode {
  const { contextValue } = useRevenueCatProviderFunc({
    enableDebugLogs: props.enableDebugLogs,
  });

  return <RevenueCatContext.Provider value={contextValue}>{props.children}</RevenueCatContext.Provider>;
}
