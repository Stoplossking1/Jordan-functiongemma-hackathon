import { type SupabaseClient } from '@supabase/supabase-js';

import { adminGetAssetsInfo } from './asset-db.ts';
import { type Database, type EntityType, type EntityV1, uuidstr } from './generated-db-types.ts';

/**
 * Checks if an entity with the given ID exists in the database.
 */
export async function checkEntityExists(supabaseClient: SupabaseClient<Database>, entityId: uuidstr): Promise<boolean> {
  const res = await supabaseClient.rpc('app:entity:exists', { entityId: entityId });

  if (res.error) {
    console.error('Error checking entity:', res.error);
    return false;
  }

  return res.data ?? false;
}

/**
 * Creates a new entity in the database using the current user's id.
 */
export async function createUserEntity(supabaseClient: SupabaseClient<Database>): Promise<boolean> {
  try {
    const res = await supabaseClient.rpc('app:entity:user:create');

    if (res.error) {
      console.error('Error creating entity:', res.error);
      return false;
    }

    return res.data;
  } catch (error) {
    console.error('Error creating entity:', error);
    return false;
  }
}

/**
 * Updates the current user's entity data.
 * @param newEntityType - Optional new entity type
 * @param newName - Optional new name
 */
export async function updateUserEntity(
  supabaseClient: SupabaseClient<Database>,
  options: {
    newEntityType?: EntityType;
    newName?: string;
  },
): Promise<boolean> {
  try {
    const res = await supabaseClient.rpc('app:entity:user:update', {
      newEntityType: options.newEntityType,
      newName: options.newName,
    });

    if (res.error) {
      console.error('Error updating entity:', res.error);
      return false;
    }

    return res.data;
  } catch (error) {
    console.error('Error updating entity:', error);
    return false;
  }
}

/**
 * Reads the current user's entity data.
 */
export async function readUserEntity(supabaseClient: SupabaseClient<Database>): Promise<EntityV1 | undefined> {
  try {
    const res = await supabaseClient.rpc('app:entity:user:read');

    if (res.error) {
      console.error('Error reading user entity:', res.error);
      return undefined;
    }

    return res.data ?? undefined;
  } catch (error) {
    console.error('Error reading user entity:', error);
    return undefined;
  }
}

export async function checkAndCreateUserEntity(
  supabaseClient: SupabaseClient<Database>,
  sessionUserId: uuidstr,
): Promise<boolean> {
  try {
    const entityExists = await checkEntityExists(supabaseClient, sessionUserId);
    if (!entityExists) {
      const created = await createUserEntity(supabaseClient);

      return !!created;
    }

    return true;
  } catch (error) {
    console.error('Error in checkAndCreateUserEntity:', error);
    throw error;
  }
}

export async function adminGetUserByEmail(
  supabaseAdminClient: SupabaseClient<Database>,
  email: string,
): Promise<{ entityId: uuidstr; email: string } | undefined> {
  const res = await supabaseAdminClient.rpc('admin:entity:getByEmail', { userEmail: email });

  if (res.error) {
    throw res.error;
  }

  const entityData = res.data?.[0];

  if (!entityData) {
    return;
  }

  return { entityId: entityData.entityId, email: entityData.email };
}

export async function adminDeleteUserRelatedData(
  supabaseAdminClient: SupabaseClient<Database>,
  userId: uuidstr,
): Promise<Error | undefined> {
  // Delete other user-related data (org, profile, entity, etc.)
  const { error } = await supabaseAdminClient.rpc('admin:user:deleteRelatedData', { userId });
  if (error) {
    console.error('Failed to delete user-related data for user:', userId, error);
  }
  return error ?? undefined;
}

export async function adminDeleteUserRelatedAssets(
  supabaseAdminClient: SupabaseClient<Database>,
  userId: uuidstr,
): Promise<Error | undefined> {
  const { data: assets, error: assetsError } = await adminGetAssetsInfo(supabaseAdminClient, userId);
  if (assetsError) {
    return assetsError;
  }

  if (!assets?.length) {
    console.log('No user assets found');
  } else {
    // Group files by bucket
    const filesByBucket: Record<string, string[]> = {};

    for (const asset of assets) {
      if (asset.bucketId && asset.name) {
        if (!filesByBucket[asset.bucketId]) {
          filesByBucket[asset.bucketId] = [];
        }
        filesByBucket[asset.bucketId].push(asset.name);
      }
    }

    // Delete storage files from buckets
    for (const bucket in filesByBucket) {
      const fileNames = filesByBucket[bucket];
      const { error: deleteError } = await supabaseAdminClient.storage.from(bucket).remove(fileNames);

      if (deleteError) {
        return deleteError;
      }
    }
  }
  return;
}
