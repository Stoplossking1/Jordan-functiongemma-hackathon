import { createClient, SupabaseClient, type User } from '@supabase/supabase-js';
import { type Database } from '../_shared-client/generated-db-types.ts';
import { config } from '../_shared/config.ts';

// export const supabaseClient = createClient<Database>(config.supabaseUrl, config.supabaseAnonKey
// export function makeClient<Database = any>(headers: Headers): SupabaseClient<Database> {
export function makeClient(headers: Headers): SupabaseClient<Database> {
  const authHeader = headers.get('Authorization');
  if (!authHeader) throw new Error('Authorization header is required');

  // Supabase client with ANON key.
  // https://supabase.com/docs/guides/functions/secrets#default-secrets
  return createClient<Database>(
    config.supabase.url,
    config.supabase.anonKey,
    // Create client with Auth context of the user that called the function.
    // This way your row-level-security (RLS) policies are applied.
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        //detectSessionInUrl: false,
      },
      global: {
        headers: { Authorization: authHeader },
      },
    },
  );
}

export function getJwtFromHeader(headers: Headers): string | undefined {
  const authHeader = headers?.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  return token;
}

// Get the session or user object
export async function fetchUser(headers: Headers, supabaseClient: SupabaseClient): Promise<User> {
  const token = getJwtFromHeader(headers);
  if (!token) {
    throw new Error('Authorization token missing');
  }
  const res = await supabaseClient.auth.getUser(token);
  if (res.error) {
    throw res.error;
  }
  const user = res.data.user;
  return user;
}
