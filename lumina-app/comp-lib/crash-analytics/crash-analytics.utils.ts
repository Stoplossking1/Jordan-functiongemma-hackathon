import type { CrashAnalytics, OriginalConsoleMethods } from '@shared/crash-analytics/types';

// Tracks whether global console has been patched
let isPatched = false;

// Snapshot of original, unpatched console methods (bound to the console object)
const originalMethods: OriginalConsoleMethods = {
  debug: console.debug.bind(console),
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

/**
 * Patches the global console object to route all console calls through the crash analytics service.
 */
export function patchConsoleWithCrashAnalytics(crashAnalytics: CrashAnalytics): void {
  if (isPatched) {
    return;
  }

  // Patch console methods to route through crash analytics
  console.debug = function (...args: unknown[]): void {
    crashAnalytics.debug(...args);
  };

  console.log = function (...args: unknown[]): void {
    crashAnalytics.log(...args);
  };

  console.info = function (...args: unknown[]): void {
    crashAnalytics.info(...args);
  };

  console.warn = function (...args: unknown[]): void {
    crashAnalytics.warn(...args);
  };

  console.error = function (...args: unknown[]): void {
    crashAnalytics.error(...args);
  };

  isPatched = true;
}

/**
 * Restores the original console methods.
 * Useful for testing or debugging purposes.
 */
export function unpatchConsole(): void {
  if (!isPatched) {
    return;
  }

  console.debug = originalMethods.debug;
  console.log = originalMethods.log;
  console.info = originalMethods.info;
  console.warn = originalMethods.warn;
  console.error = originalMethods.error;

  isPatched = false;
}

/**
 * Returns the original console methods.
 * Useful when you need to bypass the crash analytics routing.
 */
export function getOriginalConsole(): OriginalConsoleMethods {
  return originalMethods;
}
