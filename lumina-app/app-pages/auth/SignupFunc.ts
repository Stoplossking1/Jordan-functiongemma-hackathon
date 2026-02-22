/**
 * Signup Func that handles account creation
 */
import { Session } from '@supabase/supabase-js';
import { SignupProps } from '@/app/auth/signup';

/**
 * Interface for the return value of the useSignup hook
 */
export interface SignupFunc {
  /** Signup handler */
  onSignup: (s: Session | undefined) => void;
}

/**
 * Custom hook that provides business logic for the Signup component
 *
 */
export function useSignup(props: SignupProps): SignupFunc {
  const onSignup = (s: Session | undefined) => {
    props.onNavigateToOnboarding();
  };

  return {
    onSignup,
  };
}
