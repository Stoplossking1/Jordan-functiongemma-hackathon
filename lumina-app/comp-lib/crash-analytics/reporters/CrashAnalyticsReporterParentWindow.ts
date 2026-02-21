import * as Crypto from 'expo-crypto';

import { sendMessageToParent } from '@/comp-lib/navigation/utils';
import type { CrashAnalyticsReporter, ReportSeverity, ReportTags } from '@shared/crash-analytics/types';
import type { RecordedError, AppLog } from '@shared/error/recorded-errors';
import { errorToJson } from '@shared/error/error-utils';

function stringifyArg(arg: unknown): string {
  if (arg instanceof Error) {
    return arg.stack ?? arg.message;
  }
  if (typeof arg === 'string') {
    return arg;
  }
  if (typeof arg === 'number' || typeof arg === 'boolean') {
    return String(arg);
  }
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

function buildMessageFromArgs(args: unknown[]): string {
  if (!args?.length) {
    return 'Unknown error';
  }
  return args.map(stringifyArg).join(' ');
}

export class CrashAnalyticsReporterParentWindow implements CrashAnalyticsReporter {
  /**
   * Prepares a RecordedError payload from console arguments and sends it to the parent window.
   * If args contain a RecordedError object (with type field), uses it directly.
   * Otherwise, creates an AppLog from the arguments.
   */
  private sendConsoleMessage(args: unknown[], level: 'debug' | 'log' | 'info' | 'warn' | 'error'): void {
    // Check if any arg is a RecordedError object (has type field)
    for (const arg of args) {
      if (arg && typeof arg === 'object' && 'type' in arg) {
        const type = (arg as { type: unknown }).type;
        // Check if it's a valid RecordedError type
        if (
          type === 'rpc' ||
          type === 'storage' ||
          type === 'edgeFunction' ||
          type === 'appError' ||
          type === 'appLog'
        ) {
          const payload = arg as RecordedError;
          // Extract timestamp and id from existing RecordedError
          const timestamp =
            'timestamp' in payload && typeof payload.timestamp === 'string'
              ? new Date(payload.timestamp).getTime()
              : Date.now();
          const id = 'id' in payload && typeof payload.id === 'string' ? payload.id : Crypto.randomUUID();

          sendMessageToParent({
            type: 'CONSOLE',
            level,
            payload,
            timestamp,
            id,
          });
          return;
        }
      }
    }

    // No RecordedError found in args, create AppLog
    const id = Crypto.randomUUID();
    const now = Date.now();
    const timestamp = new Date(now).toISOString();

    // If first arg is a string, use it as message and exclude it from args
    let message: string | undefined;
    let filteredArgs = args;
    if (args.length > 0 && typeof args[0] === 'string') {
      message = args[0];
      filteredArgs = args.slice(1);
    } else {
      message = buildMessageFromArgs(args);
    }

    // Convert Error objects in args to plain JSON objects to prevent DataCloneError
    const serializedArgs = filteredArgs.map((arg) => errorToJson(arg));

    const payload: AppLog = {
      type: 'appLog',
      id,
      timestamp,
      level,
      args: serializedArgs,
      message,
    };

    sendMessageToParent({
      type: 'CONSOLE',
      level,
      payload,
      timestamp: now,
      id,
    });
  }

  debug(...args: unknown[]): void {
    this.sendConsoleMessage(args, 'debug');
  }

  log(...args: unknown[]): void {
    this.sendConsoleMessage(args, 'log');
  }

  info(...args: unknown[]): void {
    this.sendConsoleMessage(args, 'info');
  }

  warn(...args: unknown[]): void {
    this.sendConsoleMessage(args, 'warn');
  }

  error(...args: unknown[]): void {
    this.sendConsoleMessage(args, 'error');
  }

  /**
   * @deprecated Use error() method with AppError type instead
   */
  capture(error: unknown, severity?: ReportSeverity, tags?: ReportTags): void {
    this.sendConsoleMessage([error], 'error');
  }
}
