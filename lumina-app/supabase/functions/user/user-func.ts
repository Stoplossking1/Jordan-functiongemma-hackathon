import { type SupabaseClient } from '@supabase/supabase-js';
import { type Database } from '../_shared-client/generated-db-types.ts';

export async function adminDeleteUserById(
  supabaseAdminClient: SupabaseClient<Database>,
  userId: string,
): Promise<Error | undefined> {
  const { error } = await supabaseAdminClient.auth.admin.deleteUser(userId);
  return error ?? undefined;
}
