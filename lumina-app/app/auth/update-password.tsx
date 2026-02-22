/**
 * AUTO-GENERATED - DO NOT MODIFY!
 * Any changes will be lost when the file is regenerated.
 */

import { type PropsWithChildren, type ReactNode } from 'react';
import { type UnknownOutputParams } from 'expo-router';

import { useNav } from '@/comp-lib/navigation/useNav';
import { type TabsHomeUrlParams } from '@/app/(tabs)/home';
import UpdatePasswordContainer from '@/app-pages/auth/UpdatePasswordContainer';

export type AuthUpdatePasswordUrlParams = UnknownOutputParams;

export interface UpdatePasswordProps extends PropsWithChildren {
  /**
   * The page's URL params. Includes path and query params.
   */
  urlParams: AuthUpdatePasswordUrlParams;
  /**
   * Sets the navigation options using navigation.setOptions()
   * @param options The options to set
   * @returns void
   */
  setNavigationOptions: (options?: Record<string, any>) => void;

  /**
   * Cancels password update and returns to login
   */
  onGoBack: () => void;
  /**
   * Executes after user successfully updates their password
   */
  onNavigateToHome: (urlParams?: TabsHomeUrlParams) => void;
}

/**
 * Update password page after reset flow
 */
export default function UpdatePasswordPage(props: UpdatePasswordProps): ReactNode {
  const { urlParams, setOptions, back, navigate } = useNav<AuthUpdatePasswordUrlParams>({ auth: false });
  /**
   * Cancels password update and returns to login
   */
  const onGoBack = () => {
    back();
  };
  /**
   * Executes after user successfully updates their password
   */
  const onNavigateToHome = (urlParams?: TabsHomeUrlParams) => {
    navigate({
      pathname: '/(tabs)/home',
      params: urlParams,
    });
  };

  return (
    <UpdatePasswordContainer
      children={props.children}
      urlParams={urlParams}
      setNavigationOptions={setOptions}
      onGoBack={onGoBack}
      onNavigateToHome={onNavigateToHome}
    />
  );
}
