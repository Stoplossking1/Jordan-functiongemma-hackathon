/**
 * AUTO-GENERATED - DO NOT MODIFY!
 * Any changes will be lost when the file is regenerated.
 */

import { type PropsWithChildren, type ReactNode } from 'react';
import { type UnknownOutputParams } from 'expo-router';

import { useNav } from '@/comp-lib/navigation/useNav';
import { type TabsProgressUrlParams } from '@/app/(tabs)/progress';
import PracticeContainer from '@/app-pages/PracticeContainer';

export type PracticeUrlParams = UnknownOutputParams;

export interface PracticeProps extends PropsWithChildren {
  /**
   * The page's URL params. Includes path and query params.
   */
  urlParams: PracticeUrlParams;
  /**
   * Sets the navigation options using navigation.setOptions()
   * @param options The options to set
   * @returns void
   */
  setNavigationOptions: (options?: Record<string, any>) => void;

  /**
   * Returns to previous screen
   */
  onGoBack: () => void;
  /**
   * Navigate to progress to see updated learning stats
   */
  onNavigateToProgress: (urlParams?: TabsProgressUrlParams) => void;
}

/**
 * Practice problems interface for targeted skill improvement
 */
export default function PracticePage(props: PracticeProps): ReactNode {
  const { urlParams, setOptions, back, navigate } = useNav<PracticeUrlParams>({ auth: true });
  /**
   * Returns to previous screen
   */
  const onGoBack = () => {
    back();
  };
  /**
   * Navigate to progress to see updated learning stats
   */
  const onNavigateToProgress = (urlParams?: TabsProgressUrlParams) => {
    navigate({
      pathname: '/(tabs)/progress',
      params: urlParams,
    });
  };

  return (
    <PracticeContainer
      children={props.children}
      urlParams={urlParams}
      setNavigationOptions={setOptions}
      onGoBack={onGoBack}
      onNavigateToProgress={onNavigateToProgress}
    />
  );
}

