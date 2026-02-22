import { type PropsWithChildren, type ReactNode } from 'react';

import { INSPECTOR_ENABLED } from '@/config';
import { ReactInspectorOverlay } from './overlay/ReactInspectorOverlay';
import { ReactInspectorContextProvider } from './provider/ReactInspectorContextProvider';

/**
 * Wraps children with the React Inspector context and overlay if the inspector is enabled.
 */
export function ReactInspector(props: PropsWithChildren): ReactNode {
  if (!INSPECTOR_ENABLED) {
    return props.children;
  }

  return (
    <ReactInspectorContextProvider>
      <ReactInspectorOverlay>{props.children}</ReactInspectorOverlay>
    </ReactInspectorContextProvider>
  );
}
