import React, { type ReactNode } from 'react';
import { View, Animated } from 'react-native';

import { useToastStyles } from './ToastStyles';
import { useToastFunc } from './ToastFunc';
import { DEFAULT_DURATION, TOAST_TYPE_INFO, type ToastType } from './useToast';
import { type ToastBaseStyles } from './ToastStyles';

import { CustomTextField } from '../core/custom-text-field/CustomTextField';
import { CustomButton } from '../core/custom-button/CustomButton';

export interface ToastProps {
  message: string;
  duration?: number;
  isVisible: boolean;
  onDismiss: () => void;
  showCloseButton?: boolean;
  styles: ToastBaseStyles;
}

export function Toast({
  message,
  duration = DEFAULT_DURATION,
  isVisible,
  onDismiss,
  showCloseButton = true,
  styles,
}: ToastProps): ReactNode {
  const { fadeAnim, slideAnim, handleDismiss } = useToastFunc(isVisible, duration, onDismiss);

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <CustomTextField title={message} styles={styles.message} />
        {showCloseButton && <CustomButton title="✕" styles={styles.closeButton} onPress={handleDismiss} />}
      </View>
    </Animated.View>
  );
}
