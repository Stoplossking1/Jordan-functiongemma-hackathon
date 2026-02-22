import { type SupabaseConfig } from '@shared/SupabaseConfig';
import { toUrlStr } from './supabase/functions/_shared-client/generated-db-types';

if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL is required');
}

if (!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY is required');
}

export const supabaseConfig: SupabaseConfig = {
  // App Throws if these are not defined, so we can safely cast
  url: toUrlStr(process.env.EXPO_PUBLIC_SUPABASE_URL),
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  authFlowType: getAuthFlowType(),
  authDetectSessionInUrl: getAuthDetectSessionInUrl(),
};

// Parse the environment variable for authFlowType or return undefined, allowing the consumer to set a default value.
function getAuthFlowType(): 'implicit' | 'pkce' | undefined {
  const flowType = process.env.EXPO_PUBLIC_SUPABASE_AUTH_FLOW_TYPE;
  if (flowType === 'implicit') {
    return 'implicit';
  } else if (flowType === 'pkce') {
    return 'pkce';
  }
  return undefined;
}

// Parse the environment variable for authDetectSessionInUrl or return undefined, allowing the consumer to set a default value.
function getAuthDetectSessionInUrl(): boolean | undefined {
  const detectSessionInUrl = process.env.EXPO_PUBLIC_SUPABASE_AUTH_DETECT_SESSION_IN_URL;
  if (detectSessionInUrl === 'true') {
    return true;
  } else if (detectSessionInUrl === 'false') {
    return false;
  }
  return undefined;
}

export const INSPECTOR_ENABLED: boolean = process.env.EXPO_PUBLIC_INSPECTOR_ENABLED === 'true';

// process.env.LOG_DIR
