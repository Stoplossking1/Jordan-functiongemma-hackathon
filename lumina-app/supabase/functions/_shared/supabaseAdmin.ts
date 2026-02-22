import { createClient } from '@supabase/supabase-js';
import { type Database } from '../_shared-client/generated-db-types.ts';
import { config } from '../_shared/config.ts';

// Supabase client with SERVICE_ROLE key.
export const supabaseAdminClient = createClient<Database>(config.supabase.url, config.supabase.serviceRoleKey);
