import { toUrlStr, urlstr } from '../generated-db-types.ts';

export function getSupabaseUrlFromProjectRef(projectRef: string): urlstr {
  return toUrlStr(`https://${projectRef}.supabase.co`);
}
