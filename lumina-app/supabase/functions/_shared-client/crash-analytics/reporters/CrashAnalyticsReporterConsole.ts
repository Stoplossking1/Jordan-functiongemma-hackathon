import type { ReportSeverity, CrashAnalyticsReporter, ReportTags } from '../types.ts';

export class CrashAnalyticsReporterConsole implements CrashAnalyticsReporter {
  debug(...args: unknown[]): void {
    console.debug(...args);
  }
  log(...args: unknown[]): void {
    console.log(...args);
  }
  info(...args: unknown[]): void {
    console.info(...args);
  }
  warn(...args: unknown[]): void {
    console.warn(...args);
  }
  error(...args: unknown[]): void {
    console.error(...args);
  }

  capture(error: string | Error, severity?: ReportSeverity, tags?: ReportTags): void {
    console.error(error, severity, tags);
  }
}
