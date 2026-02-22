import React, { createContext, useContext, type ReactNode } from 'react';
import { Toast } from './Toast';
import { type ToastConfig, useToast } from './useToast';
import { useToastStyles } from './ToastStyles';

interface ToastContextType {
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showToast: (config: ToastConfig) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps): ReactNode {
  const { toastState, showSuccess, showError, showWarning, showInfo, showToast, hideToast } = useToast();
  const { styles } = useToastStyles(toastState.type);

  const contextValue: ToastContextType = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showToast,
    hideToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <Toast
        message={toastState.message}
        duration={toastState.duration}
        isVisible={toastState.isVisible}
        onDismiss={hideToast}
        showCloseButton={toastState.showCloseButton}
        styles={styles}
      />
    </ToastContext.Provider>
  );
}

export function useToastContext(): ToastContextType {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}
