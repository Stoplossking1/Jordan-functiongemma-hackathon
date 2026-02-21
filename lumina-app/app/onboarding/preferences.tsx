/**
 * AUTO-GENERATED - DO NOT MODIFY!
 * Any changes will be lost when the file is regenerated.
 */

import { type PropsWithChildren, type ReactNode } from 'react';
import { type UnknownOutputParams } from 'expo-router';

import { useNav } from '@/comp-lib/navigation/useNav';
import { type TabsHomeUrlParams } from '@/app/(tabs)/home';
import PreferencesContainer from '@/app-pages/onboarding/PreferencesContainer';

export type OnboardingPreferencesUrlParams = UnknownOutputParams;

export interface PreferencesProps extends PropsWithChildren {
  /**
   * The page's URL params. Includes path and query params.
   */
  urlParams: OnboardingPreferencesUrlParams;
  /**
   * Sets the navigation options using navigation.setOptions()
   * @param options The options to set
   * @returns void
   */
  setNavigationOptions: (options?: Record<string, any>) => void;

  /**
   * Returns to profile page to edit name or grade
   */
  onGoBack: () => void;
  /**
   * Executes when user completes preferences and enters main app
   */
  onNavigateNextPage: (urlParams?: TabsHomeUrlParams) => void;
}

/**
 * Collect math topics user struggles with for personalized tutoring
 */
export default function PreferencesPage(props: PreferencesProps): ReactNode {
  const { urlParams, setOptions, back, replace } = useNav<OnboardingPreferencesUrlParams>({ auth: true });
  /**
   * Returns to profile page to edit name or grade
   */
  const onGoBack = () => {
    back();
  };
  /**
   * Executes when user completes preferences and enters main app
   */
  const onNavigateNextPage = (urlParams?: TabsHomeUrlParams) => {
    replace({
      pathname: '/(tabs)/home',
      params: urlParams,
    });
  };

  return (
    <PreferencesContainer
      children={props.children}
      urlParams={urlParams}
      setNavigationOptions={setOptions}
      onGoBack={onGoBack}
      onNavigateNextPage={onNavigateNextPage}
    />
  );
}
