import { SupabaseClient } from '@supabase/supabase-js';
import { fetch as expoFetch } from 'expo/fetch';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import * as Crypto from 'expo-crypto';

import { type Database } from '@shared/generated-db-types';
import type {
  FrontendError,
  SupabaseEdgeFunctionError,
  SupabaseRpcError,
  SupabaseStorageError,
} from '@shared/error/recorded-errors';
import { errorToJson } from '@shared/error/error-utils';

type SupabaseClientMiddlewareFunc = (client: SupabaseClient<Database>) => SupabaseClient<Database>;

export function applyMiddleware(
  client: SupabaseClient<Database>,
  middlewares: SupabaseClientMiddlewareFunc[],
): SupabaseClient<Database> {
  for (const middleware of middlewares) {
    client = middleware(client);
  }
  return client;
}

/**
 * Expo fetch wrapper for React Native environments that uses expo-fetch instead of global fetch
 * Wraps expo fetch API into the global fetch API so supbase can  call it like the built in fetch method in React Native
 */
export async function expoFetchWrapper(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url: string;
  const requestInit: any = init ? { ...init } : {};

  if (typeof input === 'string') {
    url = input;
  } else if (input instanceof URL) {
    url = input.toString();
  } else if (input && typeof input === 'object' && 'url' in input) {
    // Handle Request object
    const request = input;
    url = request.url;

    // Merge Request properties with init if not provided
  } else {
    throw new Error('Unsupported input type for fetch');
  }
  try {
    const expoResponse = await expoFetch(url, requestInit);

    let textCache: string | undefined;

    const getText = () => {
      if (textCache != null) {
        return textCache;
      }
      // Handle different response body types
      if (typeof expoResponse.body === 'string') {
        textCache = expoResponse.body;
      } else if (expoResponse.body != null) {
        textCache = JSON.stringify(expoResponse.body);
      } else {
        textCache = '';
      }
      return textCache;
    };

    if (!expoResponse.text) {
      expoResponse.text = async () => {
        return getText();
      };
    }

    if (!expoResponse.json) {
      expoResponse.json = async () => {
        const text = getText();
        return JSON.parse(text);
      };
    }

    if (!expoResponse.blob) {
      expoResponse.blob = async () => {
        const text = getText();
        // Create a blob from text
        return new Blob([text], { type: expoResponse.headers.get('Content-Type') ?? 'text/plain' });
      };
    }

    if (!expoResponse.arrayBuffer) {
      expoResponse.arrayBuffer = async () => {
        const text = getText();
        const buf = new ArrayBuffer(text.length);
        const bufView = new Uint8Array(buf);
        for (let i = 0, strLen = text.length; i < strLen; i++) {
          bufView[i] = text.charCodeAt(i);
        }
        return buf;
      };
    }

    if (!expoResponse.formData) {
      expoResponse.formData = async () => {
        throw new Error('formData() method not implemented in this fetch wrapper');
      };
    }

    // Now create an enhanced response object
    // We'll use TypeScript's type system to our advantage here
    const enhancedResponse = expoResponse as any;

    // Add the bytes method if it doesn't exist but is required by the Response type
    enhancedResponse.bytes ??= async function (): Promise<Uint8Array> {
      // In modern browsers, bytes() returns a Promise<Uint8Array>
      const text = getText();
      return new TextEncoder().encode(text);
    };

    // Return the enhanced response with the correct type
    return enhancedResponse satisfies Response;
  } catch (e) {
    console.log('Error in supabase-client expo fetch wrapper: ', e);
    throw e;
  }
}

export function patchRpcForLogging(supabaseClient: SupabaseClient<Database>): SupabaseClient<Database> {
  const originalRpc = supabaseClient.rpc.bind(supabaseClient);

  // We use any here to avoid complex typing for the rpc method, supabase itself has a complex inline type
  // that would be cumbersome and fragile to replicate here, instead we just pass through all args.
  supabaseClient.rpc = function (...args): any {
    const result = originalRpc(...args);
    return result.then((res) => {
      if (res.error) {
        // Supabase RPC errors have the structure: { code?: string, message: string, details?: string | null, hint?: string | null }
        // This matches PostgresFrontendErrorSchema, so we extract it as frontendError
        const frontendError: FrontendError | undefined =
          res.error && typeof res.error === 'object' && 'message' in res.error
            ? {
                code: res.error.code,
                message: res.error.message,
                details: res.error.details ?? undefined,
                hint: res.error.hint ?? undefined,
              }
            : undefined;

        console.error('Supabase RPC Error:', {
          id: Crypto.randomUUID(),
          type: 'rpc',
          timestamp: new Date().toISOString(),
          function: args?.[0] ? String(args[0]) : undefined,
          args: args?.[1],
          frontendError,
          callStack: new Error().stack,
        } as SupabaseRpcError);
      }
      return res;
    });
  };

  return supabaseClient;
}

export function patchStorageForLogging(supabaseClient: SupabaseClient<Database>): SupabaseClient<Database> {
  const originalFrom = supabaseClient.storage.from.bind(supabaseClient.storage);

  supabaseClient.storage.from = function (bucketId: string): any {
    const fileApi = originalFrom(bucketId);

    // Return a Proxy that intercepts all method calls
    return new Proxy(fileApi, {
      get(target, prop, receiver): any {
        const originalValue = Reflect.get(target, prop, receiver);

        // Only intercept function calls
        if (typeof originalValue !== 'function') {
          return originalValue;
        }

        // Return a wrapped version of the function
        return function (...args: any[]): any {
          try {
            // To get the result of the original method, we need to call inside our proxy so we can catch both sync and async errors
            const result = originalValue.apply(target, args);

            // If not a promise, return as-is
            if (!result?.then) {
              return result;
            }

            // Wrap the promise to add error logging
            return result
              .then((res: any) => {
                if (res?.error) {
                  try {
                    console.error('Supabase Storage Error:', {
                      type: 'storage',
                      id: Crypto.randomUUID(),
                      timestamp: new Date().toISOString(),
                      bucket: bucketId,
                      method: String(prop),
                      path: args[0] ?? undefined,
                      error: errorToJson(res.error),
                      callStack: new Error().stack, // Response error is not a throw, so capture stack here
                    } as SupabaseStorageError);
                  } catch (loggingError) {
                    // Silently ignore logging errors
                  }
                }
                return res;
              })
              .catch((error: any) => {
                try {
                  console.error('Supabase Storage Promise Rejection:', {
                    type: 'storage',
                    id: Crypto.randomUUID(),
                    timestamp: new Date().toISOString(),
                    bucket: bucketId,
                    method: String(prop),
                    path: args[0] ?? undefined,
                    error: errorToJson(error),
                    callStack: error.stack ?? new Error().stack, // Use existing stack if available, else capture new
                  } as SupabaseStorageError);
                } catch (loggingError) {
                  // Silently ignore logging errors
                }
                throw error;
              });
          } catch (error: any) {
            try {
              console.error('Supabase Storage Synchronous Error:', {
                type: 'storage',
                id: Crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                bucket: bucketId,
                method: String(prop),
                path: args[0] ?? undefined,
                error: errorToJson(error),
                callStack: error.stack ?? new Error().stack, // Use existing stack if available, else capture new
              } as SupabaseStorageError);
            } catch (loggingError) {
              // Silently ignore
            }
            throw error;
          }
        };
      },
    });
  };

  return supabaseClient;
}

export function patchFunctionsForLogging(supabaseClient: SupabaseClient<Database>): SupabaseClient<Database> {
  const prototype = Object.getPrototypeOf(supabaseClient);
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'functions');

  if (!descriptor?.get) {
    return supabaseClient;
  }

  // Bind the getter immediately to avoid unbound-method warning
  const originalGetter = descriptor.get.bind(supabaseClient);

  // Override the getter to return a Proxy-wrapped functions client
  Object.defineProperty(supabaseClient, 'functions', {
    get(): any {
      const functionsClient = originalGetter();

      // Return a Proxy that intercepts method calls (same pattern as storage)
      return new Proxy(functionsClient, {
        get(target, prop, receiver): any {
          const originalValue = Reflect.get(target, prop, receiver);

          // Only intercept the invoke method
          if (prop !== 'invoke' || typeof originalValue !== 'function') {
            return originalValue;
          }

          // Return wrapped invoke function
          return async (functionName: string, options?: any): Promise<any> => {
            const result = await originalValue.call(target, functionName, options);

            if (result.error) {
              console.error('Supabase Edge Function Error:', {
                type: 'edgeFunction',
                id: Crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                function: functionName,
                options,
                error: errorToJson(result.error),
                callStack: new Error().stack, // Response error is not a throw, so capture stack here
              } as SupabaseEdgeFunctionError);
            }

            return result;
          };
        },
      });
    },
    configurable: true,
  });

  return supabaseClient;
}
