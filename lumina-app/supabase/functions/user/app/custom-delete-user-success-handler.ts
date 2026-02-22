/**
 * App Specific handler executed after user account deletion is successful.
 * @todo AUTO-GENERATED INITIAL VERSION - Generic implementation that can be customized
 */

import { type SupabaseClient, type User } from '@supabase/supabase-js';

import { type Database } from '../../_shared-client/generated-db-types.ts';

export async function customDeleteUserSuccessHandler(
  supabaseAdminClient: SupabaseClient<Database>,
  user: User,
  message?: string,
): Promise<void> {
  // Add any custom cleanup logic here
}
