/**
 * AUTO-GENERATED - DO NOT MODIFY!
 * Any changes will be lost when the file is regenerated.
 */

import { type PropsWithChildren, type ReactNode } from 'react';
import { type UnknownOutputParams } from 'expo-router';

import { useNav } from '@/comp-lib/navigation/useNav';
import { type AuthLoginUrlParams } from '@/app/auth/login';
import { type ChatUrlParams } from '@/app/chat';
import ProfileContainer from '@/app-pages/(tabs)/ProfileContainer';

export type TabsProfileUrlParams = UnknownOutputParams;

export interface ProfileProps extends PropsWithChildren {
  /**
   * The page's URL params. Includes path and query params.
   */
  urlParams: TabsProfileUrlParams;
  /**
   * Sets the navigation options using navigation.setOptions()
   * @param options The options to set
   * @returns void
   */
  setNavigationOptions: (options?: Record<string, any>) => void;

  /**
   * Executes when user chooses to log out
   */
  onNavigateToAuth: (urlParams?: AuthLoginUrlParams) => void;
  /**
   * Opens chat history from profile
   */
  onNavigateToChats: (urlParams?: ChatUrlParams) => void;
}

/**
 * User profile with settings and preferences
 */
export default function ProfilePage(props: ProfileProps): ReactNode {
  const { urlParams, setOptions, replace, push } = useNav<TabsProfileUrlParams>({ auth: true });
  /**
   * Executes when user chooses to log out
   */
  const onNavigateToAuth = (urlParams?: AuthLoginUrlParams) => {
    replace({
      pathname: '/auth/login',
      params: urlParams,
    });
  };
  /**
   * Opens chat history from profile
   */
  const onNavigateToChats = (urlParams?: ChatUrlParams) => {
    push({
      pathname: '/chat',
      params: urlParams,
    });
  };

  return (
    <ProfileContainer
      children={props.children}
      urlParams={urlParams}
      setNavigationOptions={setOptions}
      onNavigateToAuth={onNavigateToAuth}
      onNavigateToChats={onNavigateToChats}
    />
  );
}
