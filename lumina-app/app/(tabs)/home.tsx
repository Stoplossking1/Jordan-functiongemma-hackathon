/**
 * AUTO-GENERATED - DO NOT MODIFY!
 * Any changes will be lost when the file is regenerated.
 */

import { type PropsWithChildren, type ReactNode } from 'react';
import { type UnknownOutputParams } from 'expo-router';

import { useNav } from '@/comp-lib/navigation/useNav';
import { type AssistantUrlParams } from '@/app/assistant';
import { type ChatUrlParams } from '@/app/chat';
import HomeContainer from '@/app-pages/(tabs)/HomeContainer';

export type TabsHomeUrlParams = UnknownOutputParams;

export interface HomeProps extends PropsWithChildren {
  /**
   * The page's URL params. Includes path and query params.
   */
  urlParams: TabsHomeUrlParams;
  /**
   * Sets the navigation options using navigation.setOptions()
   * @param options The options to set
   * @returns void
   */
  setNavigationOptions: (options?: Record<string, any>) => void;

  /**
   * Opens AI tutor for detailed step-by-step help with a problem
   */
  onNavigateToAssistant: (urlParams?: AssistantUrlParams) => void;
  /**
   * Opens saved chat history and previous tutoring sessions
   */
  onNavigateToChats: (urlParams?: ChatUrlParams) => void;
}

/**
 * Main home screen with Snap a Problem camera feature
 */
export default function HomePage(props: HomeProps): ReactNode {
  const { urlParams, setOptions, push } = useNav<TabsHomeUrlParams>({ auth: true });
  /**
   * Opens AI tutor for detailed step-by-step help with a problem
   */
  const onNavigateToAssistant = (urlParams?: AssistantUrlParams) => {
    push({
      pathname: '/assistant',
      params: urlParams,
    });
  };
  /**
   * Opens saved chat history and previous tutoring sessions
   */
  const onNavigateToChats = (urlParams?: ChatUrlParams) => {
    push({
      pathname: '/chat',
      params: urlParams,
    });
  };

  return (
    <HomeContainer
      children={props.children}
      urlParams={urlParams}
      setNavigationOptions={setOptions}
      onNavigateToAssistant={onNavigateToAssistant}
      onNavigateToChats={onNavigateToChats}
    />
  );
}
