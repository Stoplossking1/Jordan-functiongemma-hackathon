// import { type FunctionsResponse } from '@supabase/functions-js';
import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError, SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import type { Database } from '../generated-db-types.ts';
import type {
  HttpMethod,
  InferBody,
  InferPathParams,
  InferQueryParams,
  InferReturns,
  RouteSchema,
  RoutesDefinition,
} from './api-schema-types.ts';

/**
 * Replace path parameters (e.g., :id or {id}) with actual values
 */
function buildPath(pathTemplate: string, pathParams?: Record<string, string | number>): string {
  let path = pathTemplate;

  if (pathParams) {
    for (const [key, value] of Object.entries(pathParams)) {
      path = path.replace(`:${key}`, String(value));
      path = path.replace(`{${key}}`, String(value));
    }
  }
  return path;
}

/**
 * Build query string from params object
 */
function buildQueryString(queryParams?: Record<string, unknown>): string {
  if (!queryParams) return '';

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(queryParams)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (typeof value === 'string') {
      params.append(key, value);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      params.append(key, String(value));
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null) {
          params.append(key, typeof item === 'object' ? JSON.stringify(item) : String(item));
        }
      }
    } else if (typeof value === 'object') {
      params.append(key, JSON.stringify(value));
    }
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Build invoke options type based on what the schema requires
 */
type InvokeParams<T extends RouteSchema> = (T['body'] extends z.ZodTypeAny
  ? { body: InferBody<T> }
  : { body?: never }) &
  (T['pathParams'] extends z.ZodTypeAny ? { pathParams: InferPathParams<T> } : { pathParams?: never }) &
  (T['queryParams'] extends z.ZodTypeAny ? { queryParams: InferQueryParams<T> } : { queryParams?: never }) & {
    method?: HttpMethod;
    abortController?: AbortController;
  };

/**
 * Check if schema has any required params
 */
type HasRequiredParams<T extends RouteSchema> = T['body'] extends z.ZodTypeAny
  ? true
  : T['pathParams'] extends z.ZodTypeAny
    ? true
    : T['queryParams'] extends z.ZodTypeAny
      ? true
      : false;

export type InvokeArgs<T extends RouteSchema> =
  HasRequiredParams<T> extends true ? [params: InvokeParams<T>] : [params?: InvokeParams<T>];

export interface FunctionsResponseSuccess<T> {
  data: T;
  error: null;
  response?: Response;
}
export interface FunctionsResponseFailure {
  data: null;
  error: any;
  response?: Response;
}
export type FunctionsResponse<T> = FunctionsResponseSuccess<T> | FunctionsResponseFailure;

export function isStreamResponse(response: any, contentType?: string): response is Response {
  // Using expo/fetch for mobile we can't rely on `instanceof Response` here, so checking for headers and body.
  if ('body' in response) {
    if (contentType == null || ('headers' in response && response.headers.get('Content-Type') === contentType)) {
      if (
        response.body instanceof ReadableStream ||
        // extra checks when running in node.js
        response.body?.[Symbol.toStringTag] === 'ReadableStream' ||
        typeof response.body?.getReader === 'function'
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Invoke a Supabase edge function with full type safety based on route schema.
 *
 * @example
 * ```ts
 * const result = await edgeFunctionInvoke(
 *   supabaseClient,
 *   UserRoutes,
 *   'getUser',
 *   { pathParams: { id: '123' } }
 * );
 * ```
 */
export async function edgeFunctionInvoke<T extends RoutesDefinition, K extends keyof T & string>(
  supabaseClient: SupabaseClient<Database>,
  routes: T,
  actionName: K,
  ...args: InvokeArgs<T[K]>
): Promise<FunctionsResponse<InferReturns<T[K]>>> {
  const [params] = args;
  const schema = routes[actionName];

  // Determine HTTP method
  const method = params?.method ?? (Array.isArray(schema.method) ? schema.method[0] : schema.method);

  // Build the full function path
  const basePath = buildPath(schema.path, params?.pathParams as Record<string, string | number> | undefined);
  const queryString = buildQueryString(params?.queryParams as Record<string, unknown> | undefined);

  // Remove leading slash for Supabase functions.invoke
  const edgeBasePath = basePath.startsWith('/') ? basePath.slice(1) : basePath;
  const functionPath = `${edgeBasePath}${queryString}`;

  // Invoke the edge function
  const res = await supabaseClient.functions.invoke(functionPath, {
    method,
    body: params?.body as Record<string, unknown> | undefined,
    signal: params?.abortController?.signal,
  });

  // Handle errors
  if (res.error) {
    await updateFunctionsErrorMessage(res.error);
    return res;
  }

  // Validate response against schema but only if we are not streaming
  if (schema.returns && !isStreamResponse(res.data)) {
    const valResult = schema.returns.safeParse(res.data);
    if (!valResult.success) {
      return { data: null, error: valResult.error, response: res.response };
    }
  }

  return { data: res.data as InferReturns<T[K]>, error: null, response: res.response };
}

// Type for errors from Supabase functions
type FunctionsError = FunctionsHttpError | FunctionsRelayError | FunctionsFetchError;

// By default, a non-2xx call will result in a generic error message
// "FunctionsHttpError: Edge Function returned a non-2xx status code"
// This function extracts the specific error message and attaches it to the error
export async function updateFunctionsErrorMessage(error: FunctionsError) {
  if (error instanceof FunctionsHttpError) {
    // https://github.com/supabase/functions-js/issues/45
    try {
      const errorJson = await error.context.json();
      // when content is returned as text/plan use:
      // error.context.text();

      // on timeout, the object is just a string
      const errorMessage = typeof errorJson === 'string' ? errorJson : errorJson.error;
      error.message = errorMessage ?? error.message;
      console.error('Function returned an error', errorJson);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.log(`Parsing error message failed: ${message}`);
    }
  } else if (error instanceof FunctionsRelayError) {
    console.error('Relay error:', error.message);
  } else if (error instanceof FunctionsFetchError) {
    console.error('Fetch error:', error.message);
  }
}
