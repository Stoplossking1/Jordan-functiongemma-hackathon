import { type PropsWithChildren, type ReactNode } from 'react';

export function ReactInspectorOverlay(props: PropsWithChildren): ReactNode {
  // Just return the children when on non-web platforms
  return props.children;
}
