/**
 * AUTO-GENERATED - DO NOT MODIFY!
 * Any changes will be lost when the file is regenerated.
 */

import { type PropsWithChildren, type ReactNode } from 'react';
import { type UnknownOutputParams } from 'expo-router';

import { useNav } from '@/comp-lib/navigation/useNav';
import { type OnboardingPreferencesUrlParams } from '@/app/onboarding/preferences';
import ProfileContainer from '@/app-pages/onboarding/ProfileContainer';

export type OnboardingProfileUrlParams = UnknownOutputParams;

export interface ProfileProps extends PropsWithChildren {
  /**
   * The page's URL params. Includes path and query params.
   */
  urlParams: OnboardingProfileUrlParams;
  /**
   * Sets the navigation options using navigation.setOptions()
   * @param options The options to set
   * @returns void
   */
  setNavigationOptions: (options?: Record<string, any>) => void;

  /**
   * Executes when user completes name and grade level, continues to preferences
   */
  onNavigateNextPage: (urlParams?: OnboardingPreferencesUrlParams) => void;
}

/**
 * Collect user name and grade level for personalization
 */
export default function ProfilePage(props: ProfileProps): ReactNode {
  const { urlParams, setOptions, navigate } = useNav<OnboardingProfileUrlParams>({ auth: true });
  /**
   * Executes when user completes name and grade level, continues to preferences
   */
  const onNavigateNextPage = (urlParams?: OnboardingPreferencesUrlParams) => {
    navigate({
      pathname: '/onboarding/preferences',
      params: urlParams,
    });
  };

  return (
    <ProfileContainer
      children={props.children}
      urlParams={urlParams}
      setNavigationOptions={setOptions}
      onNavigateNextPage={onNavigateNextPage}
    />
  );
}
