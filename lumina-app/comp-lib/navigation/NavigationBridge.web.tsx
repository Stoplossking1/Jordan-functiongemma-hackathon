import { ReactNode } from 'react';

import { type NavigationBridgeProps } from './NavigationBridge';
import { usePageRouteReporter } from './PageRouteReporterFunc';
import { useNavigationListener } from './useNavigationListener';

export function NavigationBridge(props: NavigationBridgeProps): ReactNode {
  usePageRouteReporter(props);
  useNavigationListener();
  return props.children;
}
