import { type urlstr } from './generated-db-types.ts';

export interface SupabaseConfig {
  // Supabase API URL - env var exported by default when deployed.
  // https://supabase.com/docs/guides/functions/secrets#default-secrets
  url: urlstr;
  anonKey: string;
  authFlowType?: 'pkce' | 'implicit';
  authDetectSessionInUrl?: boolean;
}
