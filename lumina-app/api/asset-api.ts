// TODO: use these imports when the next expo release makes them available
//import { byteCountOverLimit, VALUE_BYTES_LIMIT } from 'expo-secure-store/byteCounter';
import { type Session, SupabaseClient } from '@supabase/supabase-js';
import { decode } from 'base64-arraybuffer';
import { type DocumentPickerAsset } from 'expo-document-picker';
import { type ImageSource } from 'expo-image';
import * as tus from 'tus-js-client';

import { supabaseConfig } from '@/config';
import { alert } from '@/utils/alert';
import { type FileBodyWithoutBuffer, makeAssetUrl, makePrivateAssetHeaders, type UploadResult } from '@shared/asset-db';
import { CONVERSATIONS_BUCKET } from '@shared/conversation-db';
import { toUuidStr, type Database, type urlstr, type uuidstr } from '@shared/generated-db-types';
import { AVATAR_BUCKET } from '@shared/profile-db';

/**
 * Interface representing an asset with properties needed for upload operations.
 * This decouples our API from specific libraries like expo-image-picker.
 */
export interface BaseImagePickerAsset {
  /**
   * The URI of the asset, which can be a local file path or a remote URL.
   */
  uri?: string;
  /**
   * The base64-encoded string representation of the asset.
   * Nullish values are required by interface consumers.
   */
  base64?: string | null;
  /**
   * The mime type of the asset, e.g., 'image/jpeg', 'video/mp4'.
   */
  mimeType?: string;
  /**
   * The file name of the asset, which can be used to determine the file extension.
   * Nullish values are required by interface consumers.
   */
  fileName?: string | null;
  /**
   * The type of the asset, which can be 'image', 'video', etc.
   */
  type?: string;
}

export const SOCIAL_FEED_BUCKET = 'social-feed';
const CONVERSATION_IMAGE_FILE_NAME = 'image';
const DEFAULT_IMAGE_FILE_EXTENSION = 'jpeg';
const DEFAULT_IMAGE_MIME_TYPE = 'image/jpeg';
const IMAGE_MIME_TYPE_PREFIX = 'image/';
const IMAGE_FILE_EXTENSION_PATTERN = /\.([a-zA-Z0-9]+)(?=([?#].*)?$)/;

const IMAGE_EXTENSION_TO_MIME_TYPE: Record<string, string> = {
  bmp: 'image/bmp',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const IMAGE_MIME_TYPE_TO_EXTENSION: Record<string, string> = {
  'image/bmp': 'bmp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export interface Bucket {
  id: string;
  name: string;
  owner: string;
  file_size_limit?: number;
  allowed_mime_types?: string[];
  created_at: string;
  updated_at: string;
  public: boolean;
}

export interface FileObject {
  name: string;
  bucket_id: string;
  owner: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
  buckets: Bucket;
}

export interface ConversationImageAssetUploadResult {
  objectId: uuidstr;
  path: string;
  mimeType: string;
}

export type StorageObjectListResponse =
  | {
      data: FileObject[];
      error: null;
    }
  | { data: null; error: Error };

// copied from supabase since it's not exposed there
export type FileBody = FileBodyWithoutBuffer | Buffer;

function sanitizeMimeType(mimeType?: string): string | undefined {
  const trimmedMimeType = mimeType?.trim().toLowerCase();
  return trimmedMimeType && trimmedMimeType.length > 0 ? trimmedMimeType : undefined;
}

function readImageFileExtension(imageUri: string): string | undefined {
  const match = IMAGE_FILE_EXTENSION_PATTERN.exec(imageUri.trim().toLowerCase());
  return match?.[1] ?? undefined;
}

function readImageMimeTypeFromUri(imageUri: string): string | undefined {
  const extension = readImageFileExtension(imageUri);
  if (extension == null) {
    return undefined;
  }
  return IMAGE_EXTENSION_TO_MIME_TYPE[extension];
}

function resolveImageMimeType(imageUri: string, blobMimeType?: string): string {
  const normalizedBlobMimeType = sanitizeMimeType(blobMimeType);
  if (normalizedBlobMimeType?.startsWith(IMAGE_MIME_TYPE_PREFIX)) {
    return normalizedBlobMimeType;
  }

  const uriMimeType = readImageMimeTypeFromUri(imageUri);
  if (uriMimeType != null) {
    return uriMimeType;
  }

  return DEFAULT_IMAGE_MIME_TYPE;
}

function resolveImageFileExtension(mimeType: string, imageUri: string): string {
  return IMAGE_MIME_TYPE_TO_EXTENSION[mimeType] ?? readImageFileExtension(imageUri) ?? DEFAULT_IMAGE_FILE_EXTENSION;
}

async function fetchImageBlob(imageUri: string): Promise<Blob> {
  const response = await fetch(imageUri);
  if (!response.ok) {
    throw new Error(`Failed to fetch image for upload. Status: ${response.status}`);
  }
  return await response.blob();
}

export async function uploadConversationMessageImageAsset(
  supabaseClient: SupabaseClient<Database>,
  conversationId: uuidstr,
  conversationMessageId: uuidstr,
  imageUri: string,
): Promise<ConversationImageAssetUploadResult> {
  const sanitizedImageUri = imageUri.trim();
  if (sanitizedImageUri.length === 0) {
    throw new Error('Image URI is required to upload a conversation image asset');
  }

  const imageBlob = await fetchImageBlob(sanitizedImageUri);
  const mimeType = resolveImageMimeType(sanitizedImageUri, imageBlob.type);
  if (!mimeType.startsWith(IMAGE_MIME_TYPE_PREFIX)) {
    throw new Error(`Unsupported image mimeType: ${mimeType}`);
  }

  const imageFileExtension = resolveImageFileExtension(mimeType, sanitizedImageUri);
  const filePath = `${conversationId}/${conversationMessageId}/${CONVERSATION_IMAGE_FILE_NAME}.${imageFileExtension}`;

  const uploadResult = await uploadPrivateAssetFromBuffer(
    supabaseClient,
    imageBlob,
    mimeType,
    CONVERSATIONS_BUCKET,
    filePath,
  );

  return {
    objectId: toUuidStr(uploadResult.id),
    path: uploadResult.path,
    mimeType,
  };
}

export async function uploadProfileImage(
  supabaseClient: SupabaseClient,
  userId: uuidstr,
  image: BaseImagePickerAsset,
  cacheExpirationSecs?: number,
): Promise<string | null> {
  //const filePath = `${userId}/${new Date().getTime()}.${image.type === 'image' ? 'png' : 'mp4'}`;
  const filePath = `${userId}/profile_${Date.now()}`;

  const res = await uploadPrivateImage(supabaseClient, image, AVATAR_BUCKET, filePath, cacheExpirationSecs);
  return res.path;
}

export async function uploadAvatarImage(
  supabaseClient: SupabaseClient,
  image: BaseImagePickerAsset,
  cacheExpirationSecs?: number,
): Promise<string> {
  // const fileExt = image.uri?.split('.').pop()?.toLowerCase() ?? 'jpeg'

  const fileExt = image.fileName?.split('.').pop()?.toLowerCase() ?? 'jpeg';
  const filePath = `${Date.now()}.${fileExt}`;
  const res = await uploadPrivateImage(supabaseClient, image, AVATAR_BUCKET, filePath, cacheExpirationSecs);
  return res.path;
}

export async function uploadPrivateImage(
  supabaseClient: SupabaseClient,
  image: BaseImagePickerAsset,
  bucket: string,
  filePath: string,
  cacheExpirationSecs?: number,
): Promise<UploadResult> {
  const contentType = image.mimeType;
  if (!contentType) {
    throw new Error('No image contentType');
  }

  let arrayBuffer;
  if (image.base64) {
    // Remove potential data URI prefix if it exists
    const base64Data = image.base64.includes('data:image') ? image.base64.split(',')[1] : image.base64; // ?? await FileSystem.readAsStringAsync(image.uri, { encoding: 'base64' });

    arrayBuffer = decode(base64Data);
  } else {
    throw new Error('No image base64 data');
  }
  //const contentType = image.type === 'image' ? 'image/png' : 'video/mp4';
  try {
    const res = await uploadPrivateAssetFromBuffer(
      supabaseClient,
      arrayBuffer,
      contentType,
      bucket,
      filePath,
      cacheExpirationSecs,
    );
    return res;
  } catch (e) {
    if (e instanceof Error) {
      alert(e.message);
    }
    throw e;
  }
}

export async function uploadPrivateDocument(
  supabaseClient: SupabaseClient,
  asset: DocumentPickerAsset,
  bucket: string,
  filePath: string,
  cacheExpirationSecs?: number,
): Promise<UploadResult> {
  const contentType = asset.mimeType;
  if (!contentType) {
    throw new Error('No asset contentType');
  }
  // TODO: do we need to check if this is a base64 uri or is it always of that format?
  // ALSO: should we use asset.file instead if present?
  const base64 = asset.uri;
  if (!base64) {
    throw new Error('No asset base64 data');
  }
  const arrayBuffer = decode(base64);

  try {
    const res = await uploadPrivateAssetFromBuffer(
      supabaseClient,
      arrayBuffer,
      contentType,
      bucket,
      filePath,
      cacheExpirationSecs,
    );
    return res;
  } catch (e) {
    if (e instanceof Error) {
      alert(e.message);
    }
    throw e;
  }
}

/**
 * Uploads a private asset from a buffer-like file body object.
 * For full list of supported file body types see: FileBody type.
 * @param supabaseClient The supabase client.
 * @param buffer The file body buffer-like object.
 * @param contentType The content type of the file.
 * @param bucket The bucket to upload the file to.
 * @param filePath The path to upload the file to.
 * @param cacheExpirationSecs Optional. The cache expiration time in seconds.
 * @returns The upload result from supabase.
 */
export async function uploadPrivateAssetFromBuffer(
  supabaseClient: SupabaseClient,
  buffer: FileBody,
  contentType: string,
  bucket: string,
  filePath: string,
  cacheExpirationSecs?: number,
): Promise<UploadResult> {
  const res = await supabaseClient.storage.from(bucket).upload(filePath, buffer, {
    cacheControl: cacheExpirationSecs ? cacheExpirationSecs.toString() : '3600',
    contentType: contentType,
    upsert: true,
    duplex: 'half',
  });

  if (res.error) {
    throw res.error;
  }

  return res.data;
}

// from https://supabase.com/docs/guides/storage/uploads/resumable-uploads
export async function uploadFile(
  bucket: string,
  filePath: string,
  file: File | Blob | Pick<ReadableStreamDefaultReader, 'read'>,
  contentType: string,
  cacheControl: string | undefined,
  session: Session,
): Promise<boolean> {
  // const { data: { session } } = await supabaseClient.auth.getSession()

  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `${supabaseConfig.url}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${session.access_token}`,
        'x-upsert': 'true', // optionally set upsert to true to overwrite existing files
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true, // Important if you want to allow re-uploading the same file https://github.com/tus/tus-js-client/blob/main/docs/api.md#removefingerprintonsuccess
      metadata: {
        bucketName: bucket,
        objectName: filePath,
        contentType: contentType, //'image/png',
        ...(cacheControl ? { cacheControl: cacheControl } : {}),
      },
      chunkSize: 6 * 1024 * 1024, // NOTE: it must be set to 6MB (for now) do not change it
      onError: function (error) {
        console.log(`Failed because: ${error.message}`);
        reject(error);
      },
      onProgress: function (bytesUploaded, bytesTotal) {
        const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
        console.log(bytesUploaded, bytesTotal, percentage + '%');
      },
      onSuccess: function () {
        console.log('Download %s from %s', filePath, upload.url);
        resolve(true);
      },
    });

    // Handle previous uploads asynchronously
    upload
      .findPreviousUploads()
      .then((previousUploads) => {
        // Found previous uploads so we select the first one.
        if (previousUploads.length) {
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }
        upload.start();
      })
      .catch(reject);
  });
}

export function getPrivateAssetUrl(bucket: string, filePath: string): urlstr {
  return makeAssetUrl(supabaseConfig.url, bucket, filePath);
}

// this function can be used to create an image source for a private image assets
// the image will be download honoring the cache since the image url does not get extended with a signature
// On web, this image source will only work when using Expo Images. The React Native image does not support using custom headers yet, see:
// https://github.com/necolas/react-native-web/pull/2442
// https://github.com/necolas/react-native-web/issues/1019
export function getPrivateImageSource(uri: string, session: Session): ImageSource {
  return { uri: uri, headers: getPrivateAssetHeaders(session) };
}

// Note: headers on the Image class in React Native are not supported on web until this PR is merged
// But Expo Image does support it
// https://github.com/necolas/react-native-web/pull/2442
// https://github.com/necolas/react-native-web/issues/1019
export function getPrivateAssetHeaders(session: Session): Record<string, string> {
  return makePrivateAssetHeaders(supabaseConfig.anonKey, session);
}

export async function getBucketContentsByLatestDatePaginated(
  bucket: string,
  supabaseClient: SupabaseClient,
  limit: number,
  offset: number,
): Promise<StorageObjectListResponse> {
  return await supabaseClient.storage.from(bucket).list('', {
    limit,
    offset,
    sortBy: { column: 'created_at', order: 'desc' },
    search: '',
  });
}

/**
 * Generates a unique file name by appending a counter to the original file name if it already exists in the list of existing names.
 * @param fileName The original file name.
 * @param existingNames An array of existing file names to check against.
 * @returns A unique file name.
 */
export function getUniqueFileName(fileName: string, existingNames: string[]): string {
  if (!existingNames.includes(fileName)) return fileName;

  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
  const extension = fileName.substring(fileName.lastIndexOf('.'));
  let counter = 1;
  let newName = `${nameWithoutExt}_(${counter})${extension}`;

  while (existingNames.includes(newName)) {
    counter++;
    newName = `${nameWithoutExt}_(${counter})${extension}`;
  }

  return newName;
}

/**
 * Sanitizes a file name by replacing spaces with underscores.
 * @param fileName The original file name.
 * @returns The sanitized file name.
 */
export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/\s+/g, '_');
}

export function getMimeTypeFromDataUrl(dataUrl: string): string {
  const regex = /data:([^;]+);/;
  const match = regex.exec(dataUrl);
  return match ? match[1] : 'application/octet-stream';
}
