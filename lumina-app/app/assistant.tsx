/**
 * AUTO-GENERATED - DO NOT MODIFY!
 * Any changes will be lost when the file is regenerated.
 */

import { type PropsWithChildren, type ReactNode } from 'react';
import { type UnknownOutputParams } from 'expo-router';

import { useNav } from '@/comp-lib/navigation/useNav';
import { type TabsProgressUrlParams } from '@/app/(tabs)/progress';
import AssistantContainer from '@/app-pages/AssistantContainer';

export type AssistantUrlParams = UnknownOutputParams;

export interface AssistantProps extends PropsWithChildren {
  /**
   * The page's URL params. Includes path and query params.
   */
  urlParams: AssistantUrlParams;
  /**
   * Sets the navigation options using navigation.setOptions()
   * @param options The options to set
   * @returns void
   */
  setNavigationOptions: (options?: Record<string, any>) => void;

  /**
   * Returns to previous screen after tutoring session
   */
  onGoBack: () => void;
  /**
   * Navigate to progress to see updated learning stats
   */
  onNavigateToProgress: (urlParams?: TabsProgressUrlParams) => void;
}

/**
 * AI math tutor chatbot for step-by-step problem solving
 */
export default function AssistantPage(props: AssistantProps): ReactNode {
  const { urlParams, setOptions, back, navigate } = useNav<AssistantUrlParams>({ auth: true });
  /**
   * Returns to previous screen after tutoring session
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
    <AssistantContainer
      children={props.children}
      urlParams={urlParams}
      setNavigationOptions={setOptions}
      onGoBack={onGoBack}
      onNavigateToProgress={onNavigateToProgress}
    />
  );
}
