import { SupabaseClient } from '@supabase/supabase-js';

import {
  toUuidStr,
  type Database,
  type ProfileUpdateV1,
  type ProfileV1,
  type ProfileWithEmailV1,
} from './generated-db-types.ts';

export const ENTITY_SYSTEM = toUuidStr('00000000-0000-0000-0000-000000000000');
export const AVATAR_BUCKET = 'avatars';

export async function readProfile(supabaseClient: SupabaseClient<Database>): Promise<ProfileV1 | undefined> {
  const res = await supabaseClient.rpc('app:profile:user:read');
  if (res.error) {
    throw res.error;
  }

  return res.data;
}

export async function readProfileWithUser(
  supabaseClient: SupabaseClient<Database>,
): Promise<ProfileWithEmailV1 | undefined> {
  const res = await supabaseClient.rpc('app:profile:user:readWithEmail');

  if (res.error) throw res.error;

  return res.data;
}

export async function updateBasicProfile(
  supabase: SupabaseClient<Database>,
  username: string | undefined | null,
  fullName: string | undefined | null,
  avatarUrl: string | undefined | null,
): Promise<ProfileV1> {
  // will only update values that are not undefined
  const res = await supabase.rpc('app:profile:user:update', {
    avatarUrl,
    username,
    fullName,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data;
}

export async function updateProfileImage(supabase: SupabaseClient<Database>, avatarUrl?: string): Promise<ProfileV1> {
  return updateBasicProfile(supabase, undefined, undefined, avatarUrl);
}

export async function updateProfile(
  supabase: SupabaseClient<Database>,
  updateData: Partial<ProfileUpdateV1>,
): Promise<ProfileV1> {
  // will only update values that are not undefined
  const res = await supabase.rpc('app:profile:user:update', updateData);
  if (res.error) {
    throw res.error;
  }
  return res.data;
}
