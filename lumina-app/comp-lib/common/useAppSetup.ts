import { useSession, useSessionContext } from '@supabase/auth-helpers-react';
/**
 * Interface for the return value of the useAppSetup hook
 */
export interface AppSetupFunc {
  /**
   * Whether the user is authenticated
   */
  isAuthenticated: boolean;

  /**
   * Indicates if session data is still loading
   */
  isLoading?: boolean;

  /**
   * Optional error during session fetching
   */
  error?: Error;
}

export function useAppSetup(): AppSetupFunc {
  const session = useSession();
  const sessionContext = useSessionContext();

  return {
    isAuthenticated: session?.user != null,
    isLoading: sessionContext.isLoading,
    error: sessionContext.error ?? undefined,
  };
}
