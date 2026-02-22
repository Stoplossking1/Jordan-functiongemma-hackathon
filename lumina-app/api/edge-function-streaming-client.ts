import { type FunctionsResponse } from '@supabase/functions-js';
import { SupabaseClient } from '@supabase/supabase-js';

import {
  type InferReturns,
  type RouteSchema,
  type RoutesDefinition,
  type SSE,
  type SseStream,
  getStreamTypeFromSchema,
} from '@shared/api-client/api-schema-types';
import { type InvokeArgs, edgeFunctionInvoke } from '@shared/api-client/edge-function-client.ts';
import type { Database } from '@shared/generated-db-types';
import { EventStream } from './event-stream/streaming.ts';

/**
 * Transform return type to use EventStream for SSE streams on the client
 */
type ClientStreamReturns<T extends RouteSchema> =
  InferReturns<T> extends SseStream<infer Item>
    ? EventStream<SSE<Item>>
    : InferReturns<T> extends SseStream<infer Item> | infer Other
      ? EventStream<SSE<Item>> | Other
      : InferReturns<T>;

/**
 * Invoke a Supabase edge function that may return an SSE stream.
 * Automatically wraps stream responses in EventStream for client consumption.
 *
 * @example
 * ```ts
 * const result = await edgeFunctionInvokeWithStream(
 *   supabaseClient,
 *   ConversationLlmRoutes,
 *   'postMessageToBot',
 *   {
 *     body: { botEntityId: '...', useOutputStream: true },
 *     abortController,
 *   }
 * );
 *
 * if (isEventStream(result)) {
 *   for await (const event of result) {
 *     console.log(event.data);
 *   }
 * }
 * ```
 */
export async function edgeFunctionInvokeWithStream<T extends RoutesDefinition, K extends keyof T & string>(
  supabaseClient: SupabaseClient<Database>,
  routes: T,
  actionName: K,
  ...args: InvokeArgs<T[K]>
): Promise<FunctionsResponse<ClientStreamReturns<T[K]>>> {
  // Call the base invoke function
  const res = await edgeFunctionInvoke(supabaseClient, routes, actionName, ...args);

  // Check if the schema expects a stream response
  const schema = routes[actionName];
  const streamType = getStreamTypeFromSchema(schema.returns);

  // Handle SSE stream responses
  if (res.data && streamType === 'sse') {
    const [params] = args;
    const eventStream = EventStream.getEventStream(res.data, params?.abortController);
    if (eventStream) {
      return { ...res, data: eventStream as ClientStreamReturns<T[K]> };
    }
  }

  return { ...res, data: res.data as ClientStreamReturns<T[K]> };
}
/**
 * Helper to check if a result is an EventStream
 */
export function isEventStream<T>(value: unknown): value is EventStream<T> {
  return value instanceof EventStream;
}
