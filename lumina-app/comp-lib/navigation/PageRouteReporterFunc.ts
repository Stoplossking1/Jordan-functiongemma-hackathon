import { useEffect } from 'react';

import { usePathname, useSegments } from 'expo-router';

import { useAppSetup } from '../common/useAppSetup';
import { type NavigationBridgeProps } from './NavigationBridge';
import { PageRouteReporterMessage } from './PageRouteReporterTypes';
import { sendMessageToParent } from './utils';

export function usePageRouteReporter(props: NavigationBridgeProps): void {
  const pathname = usePathname();
  const segments = useSegments();
  const { isAuthenticated } = useAppSetup();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const pageRouteMessage: PageRouteReporterMessage = {
      type: 'ROUTE_CHANGE',
      href: window.location.href,
      pathname,
      segments,
      timestamp: Date.now(),
      isAuthenticated,
    };

    sendMessageToParent(pageRouteMessage);
    // disabling because we ONLY want to post when route changes, without dependency to isAuthenticated
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, segments]);
}
