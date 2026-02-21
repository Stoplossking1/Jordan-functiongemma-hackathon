import { useState, useCallback } from 'react';
import { t } from '@/i18n';

export interface UseErrorModalProps {
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export interface UseErrorModal {
  showMoreInfo: boolean;
  toggleMoreInfo: () => void;
  formatCause: (cause: unknown) => string;
  parsedSources: string[];
  componentStackLines: string[];
  sourcesExpanded: boolean;
  componentStackExpanded: boolean;
  toggleSourcesExpanded: () => void;
  toggleComponentStackExpanded: () => void;
}

export function useErrorModal(props: UseErrorModalProps): UseErrorModal {
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  const [componentStackExpanded, setComponentStackExpanded] = useState(false);

  const toggleMoreInfo = useCallback(() => {
    setShowMoreInfo((prev) => !prev);
  }, []);

  const formatCause = useCallback((cause: unknown): string => {
    if (cause == null) return '';
    if (typeof cause === 'string') return cause;
    if (cause instanceof Error) return `${cause.name}: ${cause.message}`;
    try {
      return JSON.stringify(cause);
    } catch {
      return t('errors.unknownCause');
    }
  }, []);

  const componentStackLines = (props.errorInfo?.componentStack ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const parsedSources = (props.error?.stack ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /:\d+:?\d*\)?$/.test(l));

  return {
    showMoreInfo,
    toggleMoreInfo,
    formatCause,
    parsedSources,
    componentStackLines,
    sourcesExpanded,
    componentStackExpanded,
    toggleSourcesExpanded: () => setSourcesExpanded((p) => !p),
    toggleComponentStackExpanded: () => setComponentStackExpanded((p) => !p),
  };
}
