import { CrashAnalyticsReporterConsole } from '../../_shared-client/crash-analytics/reporters/CrashAnalyticsReporterConsole.ts';
import { CrashAnalyticsDefaultReporterRegistry } from '../../_shared-client/crash-analytics/CrashAnalyticsDefaultReporterRegistry.ts';
import { CrashAnalyticsService } from '../../_shared-client/crash-analytics/CrashAnalyticsService.ts';

const backendRegistry = new CrashAnalyticsDefaultReporterRegistry();
backendRegistry.registerReporter('console', new CrashAnalyticsReporterConsole());

// Dynamically load the Sentry reporter only when DSN is set
if (Deno.env.get('SENTRY_DSN')) {
  try {
    /*
     * The file may or may not be present depending on the crashAnalytics feature being enabled,
     * so we separate import statement from file path to avoid compilation errors
     */
    const modulePath = './reporters/CrashAnalyticsReporterSentryDeno.ts';
    const module = await import(modulePath);
    const reporterSentry = new module.CrashAnalyticsReporterSentryDeno();
    backendRegistry.registerReporter('sentry', reporterSentry);
  } catch (error) {
    console.error('Failed to load Sentry reporter:', error);
  }
}
export const crashAnalyticsBackend = new CrashAnalyticsService(backendRegistry);
