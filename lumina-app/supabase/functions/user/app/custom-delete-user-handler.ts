/**
 * App Specific Deletion of user related data during delete account. Executed before the common related data deletion.
 * @todo AUTO-GENERATED INITIAL VERSION - Generic implementation that can be customized
 */

import { type SupabaseClient, type User } from '@supabase/supabase-js';

import { type Database } from '../../_shared-client/generated-db-types.ts';

export async function customDeleteUserHandler(
  supabaseAdminClient: SupabaseClient<Database>,
  user: User,
): Promise<void> {
  // Add any custom cleanup logic here
}
