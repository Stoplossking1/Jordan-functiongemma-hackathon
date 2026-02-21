import type { PropsWithChildren, ReactNode } from 'react';

export interface NavigationBridgeProps extends PropsWithChildren {}

// Feature not enabled for native mobile
export function NavigationBridge(props: NavigationBridgeProps): ReactNode {
  return props.children;
}
