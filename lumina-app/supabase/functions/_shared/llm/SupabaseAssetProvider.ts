import { SupabaseClient } from '@supabase/supabase-js';

import {
  createSignedAssetUrlBatch,
  downloadAssetAsArrayBuffer,
  downloadAssetAsBase64Url,
  downloadAssetAsText,
  makeAssetUrl,
} from '../../_shared-client/asset-db.ts';
import {
  type ConversationMessageAssetWithObjectV1,
  toUrlStr,
  type urlstr,
} from '../../_shared-client/generated-db-types.ts';
import { config } from '../config.ts';
import { LlmAssetProvider, type LLmAssetProviderEntry } from './LlmAssetProvider.ts';

export class SupabaseAssetProvider extends LlmAssetProvider {
  constructor(
    private supabaseClient: SupabaseClient,
    private defaultSignedUrlExpirationSecs = 90,
  ) {
    super();
  }
  protected override async batchSign(
    urlsToBatchSign: Map<string, LLmAssetProviderEntry[]>,
    expirationSecs?: number,
  ): Promise<any> {
    // TODO: we could run this loop in parallel to speed this up a little
    for (const [bucket, assets] of urlsToBatchSign) {
      if (assets.length) {
        const srcPaths: string[] = [];
        for (const asset of assets) {
          srcPaths.push(asset.srcPath);
        }
        const signedRes = await createSignedAssetUrlBatch(
          this.supabaseClient,
          bucket,
          srcPaths,
          expirationSecs ?? this.defaultSignedUrlExpirationSecs,
        );

        for (const signed of signedRes) {
          const foundAsset = assets.find((asset) => asset.srcPath === signed.path);
          if (foundAsset == null || !signed.signedUrl || signed.error) {
            console.warn(`Cannot sign url: ${signed?.path ?? ''}. ${signed?.error ?? ''}`);
          } else {
            foundAsset.destUrl = toUrlStr(signed.signedUrl);
            this.assets.set(foundAsset.srcUrl, foundAsset);
          }
        }
      }
    }
  }

  protected override async batchLoadBinary(assetsToLoad: LLmAssetProviderEntry[]): Promise<any> {
    const promises: Promise<void>[] = [];
    for (const asset of assetsToLoad) {
      const promise = downloadAssetAsArrayBuffer(this.supabaseClient, asset.srcBucket, asset.srcPath).then((value) => {
        asset.destArrayBuffer = value;
        this.assets.set(asset.srcUrl, asset);
      });
      promises.push(promise);
    }
    return Promise.all(promises);
  }

  protected override async batchLoadBase64Url(assetsToLoad: LLmAssetProviderEntry[]): Promise<any> {
    const promises: Promise<void>[] = [];
    for (const asset of assetsToLoad) {
      const promise = downloadAssetAsBase64Url(this.supabaseClient, asset.srcBucket, asset.srcPath).then((value) => {
        asset.destUrl = value;
        this.assets.set(asset.srcUrl, asset);
      });
      promises.push(promise);
    }
    return Promise.all(promises);
  }

  protected override async batchLoadText(assetsToLoad: LLmAssetProviderEntry[]): Promise<any> {
    const promises: Promise<void>[] = [];
    for (const asset of assetsToLoad) {
      const promise = downloadAssetAsText(this.supabaseClient, asset.srcBucket, asset.srcPath).then((value) => {
        asset.destText = value;
        this.assets.set(asset.srcUrl, asset);
      });
      promises.push(promise);
    }
    return Promise.all(promises);
  }

  protected override makeAssetUrl(asset: ConversationMessageAssetWithObjectV1): urlstr | undefined {
    return asset.bucketId && asset.name ? makeAssetUrl(config.supabase.url, asset.bucketId, asset.name) : undefined;
  }
}
