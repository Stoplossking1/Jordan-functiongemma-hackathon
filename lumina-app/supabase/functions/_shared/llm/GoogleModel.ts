import { type LlmProviderConfig, formatModelName, registerProviderConfig } from './LlmProviderConfig.ts';
import { type LlmConfig } from './LlmConfig.ts';
import { EstimationTokenizer } from './tokenizer/EstimationTokenizer.ts';

function makeConfig(maxInputTokens: number, maxOutputTokens: number, knowledgeCutoff: string): LlmConfig {
  return {
    // we assume that Google's tokenizer produces token counts in the same range as gpt-4o's.
    // tokenizer: new OpenAiTokenizer('gpt-4o'),
    tokenizer: new EstimationTokenizer(),
    maxInputTokens: maxInputTokens,
    maxOutputTokens: maxOutputTokens,
    knowledgeCutoff: knowledgeCutoff,
    supportsSystemPrompts: true,
    supportsStreaming: true,
    supportsTools: true,
    supportsStreamingTools: true,
    supportsToolChoice: true,
    supportsToolChoiceByName: true,
  };
}

type GoogleModel =
  | 'gemini-3.0-pro'
  | 'gemini-2.0-pro'
  | 'gemini-2.0-flash-thinking-exp'
  | 'gemini-2.0-flash'
  | 'gemini-2.0-flash-lite-preview'
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash';

const vertexaiModels = new Map<GoogleModel, LlmProviderConfig>();

function registerModel(model: GoogleModel, config: LlmConfig, vertexaiModelName: string, openaiModelName?: string) {
  const providerConfig: LlmProviderConfig = {
    providerType: 'vertexai',
    modelName: vertexaiModelName,
    config: config,
  };

  registerProviderConfig(formatModelName(providerConfig.providerType, model), providerConfig);
  vertexaiModels.set(model, providerConfig);

  if (openaiModelName) {
    const providerConfigOai: LlmProviderConfig = {
      providerType: 'vertexai-oai',
      modelName: openaiModelName,
      config: config,
    };

    registerProviderConfig(formatModelName(providerConfigOai.providerType, model), providerConfigOai);
  }
}

export function get(model: GoogleModel): string {
  return formatModelName('vertexai', model);
}

export function getOai(model: GoogleModel): string {
  return formatModelName('vertexai-oai', model);
}

// https://console.cloud.google.com/vertex-ai/publishers/google/model-garden/gemini-3-pro-preview
// https://ai.google.dev/gemini-api/docs/gemini-3
registerModel('gemini-3.0-pro', makeConfig(1_000_000, 64_000, 'Jan 2025'), 'gemini-3-pro-preview');

// https://console.cloud.google.com/vertex-ai/publishers/google/model-garden/gemini-2.0-pro-exp-02-05
registerModel('gemini-2.0-pro', makeConfig(2_097_152, 8_192, 'Jun 2024'), 'gemini-2.0-pro-exp-02-05');

// https://console.cloud.google.com/vertex-ai/publishers/google/model-garden/gemini-2.0-flash-thinking-exp-01-21
registerModel(
  'gemini-2.0-flash-thinking-exp',
  makeConfig(32_768, 8_192, 'Jun 2024'),
  'gemini-2.0-flash-thinking-exp-01-21',
);

// https://console.cloud.google.com/vertex-ai/publishers/google/model-garden/gemini-2.0-flash-001
registerModel('gemini-2.0-flash', makeConfig(1_048_576, 8_192, 'Jun 2024'), 'gemini-2.0-flash-001');

// https://console.cloud.google.com/vertex-ai/publishers/google/model-garden/gemini-2.0-flash-lite-preview-02-05
registerModel(
  'gemini-2.0-flash-lite-preview',
  makeConfig(1_048_576, 8_192, 'Jun 2024'),
  'gemini-2.0-flash-lite-preview-02-05',
);

// https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/call-vertex-using-openai-library#environment-variables
// https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstarts/quickstart-multimodal

// https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:streamGenerateContent
// https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:generateContent

// https://console.cloud.google.com/vertex-ai/publishers/google/model-garden/gemini-1.5-pro-002
// https://ai.google.dev/gemini-api/docs/models/gemini#gemini-1.5-pro
// https://cloud.google.com/vertex-ai/generative-ai/docs/learn/model-versions

registerModel(
  'gemini-1.5-pro',
  makeConfig(2_097_152, 8_192, 'Sep 2024'),
  'gemini-1.5-pro-002', // 'gemini-1.5-pro'
  'google/gemini-1.5-pro-002', // 'google/gemini-1.5-pro'
);

// https://console.cloud.google.com/vertex-ai/publishers/google/model-garden/gemini-1.5-flash-002
// https://ai.google.dev/gemini-api/docs/models/gemini#gemini-1.5-flash
// https://cloud.google.com/vertex-ai/generative-ai/docs/learn/model-versions

registerModel(
  'gemini-1.5-flash',
  makeConfig(2_097_152, 8_192, 'Aug 2024'),
  'gemini-1.5-flash-002', // 'gemini-1.5-flash'
  'google/gemini-1.5-flash-002', // 'google/gemini-1.5-flash'
);
