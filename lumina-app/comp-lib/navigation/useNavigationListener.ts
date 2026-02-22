import { useEffect } from 'react';

import { useReactInspectorContext } from '@/comp-lib/react-inspector/provider/useReactInspectorContext';
import {
  INSPECTOR_MESSAGE_FROM_EVENT,
  INSPECTOR_MESSAGE_TO_CHANGE_STATUS_REQUEST,
  parseInspectorStatusChangeRequestMessage,
} from '@/comp-lib/react-inspector/react-inspector-types';
import { useNav } from './useNav';
import { isAllowedParentOrigin, setParentOriginFromMessage } from './utils';

export type NavigateMessageType = 'NAVIGATE';
export type NavigateMessage = {
  type: NavigateMessageType;
  path?: string;
  shouldReplace?: boolean;
  shouldGoBack?: boolean;
};

export function useNavigationListener(): void {
  const { navigate, replace, back } = useNav({});
  const { handleNewStatus } = useReactInspectorContext();

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Validate the origin against known origins and PR preview pattern
      if (!isAllowedParentOrigin(event.origin)) {
        return;
      }

      if (event.source !== window.parent) return;
      if (!event.data || typeof event.data !== 'object') return;

      // Cache the parent origin for future outgoing messages
      setParentOriginFromMessage(event.origin);

      switch (event.data.type) {
        case 'NAVIGATE': {
          const { path, shouldReplace, shouldGoBack } = event.data;
          if (shouldGoBack) {
            back();
          } else if (shouldReplace && path) {
            replace(path);
          } else if (path) {
            navigate(path);
          }
          return;
        }
        case INSPECTOR_MESSAGE_TO_CHANGE_STATUS_REQUEST: {
          const changeRequestMessage = parseInspectorStatusChangeRequestMessage(event.data);
          if (!changeRequestMessage) return;
          const { status } = changeRequestMessage;
          handleNewStatus(status);
          event.source.postMessage(
            {
              type: INSPECTOR_MESSAGE_FROM_EVENT,
              status,
            },
            event.origin,
          );
          return;
        }
        default: {
          return;
        }
      }
    }

    if (typeof window === 'undefined') {
      console.debug('useNavigationListener -> Window is not defined. This needs to run in a web environment');
      return;
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
    // Expo Router’s router methods (router.back(), router.replace(), router.push(), etc.) are stable — they don’t change across renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
