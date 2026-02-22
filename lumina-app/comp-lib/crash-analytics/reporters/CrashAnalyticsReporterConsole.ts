import type {
  CrashAnalyticsReporter,
  OriginalConsoleMethods,
  ReportSeverity,
  ReportTags,
} from '@shared/crash-analytics/types.ts';

export class CrashAnalyticsReporterConsole implements CrashAnalyticsReporter {
  constructor(private console: OriginalConsoleMethods) {}

  debug(...args: unknown[]): void {
    this.console.debug(...args);
  }
  log(...args: unknown[]): void {
    this.console.log(...args);
  }
  info(...args: unknown[]): void {
    this.console.info(...args);
  }
  warn(...args: unknown[]): void {
    this.console.warn(...args);
  }
  error(...args: unknown[]): void {
    this.console.error(...args);
  }

  capture(error: string | Error, severity?: ReportSeverity, tags?: ReportTags): void {
    this.console.error(error, severity, tags);
  }
}
