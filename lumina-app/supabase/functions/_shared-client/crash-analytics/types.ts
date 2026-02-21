import type { RecordedError } from '../error/recorded-errors.ts';

export type ReportTags = Record<string, string | number | boolean>;
export type ReportSeverity = 'info' | 'warning' | 'error' | 'debug';

export interface OriginalConsoleMethods {
  debug: typeof console.debug;
  log: typeof console.log;
  info: typeof console.info;
  warn: typeof console.warn;
  error: typeof console.error;
}

export interface ConsoleMessage {
  type: 'CONSOLE';
  level: 'debug' | 'log' | 'info' | 'warn' | 'error' | 'capture';
  payload?: RecordedError;
  timestamp: number;
  id?: string;
}

export interface CrashAnalyticsReporter {
  debug(...args: unknown[]): void;
  log(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;

  /**
   * Capture a report by going through all registered reporters and calling their capture method.
   * @param error The error to report, can be a string or an Error object.
   * @param severity Optional severity level of the report. If not provided, default value may be provided by specific reporter.
   * @param tags Optional tags to build the context around the report.
   * @deprecated Use error() method with AppError type instead
   */
  capture(error: unknown, severity?: ReportSeverity, tags?: ReportTags): void;
}

export interface CrashAnalyticsReporterRegistry {
  registerReporter(key: string, impl: CrashAnalyticsReporter): void;
  getReporters(): CrashAnalyticsReporter[];
  getReporterByName(name: string): CrashAnalyticsReporter | undefined;
}

export interface CrashAnalytics {
  debug(...args: unknown[]): void;
  log(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  captureError(error: string | Error, severity?: ReportSeverity, tags?: ReportTags): void;
}
