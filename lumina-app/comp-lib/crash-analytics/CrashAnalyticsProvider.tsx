import type { ComponentType, PropsWithChildren, ReactNode } from 'react';

import { CrashAnalyticsDefaultReporterRegistry } from '@shared/crash-analytics/CrashAnalyticsDefaultReporterRegistry';
import { CrashAnalyticsService } from '@shared/crash-analytics/CrashAnalyticsService';
import { crashAnalyticsConfig } from './crash-analytics.config.ts';
import { getOriginalConsole, patchConsoleWithCrashAnalytics } from './crash-analytics.utils.ts';
import { CrashAnalyticsReporterConsole } from './reporters/CrashAnalyticsReporterConsole';
import { CrashAnalyticsReporterParentWindow } from './reporters/CrashAnalyticsReporterParentWindow';

export let CrashAnalyticsProvider: ComponentType<PropsWithChildren> = (props: PropsWithChildren): ReactNode => {
  return <>{props.children}</>;
};

const reporterRegistryFrontend = new CrashAnalyticsDefaultReporterRegistry();

// Conditionally register the console reporter based on config
if (crashAnalyticsConfig.consoleEnabled) {
  const consoleReporter = new CrashAnalyticsReporterConsole(
    crashAnalyticsConfig.consolePatchEnabled ? getOriginalConsole() : console,
  );
  reporterRegistryFrontend.registerReporter('console', consoleReporter);
}

// Conditionally register the parent window reporter for web environments based on config
// This will send console logs to the parent window via postMessage
if (crashAnalyticsConfig.parentWindowEnabled) {
  const parentWindowReporter = new CrashAnalyticsReporterParentWindow();
  reporterRegistryFrontend.registerReporter('parentWindow', parentWindowReporter);
}

// Dynamically load the Sentry reporter only when Sentry DSN is set
if (crashAnalyticsConfig.sentryDsn) {
  try {
    // We use require here because the metro bundler does not handle `import await` well in this context.
    const modulePath = './reporters/CrashAnalyticsReporterSentryReactNative';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const CrashAnalyticsReporterSentryRN = require(modulePath).default;
    const reporterSentry = new CrashAnalyticsReporterSentryRN();
    CrashAnalyticsProvider = reporterSentry.wrapRootComponent(CrashAnalyticsProvider);
    reporterRegistryFrontend.registerReporter('sentry', reporterSentry);
  } catch (error) {
    // Silently fail if the Sentry reporter module doesn't exist
    // This allows the app to continue working without Sentry integration
    console.warn('Sentry reporter module not found, continuing without Sentry integration:', error);
  }
}

export const crashAnalyticsFrontend = new CrashAnalyticsService(reporterRegistryFrontend);

// Patch the global console object to route all console calls through crash analytics
// This allows us to capture console logs from legacy AI-generated code
if (crashAnalyticsConfig.consolePatchEnabled) {
  patchConsoleWithCrashAnalytics(crashAnalyticsFrontend);
}
