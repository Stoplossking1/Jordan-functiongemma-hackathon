import type {
  CrashAnalytics,
  CrashAnalyticsReporter,
  CrashAnalyticsReporterRegistry,
  ReportSeverity,
  ReportTags,
} from './types.ts';

export class CrashAnalyticsService implements CrashAnalytics {
  private reporterRegistry: CrashAnalyticsReporterRegistry;

  constructor(reporterRegistry: CrashAnalyticsReporterRegistry) {
    this.reporterRegistry = reporterRegistry;
  }

  debug(...args: unknown[]): void {
    this.forReporterOfRegistry((reporter) => reporter.debug(...args));
  }
  log(...args: unknown[]): void {
    this.forReporterOfRegistry((reporter) => reporter.log(...args));
  }
  info(...args: unknown[]): void {
    this.forReporterOfRegistry((reporter) => reporter.info(...args));
  }
  warn(...args: unknown[]): void {
    this.forReporterOfRegistry((reporter) => reporter.warn(...args));
  }
  error(...args: unknown[]): void {
    this.forReporterOfRegistry((reporter) => reporter.error(...args));
  }

  captureError(error: unknown, severity: ReportSeverity = 'error', tags?: ReportTags): void {
    // Normalize error input similar to console methods
    let message: string;
    if (Array.isArray(error)) {
      message = error.map((arg) => (arg instanceof Error ? (arg.stack ?? arg.message) : String(arg))).join(' ');
    } else if (error instanceof Error) {
      message = error.stack ?? error.message;
    } else {
      message = String(error);
    }

    this.forReporterOfRegistry((reporter) => {
      reporter.capture(message, severity, tags);
    });
  }

  private forReporterOfRegistry(callback: (reporter: CrashAnalyticsReporter) => void): void {
    for (const reporter of this.reporterRegistry.getReporters()) {
      try {
        callback(reporter);
      } catch (_ex) {
        // Swallow errors from reporters to avoid cascading failures
      }
    }
  }
}
