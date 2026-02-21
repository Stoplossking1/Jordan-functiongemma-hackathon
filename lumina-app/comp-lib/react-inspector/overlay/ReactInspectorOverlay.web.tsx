import { type PropsWithChildren, type ReactNode } from 'react';

import { useReactInspectorOverlay } from './ReactInspectorOverlayFunc';

export function ReactInspectorOverlay(props: PropsWithChildren): ReactNode {
  useReactInspectorOverlay();
  return props.children;
}
