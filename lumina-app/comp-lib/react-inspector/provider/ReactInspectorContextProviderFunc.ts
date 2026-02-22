import { useCallback, useMemo, useState } from 'react';

import { sendMessageToParent } from '@/comp-lib/navigation/utils';
import { INSPECTOR_ENABLED } from '@/config';
import type { ReactElementData } from '@shared/inspector/element-inspector-types.ts';
import {
  INSPECTOR_MESSAGE_FROM_EVENT,
  type InspectorEvent,
  type InspectorServerStatus,
} from '../react-inspector-types.ts';
import type { ReactInspectorContextValue } from './ReactInspectorContextProvider.tsx';

export type ReactInspectorContextProviderFunc = {
  value: ReactInspectorContextValue;
};

export function useReactInspectorContextProvider(): ReactInspectorContextProviderFunc {
  const [status, setStatus] = useState<InspectorServerStatus>('off');

  const handleElementSelected = useCallback(
    (data?: ReactElementData) => {
      if (!INSPECTOR_ENABLED) return;

      sendMessageToParent({
        type: INSPECTOR_MESSAGE_FROM_EVENT,
        status: status,
        elementData: data,
        timestamp: new Date(),
      } as InspectorEvent);
    },
    [status],
  );

  const handleNewStatus = useCallback((newStatus: InspectorServerStatus) => {
    if (!INSPECTOR_ENABLED) return;
    setStatus(newStatus);
    sendMessageToParent({
      type: INSPECTOR_MESSAGE_FROM_EVENT,
      status: newStatus,
      timestamp: new Date(),
    } as InspectorEvent);
  }, []);

  const value: ReactInspectorContextValue = useMemo(
    () => ({
      status,
      handleNewStatus,
      handleElementSelected,
    }),
    [status, handleNewStatus, handleElementSelected],
  );

  return { value };
}
