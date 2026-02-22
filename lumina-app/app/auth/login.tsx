/**
 * AUTO-GENERATED - DO NOT MODIFY!
 * Any changes will be lost when the file is regenerated.
 */

import { type PropsWithChildren, type ReactNode } from 'react';
import { type UnknownOutputParams } from 'expo-router';

import { useNav } from '@/comp-lib/navigation/useNav';
import { type TabsHomeUrlParams } from '@/app/(tabs)/home';
import { type OnboardingProfileUrlParams } from '@/app/onboarding/profile';
import { type AuthSignupUrlParams } from '@/app/auth/signup';
import { type AuthResetPasswordUrlParams } from '@/app/auth/reset-password';
import LoginContainer from '@/app-pages/auth/LoginContainer';

export type AuthLoginUrlParams = UnknownOutputParams;

export interface LoginProps extends PropsWithChildren {
  /**
   * The page's URL params. Includes path and query params.
   */
  urlParams: AuthLoginUrlParams;
  /**
   * Sets the navigation options using navigation.setOptions()
   * @param options The options to set
   * @returns void
   */
  setNavigationOptions: (options?: Record<string, any>) => void;

  /**
   * Executes when user successfully logs in and onboarding is complete
   */
  onNavigateToHome: (urlParams?: TabsHomeUrlParams) => void;
  /**
   * Executes when user logs in but needs to complete onboarding
   */
  onNavigateToOnboarding: (urlParams?: OnboardingProfileUrlParams) => void;
  /**
   * Executes when user selects they need to create an account
   */
  onNavigateToSignup: (urlParams?: AuthSignupUrlParams) => void;
  /**
   * Executes when user selects forgot password option
   */
  onNavigateToResetPassword: (urlParams?: AuthResetPasswordUrlParams) => void;
}

/**
 * Login page for returning users
 */
export default function LoginPage(props: LoginProps): ReactNode {
  const { urlParams, setOptions, navigate } = useNav<AuthLoginUrlParams>({ auth: false });
  /**
   * Executes when user successfully logs in and onboarding is complete
   */
  const onNavigateToHome = (urlParams?: TabsHomeUrlParams) => {
    navigate({
      pathname: '/(tabs)/home',
      params: urlParams,
    });
  };
  /**
   * Executes when user logs in but needs to complete onboarding
   */
  const onNavigateToOnboarding = (urlParams?: OnboardingProfileUrlParams) => {
    navigate({
      pathname: '/onboarding/profile',
      params: urlParams,
    });
  };
  /**
   * Executes when user selects they need to create an account
   */
  const onNavigateToSignup = (urlParams?: AuthSignupUrlParams) => {
    navigate({
      pathname: '/auth/signup',
      params: urlParams,
    });
  };
  /**
   * Executes when user selects forgot password option
   */
  const onNavigateToResetPassword = (urlParams?: AuthResetPasswordUrlParams) => {
    navigate({
      pathname: '/auth/reset-password',
      params: urlParams,
    });
  };

  return (
    <LoginContainer
      children={props.children}
      urlParams={urlParams}
      setNavigationOptions={setOptions}
      onNavigateToHome={onNavigateToHome}
      onNavigateToOnboarding={onNavigateToOnboarding}
      onNavigateToSignup={onNavigateToSignup}
      onNavigateToResetPassword={onNavigateToResetPassword}
    />
  );
}
