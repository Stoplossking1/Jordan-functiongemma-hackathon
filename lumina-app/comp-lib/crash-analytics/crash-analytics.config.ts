export interface CrashAnalyticsConfig {
  sentryDsn: string;
  consoleEnabled: boolean;
  consolePatchEnabled: boolean;
  parentWindowEnabled: boolean;
}

// Parse boolean environment variables with safe defaults
function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (value === 'true') {
    return true;
  } else if (value === 'false') {
    return false;
  }
  return defaultValue;
}

export const crashAnalyticsConfig: CrashAnalyticsConfig = {
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
  consoleEnabled: parseBooleanEnv(process.env.EXPO_PUBLIC_CRASH_ANALYTICS_CONSOLE_ENABLED, false),
  consolePatchEnabled: parseBooleanEnv(process.env.EXPO_PUBLIC_CRASH_ANALYTICS_CONSOLE_PATCH_ENABLED, false),
  parentWindowEnabled: parseBooleanEnv(process.env.EXPO_PUBLIC_CRASH_ANALYTICS_PARENT_WINDOW_ENABLED, false),
};
