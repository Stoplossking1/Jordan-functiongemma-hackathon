import { type LlmTokenizer } from './tokenizer/LlmTokenizer.ts';

// text format means we are loading an attachment, turning it into text and adding it as regular text content
export type LlmMessageAttachmentType = 'URL' | 'BINARY' | 'BASE64_URL' | 'TEXT';

export type ConfigDocumentType =
  | null
  | boolean
  | number
  | string
  | ConfigDocumentType[]
  | {
      [prop: string]: ConfigDocumentType;
    };

export interface LlmConfig {
  tokenizer: LlmTokenizer;
  // allow specifying additional model specific parameters which are handed from the provider to the model
  additionalRequestFields?: ConfigDocumentType;
  maxInputTokens: number;
  // account for models that have a large context size but fall apart/don't pay proper attention above a certain context size
  effectiveInputTokens?: number;
  maxOutputTokens?: number;
  knowledgeCutoff: string;
  // when attaching images, what formats are accepted
  supportsImageAttachments?: LlmMessageAttachmentType[];
  // when attaching text or other documents, what formats are accepted?
  supportsDocumentAttachments?: LlmMessageAttachmentType[];
  supportsSystemPrompts?: boolean;
  supportsDeveloperPrompts?: boolean;
  supportsStreaming?: boolean;
  supportsTools?: boolean; //   supportsFunctionCalling?: boolean;
  supportsStreamingTools?: boolean;
  supportsToolChoice?: boolean;
  supportsToolChoiceByName?: boolean;
  supportsTemperature?: boolean;

  supportsPromptCaching?: boolean;
  supportsResponseSchema?: boolean;

  inputCostPerToken?: number;
  inputCostPerTokenCacheHit?: number;
  outputCostPerToken?: number;

  // https://github.com/BerriAI/litellm/issues/4881
  // https://docs.litellm.ai/docs/completion/prefix
  // https://aider.chat/2024/07/01/sonnet-not-lazy.html
  // if true, we can make the LLM continue the previous assistent message,
  // in case it was ended early due to reaching maxOutputToken
  // this setting allows us to send an assistent message that will be continued
  supportsAssistantPrefill?: boolean;
  supportsVision?: boolean;
  supportsPdfInput?: boolean;
  maxPdfSizeMb?: number;

  supportsReasoning?: boolean;
  supportsComputerUse?: boolean;
}
