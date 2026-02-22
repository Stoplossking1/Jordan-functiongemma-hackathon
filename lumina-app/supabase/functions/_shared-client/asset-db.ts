import { type PostgrestResponse, type Session, type SupabaseClient } from '@supabase/supabase-js';

import { toUrlStr, type AssetV1, type Database, type urlstr, type uuidstr } from './generated-db-types.ts';

// copied from supabase since it's not exposed there
export type FileBodyWithoutBuffer =
  | ArrayBuffer
  | ArrayBufferView
  | Blob
  // | Buffer is not available in Deno
  | File
  | FormData
  | NodeJS.ReadableStream
  | ReadableStream<Uint8Array>
  | URLSearchParams
  | string;

// defined here since supabase doesn't explicitely define it with name
export type UploadResult = {
  id: string;
  path: string;
  fullPath: string;
};

// defined here since supabase doesn't explicitely define it with name
type SignedUrl = {
  signedUrl: string;
};

// defined here since supabase doesn't explicitely define it with name
type BatchSignedUrl = {
  error: string | null;
  path: string | null;
  signedUrl: string;
};

export async function readUserAssets(supabaseClient: SupabaseClient<Database>): Promise<AssetV1[]> {
  const res = await supabaseClient.rpc('app:assets:user:read');

  if (res.error) {
    throw res.error;
  }

  return res.data ?? [];
}

export type AssetsInfo = { bucketId: string | null; name: string | null };

export async function adminGetAssetsInfo(
  supabaseAdminClient: SupabaseClient<Database>,
  userId: uuidstr,
): Promise<PostgrestResponse<AssetsInfo>> {
  const res = await adminGetAssets(supabaseAdminClient, userId);
  if (res.data) {
    const assetsInfo: AssetsInfo[] = [];
    for (const asset of res.data) {
      assetsInfo.push({ bucketId: asset.bucketId, name: asset.name });
    }
    return { ...res, data: assetsInfo, count: assetsInfo.length };
  }
  return res;
}

export async function adminGetAssets(
  supabaseAdminClient: SupabaseClient<Database>,
  userId: uuidstr,
): Promise<PostgrestResponse<AssetV1>> {
  return await supabaseAdminClient.rpc('admin:assets:user:read', { ownerId: userId });
}

// gets the non-public url that looks like this:
// https://ihfphrqatosdudftvpce.supabase.co/storage/v1/object/avatars/1728252111260.png
// the public version retrieved by `supabase.storage.from(bucket).getPublicUrl(filePath)` looks like this:
// https://ihfphrqatosdudftvpce.supabase.co/storage/v1/object/public/avatars/1728252111260.png
export function makeAssetUrl(supabaseUrl: urlstr, bucket: string, filePath: string): urlstr {
  return toUrlStr(`${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`);
}

// Get signed url to an asset in the private bucket
export async function createSignedAssetUrl(
  supabaseClient: SupabaseClient,
  bucket: string,
  path: string,
  expirationSecs: number,
): Promise<urlstr> {
  const res = await supabaseClient.storage.from(bucket).createSignedUrl(path, expirationSecs);

  if (res.error) {
    throw res.error;
  }

  // format is https://[project_id].supabase.co/storage/v1/object/authenticated/[bucket]/[asset-name]
  return toUrlStr(res.data.signedUrl);
}

export async function createSignedAssetUrlBatch(
  supabaseClient: SupabaseClient,
  bucket: string,
  paths: string[],
  expirationSecs: number,
): Promise<BatchSignedUrl[]> {
  const res = await supabaseClient.storage.from(bucket).createSignedUrls(paths, expirationSecs);

  if (res.error) {
    throw res.error;
  }
  const signRes: BatchSignedUrl[] = res.data;
  return signRes;
}

export function makePrivateAssetHeaders(supabaseAnonKey: string, session: Session): Record<string, string> {
  return session?.access_token
    ? {
        apikey: supabaseAnonKey,
        Authorization: 'Bearer ' + session.access_token,
      }
    : {};
}

export async function downloadAsset(supabaseClient: SupabaseClient, bucket: string, path: string): Promise<Blob> {
  const res = await supabaseClient.storage.from(bucket).download(path);

  if (res.error) {
    throw res.error;
  }
  return res.data;
}

// this function can be used to download a private image asset and apply it to an image as base64 url
// the image will be download honoring the cache since the image url does not get extended with a signature
export async function downloadAssetAsBase64Url(
  supabaseClient: SupabaseClient,
  bucket: string,
  path: string,
): Promise<urlstr> {
  const data = await downloadAsset(supabaseClient, bucket, path);

  return new Promise<urlstr>((resolve, reject) => {
    const fr = new FileReader();
    fr.readAsDataURL(data);
    fr.onload = function () {
      resolve(fr.result as urlstr);
    };
    fr.onerror = function () {
      reject(new Error('Failed to read file as data URL'));
    };
  });
}

export async function downloadAssetAsText(
  supabaseClient: SupabaseClient,
  bucket: string,
  path: string,
): Promise<string> {
  const data = await downloadAsset(supabaseClient, bucket, path);

  return new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.readAsText(data);
    fr.onload = function () {
      resolve(fr.result as string);
    };
    fr.onerror = function () {
      reject(new Error('Failed to read file as text'));
    };
  });
}

export async function downloadAssetAsArrayBuffer(
  supabaseClient: SupabaseClient,
  bucket: string,
  path: string,
): Promise<ArrayBuffer> {
  const data = await downloadAsset(supabaseClient, bucket, path);

  return new Promise<ArrayBuffer>((resolve, reject) => {
    const fr = new FileReader();
    fr.readAsArrayBuffer(data);
    fr.onload = function () {
      resolve(fr.result as ArrayBuffer);
    };
    fr.onerror = function () {
      reject(new Error('Failed to read file as array buffer'));
    };
  });
}

/**
 * Uploads binary data to Supabase storage
 *
 * @param supabaseClient The Supabase client
 * @param bucket The storage bucket name
 * @param filePath The file path within the bucket
 * @param data Binary data to upload (Uint8Array)
 * @param contentType MIME type of the content
 * @param upsert Whether to overwrite existing file (default: true)
 * @returns Promise that resolves to the public URL of the uploaded file
 */
export async function uploadAssetData(
  supabaseClient: SupabaseClient<Database>,
  bucket: string,
  filePath: string,
  data: Uint8Array,
  contentType: string,
  upsert = true,
): Promise<urlstr> {
  try {
    // Upload the binary data
    const res = await supabaseClient.storage.from(bucket).upload(filePath, data, {
      contentType,
      upsert,
    });

    if (res.error) {
      console.error(`Error uploading asset to storage (${bucket}/${filePath}):`, res.error);
      throw new Error(`Failed to upload asset: ${res.error.message}`);
    }

    console.debug(`Asset uploaded successfully to ${bucket}:`, res.data.path);

    // Get the public URL using our helper function
    const publicUrl = getAssetPublicUrl(supabaseClient, bucket, filePath);
    console.debug('Generated public URL:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error(`Error in uploadAssetData (${bucket}/${filePath}):`, error);
    throw error;
  }
}

/**
 * Gets the public URL for an existing asset
 *
 * @param supabaseClient The Supabase client
 * @param bucket The storage bucket name
 * @param filePath The file path within the bucket
 * @returns The public URL of the asset
 */
export function getAssetPublicUrl(supabaseClient: SupabaseClient<Database>, bucket: string, filePath: string): urlstr {
  const res = supabaseClient.storage.from(bucket).getPublicUrl(filePath);

  if (!res.data?.publicUrl) {
    throw new Error(`Failed to generate public URL for asset: ${bucket}/${filePath}`);
  }

  return toUrlStr(res.data.publicUrl);
}
