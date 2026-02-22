import { SupabaseClient } from '@supabase/supabase-js';

import { uuidstr } from './generated-db-types.ts';

export async function uuidFromTimestamp(
  supabaseClient: SupabaseClient,
  ts?: string,
  exampleUuid?: uuidstr,
): Promise<uuidstr> {
  const uuid = await supabaseClient.rpc('uuid_from_timestamp', {
    ts,
    uuid: exampleUuid,
  });
  return uuid.data;
}
