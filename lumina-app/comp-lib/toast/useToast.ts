import { useState, useCallback } from 'react';

export const DEFAULT_DURATION = 5000;
export const TOAST_TYPE_INFO = 'info';
export const TOAST_TYPE_SUCCESS = 'success';
export const TOAST_TYPE_ERROR = 'error';
export const TOAST_TYPE_WARNING = 'warning';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
  showCloseButton?: boolean;
}

export interface ToastState {
  isVisible: boolean;
  message: string;
  type: ToastType;
  duration: number;
  showCloseButton: boolean;
}

interface ToastContextType {
  toastState: ToastState;
  showToast: (config: ToastConfig) => void;
  hideToast: () => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

export function useToast(): ToastContextType {
  const [toastState, setToastState] = useState<ToastState>({
    isVisible: false,
    message: '',
    type: TOAST_TYPE_INFO,
    duration: DEFAULT_DURATION,
    showCloseButton: true,
  });

  const showToast = useCallback((config: ToastConfig) => {
    setToastState({
      isVisible: true,
      message: config.message,
      type: config.type ?? TOAST_TYPE_INFO,
      duration: config.duration ?? DEFAULT_DURATION,
      showCloseButton: config.showCloseButton ?? true,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToastState((prev) => ({
      ...prev,
      isVisible: false,
    }));
  }, []);

  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      showToast({ message, type: TOAST_TYPE_SUCCESS, duration });
    },
    [showToast],
  );

  const showError = useCallback(
    (message: string, duration?: number) => {
      showToast({ message, type: TOAST_TYPE_ERROR, duration });
    },
    [showToast],
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => {
      showToast({ message, type: TOAST_TYPE_WARNING, duration });
    },
    [showToast],
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => {
      showToast({ message, type: TOAST_TYPE_INFO, duration });
    },
    [showToast],
  );

  return {
    toastState,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}
