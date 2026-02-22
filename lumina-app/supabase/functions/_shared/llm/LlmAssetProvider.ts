import { OpenAI } from 'openai';

import { type ConversationMessageAssetWithObjectV1, type urlstr } from '../../_shared-client/generated-db-types.ts';
import { getOrAddArray } from '../../_shared-client/utils/map-utils.ts';
import { type ConversationContext, type LlmConversationMessage } from './llm-conversation.ts';
import { type LlmMessageAttachmentType } from './LlmConfig.ts';
import { LlmProvider } from './LlmProvider.ts';

export type LlmAssetType = 'IMAGE' | 'DOCUMENT';

export interface LLmAssetProviderEntry {
  assetType: LlmAssetType;
  attachmentType: LlmMessageAttachmentType;
  srcAsset: ConversationMessageAssetWithObjectV1;
  srcBucket: string;
  srcPath: string;
  srcUrl: urlstr;
  // includes base64 urls
  destUrl?: urlstr;
  destArrayBuffer?: ArrayBuffer;
  destText?: string;
}

export abstract class LlmAssetProvider {
  protected readonly assets = new Map<string, LLmAssetProviderEntry>();

  async addAssetsForConversation(
    llmProvider: LlmProvider,
    context: ConversationContext,
    expirationSecs: number,
  ): Promise<any> {
    const messages: LlmConversationMessage[] = [...context.prevMessages];
    if (context.requestMessage) {
      messages.push(context.requestMessage);
    }

    return this.addAssetsForMessages(llmProvider, messages, expirationSecs);
  }

  async addAssetsForMessages(
    llmProvider: LlmProvider,
    llmMessages: LlmConversationMessage[],
    expirationSecs: number,
  ): Promise<any> {
    const urlsToBatchSign = new Map<string, LLmAssetProviderEntry[]>();
    const loadBinary: LLmAssetProviderEntry[] = [];
    const loadBase64Url: LLmAssetProviderEntry[] = [];
    const loadText: LLmAssetProviderEntry[] = [];
    for (const message of llmMessages) {
      if (message.assets) {
        for (const asset of message.assets) {
          if (asset.mimeType && asset.bucketId && asset.name) {
            const imageAttachmentType = llmProvider.getImageAttachmentType(asset.mimeType);
            const documentAttachmentType = imageAttachmentType
              ? undefined
              : llmProvider.getDocumentAttachmentType(asset.mimeType);
            const attachmentType = imageAttachmentType ?? documentAttachmentType;
            const assetType: LlmAssetType | undefined = imageAttachmentType
              ? 'IMAGE'
              : documentAttachmentType
                ? 'DOCUMENT'
                : undefined;

            const url = this.makeAssetUrl(asset);
            if (url && attachmentType && assetType) {
              const assetEntry = {
                assetType: assetType,
                attachmentType: attachmentType,
                srcBucket: asset.bucketId,
                srcPath: asset.name,
                srcAsset: asset,
                srcUrl: url,
              };
              switch (attachmentType) {
                case 'URL':
                  getOrAddArray(urlsToBatchSign, asset.bucketId).push(assetEntry);
                  break;
                case 'BINARY':
                  loadBinary.push(assetEntry);
                  break;
                case 'BASE64_URL':
                  loadBase64Url.push(assetEntry);
                  break;
                case 'TEXT':
                  // TODO: load the document and manually convert it into text
                  loadText.push(assetEntry);
                  break;
                default:
                  console.warn(`Unsupported attachment type: ${attachmentType}`);
              }
            } else {
              console.warn(`Cannot create url for asset: ${asset.name}`);
            }
          }
        }
      }
    }

    // load all types in parallel
    const res = await Promise.all([
      this.batchSign(urlsToBatchSign, expirationSecs),
      this.batchLoadBinary(loadBinary),
      this.batchLoadBase64Url(loadBase64Url),
      this.batchLoadText(loadText),
    ]);
    return res;
  }

  protected abstract batchSign(
    urlsToBatchSign: Map<string, LLmAssetProviderEntry[]>,
    expirationSecs: number,
  ): Promise<any>;

  protected abstract batchLoadBinary(assetsToLoad: LLmAssetProviderEntry[]): Promise<any>;

  protected abstract batchLoadBase64Url(assetsToLoad: LLmAssetProviderEntry[]): Promise<any>;

  protected abstract batchLoadText(assetsToLoad: LLmAssetProviderEntry[]): Promise<any>;

  protected abstract makeAssetUrl(asset: ConversationMessageAssetWithObjectV1): urlstr | undefined;

  async makeContentPartsForAsset(
    assets: ConversationMessageAssetWithObjectV1[],
  ): Promise<OpenAI.ChatCompletionContentPart[]> {
    const res: OpenAI.ChatCompletionContentPart[] = [];
    for (const asset of assets) {
      const srcUrl = this.makeAssetUrl(asset);
      if (srcUrl) {
        const storedAsset = this.assets.get(srcUrl);
        if (storedAsset) {
          if (storedAsset.assetType === 'IMAGE') {
            res.push({ type: 'image_url', image_url: { url: srcUrl } });
          } else if (storedAsset.assetType === 'DOCUMENT') {
            console.warn(`TODO: add support for attaching Documents to an OpenAi request`);
          }
        } else {
          console.warn(`Skipping content, no asset entry for: ${srcUrl}`);
        }
      }
    }
    return res;
  }

  getAsset(url: string): LLmAssetProviderEntry | undefined {
    return this.assets.get(url);
  }

  adjustUrl(url: string): string {
    const asset = this.assets.get(url);
    return asset?.destUrl ?? url;
  }
}
