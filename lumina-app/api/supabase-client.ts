import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { supabaseConfig } from '@/config';
import { LargeSecureStore } from '@/utils/LargeSecureStore';
import { type Database } from '@shared/generated-db-types';
import {
  applyMiddleware,
  expoFetchWrapper,
  patchFunctionsForLogging,
  patchRpcForLogging,
  patchStorageForLogging,
} from './supabase-client.middleware';

const isWeb = Platform.OS === 'web';
// https://github.com/supabase-community/create-t3-turbo/blob/main/apps/expo/src/utils/supabase.ts
// const ExpoSecureStoreAdapter = {
//   getItem: (key: string) => SecureStore.getItemAsync(key),
//   setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
//   removeItem: (key: string) => SecureStore.deleteItemAsync(key),
// };

// const storage = new LargeSecureStore();
// const storage = ExpoSecureStoreAdapter;
// const storage = AsyncStorage;

// on web we don't have support for secure storage, so just use local store
const storage = isWeb ? AsyncStorage : new LargeSecureStore();

/**
 * Initialize Supabase client with custom configuration
 *
 * This creates a Supabase client with authentication settings optimized for both
 * web and mobile platforms. The configuration includes:
 *
 * - Custom storage adapter based on platform (AsyncStorage for web, LargeSecureStore for native)
 * - OAuth authentication support with PKCE flow for enhanced security
 * - Automatic session detection from URL parameters after OAuth redirects
 * - Automatic token refresh for maintaining authenticated sessions
 * - Session persistence handling with platform-specific considerations
 *
 * The PKCE (Proof Key for Code Exchange) flow is used instead of implicit flow
 * as it's more secure and prevents certain types of attacks like authorization code interception.
 */
function createSupabaseClient(url: string, key: string): SupabaseClient<Database> {
  return createClient<Database>(url, key, {
    auth: {
      storage: storage,
      // flowType: Platform.OS !== 'web' || typeof window == "undefined" ? "pkce" : 'implicit',
      flowType: supabaseConfig.authFlowType ?? 'pkce', // Use PKCE flow for OAuth (more secure than implicit flow)
      detectSessionInUrl: supabaseConfig.authDetectSessionInUrl ?? true, // Extract session from URL after OAuth redirect
      autoRefreshToken: true,
      // https://github.com/orgs/supabase/discussions/25909
      // https://stackoverflow.com/questions/77225848/referenceerror-window-is-not-defined-in-react-native-project-after-adding-supab
      // https://www.reddit.com/r/reactjs/comments/17rghp0/asyncstorage_error_storing_data_referenceerror/
      // persistSession: true, // TODO -> this crashes on web with
      persistSession: typeof window !== 'undefined',
    },
    global: {
      fetch: isWeb ? fetch : expoFetchWrapper,
    },
  });
}

export const supabaseClient = applyMiddleware(createSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey), [
  patchRpcForLogging,
  patchStorageForLogging,
  patchFunctionsForLogging,
  // Add more middlewares here as needed
]);
