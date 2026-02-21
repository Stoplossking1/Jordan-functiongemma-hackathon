import { useEffect } from 'react';

import { useThemedStyles } from './useThemedStyles';
import { sendMessageToParent } from '../navigation/utils';

export type AppPreviewSendStylesDataMessageType = 'WOZ_APP_PREVIEW_SEND_STYLES_DATA';

export interface AppPreviewSendStylesDataMessage {
  type: AppPreviewSendStylesDataMessageType;
  backgroundColor: string;
}

export function useAppPreviewSendStylesData(): void {
  const { colors } = useThemedStyles();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.self === window.top) return;

    const message: AppPreviewSendStylesDataMessage = {
      type: 'WOZ_APP_PREVIEW_SEND_STYLES_DATA',
      backgroundColor: colors.primaryBackground,
    };

    sendMessageToParent(message);
  }, [colors.primaryBackground]);
}
