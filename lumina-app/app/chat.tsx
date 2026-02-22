/**
 * AUTO-GENERATED - DO NOT MODIFY!
 * Any changes will be lost when the file is regenerated.
 */

import { type PropsWithChildren, type ReactNode } from 'react';
import { type UnknownOutputParams } from 'expo-router';

import { useNav } from '@/comp-lib/navigation/useNav';
import { type AssistantUrlParams } from '@/app/assistant';
import ChatContainer from '@/app-pages/ChatContainer';

export type ChatUrlParams = UnknownOutputParams;

export interface ChatProps extends PropsWithChildren {
  /**
   * The page's URL params. Includes path and query params.
   */
  urlParams: ChatUrlParams;
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
   * Opens AI tutor to continue a conversation
   */
  onNavigateToAssistant: (urlParams?: AssistantUrlParams) => void;
}

/**
 * Chat history and saved tutoring conversations
 */
export default function ChatPage(props: ChatProps): ReactNode {
  const { urlParams, setOptions, back, push } = useNav<ChatUrlParams>({ auth: true });
  /**
   * Returns to previous screen
   */
  const onGoBack = () => {
    back();
  };
  /**
   * Opens AI tutor to continue a conversation
   */
  const onNavigateToAssistant = (urlParams?: AssistantUrlParams) => {
    push({
      pathname: '/assistant',
      params: urlParams,
    });
  };

  return (
    <ChatContainer
      children={props.children}
      urlParams={urlParams}
      setNavigationOptions={setOptions}
      onGoBack={onGoBack}
      onNavigateToAssistant={onNavigateToAssistant}
    />
  );
}
