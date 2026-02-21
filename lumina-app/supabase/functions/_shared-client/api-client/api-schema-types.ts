import { z } from 'zod';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Path must start with /
 */
export type RoutePath = `/${string}`;

/**
 * Server-Sent Event wrapper type for streaming responses.
 */
export type SSE<Item> = {
  /** A string identifying the type of event described */
  event?: string;
  /** The event data */
  data: Item;
};

/**
 * Unique symbols for stream type branding
 */
declare const SseStreamBrand: unique symbol;
declare const NdjsonStreamBrand: unique symbol;
declare const BinaryStreamBrand: unique symbol;

/**
 * Generic stream marker type for any streaming response.
 * The generic parameter represents the logical item type being streamed.
 */
export type TypedReadableStream<Item = unknown> = ReadableStream<Uint8Array> & {
  readonly __streamItemType?: Item;
};

/**
 * Marker type for SSE streams in route definitions.
 * The generic parameter represents the item type being streamed (wrapped in SSE events).
 */
export type SseStream<Item> = TypedReadableStream<Item> & { readonly [SseStreamBrand]: Item };

/**
 * Marker type for NDJSON (newline-delimited JSON) streams.
 */
export type NdjsonStream<Item> = TypedReadableStream<Item> & { readonly [NdjsonStreamBrand]: Item };

/**
 * Marker type for binary/octet streams.
 */
export type BinaryStream = TypedReadableStream<Uint8Array> & { readonly [BinaryStreamBrand]: true };

/**
 * Stream content type identifiers
 */
export type StreamType = 'sse' | 'ndjson' | 'binary';

/**
 * Map stream type to content type
 */
export const streamContentTypes: Record<StreamType, string> = {
  sse: 'text/event-stream',
  ndjson: 'application/x-ndjson',
  binary: 'application/octet-stream',
};

/**
 * Zod schema with embedded stream type metadata
 */
export type StreamSchema<T, S extends StreamType> = z.ZodType<T> & { readonly _streamType: S };

/**
 * Helper to create an SSE stream schema with embedded metadata
 */
export function sseStream<T>(): StreamSchema<SseStream<T>, 'sse'> {
  return Object.assign(z.custom<SseStream<T>>(), { _streamType: 'sse' as const });
}

/**
 * Helper to create an NDJSON stream schema with embedded metadata
 */
export function ndjsonStream<T>(): StreamSchema<NdjsonStream<T>, 'ndjson'> {
  return Object.assign(z.custom<NdjsonStream<T>>(), { _streamType: 'ndjson' as const });
}

/**
 * Helper to create a binary stream schema with embedded metadata
 */
export function binaryStream(): StreamSchema<BinaryStream, 'binary'> {
  return Object.assign(z.custom<BinaryStream>(), { _streamType: 'binary' as const });
}

/**
 * Extract the item type from any Stream type.
 */
export type ReadableStreamItem<T> = T extends TypedReadableStream<infer Item> ? Item : never;

/**
 * Type guard to check if a schema has a stream type
 */
function isStreamSchema(schema: z.ZodType): schema is StreamSchema<unknown, StreamType> {
  return '_streamType' in schema && typeof schema._streamType === 'string';
}

/**
 * Extract stream type from a Zod schema (checks schema and union options)
 */
export function getStreamTypeFromSchema(schema: z.ZodType): StreamType | undefined {
  if (isStreamSchema(schema)) {
    return schema._streamType;
  }

  // Check if it's a union schema with options
  const def = schema._zod.def;
  if (def.type === 'union' && 'options' in def) {
    const options = def.options as z.ZodType[];
    for (const option of options) {
      if (isStreamSchema(option)) {
        return option._streamType;
      }
    }
  }

  return undefined;
}

/**
 * Type constraint for a single route definition.
 */
export type RouteSchema = {
  method: HttpMethod | HttpMethod[];
  path: RoutePath;
  pathParams?: z.ZodTypeAny;
  queryParams?: z.ZodTypeAny;
  headers?: z.ZodTypeAny;
  body?: z.ZodTypeAny;
  returns: z.ZodTypeAny;
};

export type RoutesDefinition = Record<string, RouteSchema>;

// Type inference helpers
export type InferBody<T extends RouteSchema> = T['body'] extends z.ZodTypeAny ? z.infer<T['body']> : undefined;
export type InferPathParams<T extends RouteSchema> = T['pathParams'] extends z.ZodTypeAny
  ? z.infer<T['pathParams']>
  : undefined;
export type InferQueryParams<T extends RouteSchema> = T['queryParams'] extends z.ZodTypeAny
  ? z.infer<T['queryParams']>
  : undefined;
export type InferReturns<T extends RouteSchema> = z.infer<T['returns']>;
