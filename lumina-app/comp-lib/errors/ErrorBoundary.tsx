import React, { Component, type ReactNode } from 'react';
import { LogBox } from 'react-native';
import * as Crypto from 'expo-crypto';

import { crashAnalyticsFrontend } from '@/comp-lib/crash-analytics/CrashAnalyticsProvider';
import type { AppError } from '@shared/error/recorded-errors';

import { ErrorModal } from './ErrorModal';

// Disable all logs, to be sure that we don't show redbox for them
LogBox.ignoreLogs([/.*/]);

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  projectId?: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  projectId?: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      projectId: props.projectId,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Create AppError object for structured error reporting
    const callStack = error.stack;

    const appError: AppError = {
      type: 'appError',
      id: Crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      message: error.message || error.name || 'Unknown error',
      ...(callStack ? { callStack } : {}),
    };

    crashAnalyticsFrontend.error(appError);

    this.setState({ errorInfo });
  }

  handleClose = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorModal
          projectId={this.state.projectId}
          onClose={this.handleClose}
          error={this.state.error}
          errorInfo={this.state.errorInfo}
        />
      );
    }

    return this.props.children;
  }
}
