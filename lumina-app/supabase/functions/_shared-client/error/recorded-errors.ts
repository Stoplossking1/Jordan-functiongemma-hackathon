import { z } from 'zod';

// Unified log level schema for both console levels and severity
// We intentionally do NOT include the internal "capture" level here –
// that is reserved for internal reporters (e.g. Sentry) and should not
// appear in regular console-based recordings.
const LogLevelSchema = z.enum(['debug', 'log', 'info', 'warn', 'error']);

export const PostgresFrontendErrorSchema = z.object({
  code: z.string().optional(),
  message: z.string(),
  details: z.string().nullish(),
  hint: z.string().nullish(),
});

export const PostgresErrorLogSchema = z.looseObject({
  id: z.string().optional(),
  // Top-level timestamp in microseconds
  timestampMuSecs: z.number().optional(),
  // Timestamp from metadata (string format)
  timestamp: z.iso.datetime().optional(),
  projectId: z.string().optional(),
  eventMessage: z.string().optional(),
  // Fields from metadata object
  context: z.string().optional(),
  detail: z.string().optional(),
  errorSeverity: z.string().optional(),
  hint: z.string().optional(),
  internalQuery: z.string().optional(),
  internalQueryPos: z.number().int().optional(),
  location: z.string().optional(),
  query: z.string().optional(),
  queryId: z.string().optional(),
  queryPos: z.number().int().optional(),
  sessionId: z.string().optional(),
  sessionLineNum: z.number().int().optional(),
  sessionStartTime: z.string().optional(),
  sqlStateCode: z.string().optional(),
});

// Base schema with common fields for all recorded errors
const BaseRecordedErrorSchema = z.object({
  id: z.guid(),
  timestamp: z.iso.datetime(),
});

export const SupabaseRpcErrorSchema = z.strictObject({
  ...BaseRecordedErrorSchema.shape,
  type: z.literal('rpc'),
  function: z.string().optional(),
  args: z.unknown().optional(),
  frontendError: PostgresFrontendErrorSchema.optional(),
  loggedError: PostgresErrorLogSchema.optional(),
  callStack: z.string().optional(),
});

export const SupabaseStorageErrorSchema = z.strictObject({
  ...BaseRecordedErrorSchema.shape,
  type: z.literal('storage'),
  bucket: z.string().optional(),
  method: z.string().optional(),
  path: z.string().optional(),
  error: z.unknown().optional(),
  callStack: z.string().optional(),
});

export const SupabaseEdgeFunctionErrorSchema = z.strictObject({
  ...BaseRecordedErrorSchema.shape,
  type: z.literal('edgeFunction'),
  function: z.string().optional(),
  options: z.unknown().optional(),
  error: z.unknown().optional(),
  callStack: z.string().optional(),
});

export const AppLogSchema = z.strictObject({
  ...BaseRecordedErrorSchema.shape,
  type: z.literal('appLog'),
  level: LogLevelSchema,
  args: z.array(z.unknown()),
  message: z.string().optional(),
});

export const AppErrorSchema = z.strictObject({
  ...BaseRecordedErrorSchema.shape,
  type: z.literal('appError'),
  message: z.string(),
  callStack: z.string().optional(),
});

export const RecordedErrorSchema = z.discriminatedUnion('type', [
  SupabaseRpcErrorSchema,
  SupabaseStorageErrorSchema,
  SupabaseEdgeFunctionErrorSchema,
  AppLogSchema,
  AppErrorSchema,
]);

// Type exports
export type FrontendError = z.infer<typeof PostgresFrontendErrorSchema>;
export type SupabaseErrorLog = z.infer<typeof PostgresErrorLogSchema>;
export type SupabaseRpcError = z.infer<typeof SupabaseRpcErrorSchema>;
export type SupabaseStorageError = z.infer<typeof SupabaseStorageErrorSchema>;
export type SupabaseEdgeFunctionError = z.infer<typeof SupabaseEdgeFunctionErrorSchema>;
export type AppLog = z.infer<typeof AppLogSchema>;
export type AppError = z.infer<typeof AppErrorSchema>;
export type RecordedError = z.infer<typeof RecordedErrorSchema>;
