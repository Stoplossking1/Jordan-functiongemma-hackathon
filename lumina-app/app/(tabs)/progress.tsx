/**
 * AUTO-GENERATED - DO NOT MODIFY!
 * Any changes will be lost when the file is regenerated.
 */

import { type PropsWithChildren, type ReactNode } from 'react';
import { type UnknownOutputParams } from 'expo-router';

import { useNav } from '@/comp-lib/navigation/useNav';
import { type AssistantUrlParams } from '@/app/assistant';
import ProgressContainer from '@/app-pages/(tabs)/ProgressContainer';

export type TabsProgressUrlParams = UnknownOutputParams;

export interface ProgressProps extends PropsWithChildren {
  /**
   * The page's URL params. Includes path and query params.
   */
  urlParams: TabsProgressUrlParams;
  /**
   * Sets the navigation options using navigation.setOptions()
   * @param options The options to set
   * @returns void
   */
  setNavigationOptions: (options?: Record<string, any>) => void;

  /**
   * Opens AI tutor to practice weak topics identified in progress
   */
  onNavigateToAssistant: (urlParams?: AssistantUrlParams) => void;
}

/**
 * Learning progress with streaks, achievements, and history
 */
export default function ProgressPage(props: ProgressProps): ReactNode {
  const { urlParams, setOptions, push } = useNav<TabsProgressUrlParams>({ auth: true });
  /**
   * Opens AI tutor to practice weak topics identified in progress
   */
  const onNavigateToAssistant = (urlParams?: AssistantUrlParams) => {
    push({
      pathname: '/assistant',
      params: urlParams,
    });
  };

  return (
    <ProgressContainer
      children={props.children}
      urlParams={urlParams}
      setNavigationOptions={setOptions}
      onNavigateToAssistant={onNavigateToAssistant}
    />
  );
}
