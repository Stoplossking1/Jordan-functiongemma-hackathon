import { type LlmConfig } from './LlmConfig.ts';
import { type LlmProviderConfig, formatModelName, registerProviderConfig } from './LlmProviderConfig.ts';
import { EstimationTokenizer } from './tokenizer/EstimationTokenizer.ts';

function makeConfig(
  maxInputTokens: number,
  maxOutputTokens: number,
  knowledgeCutoff: string,
  config?: Partial<LlmConfig>,
): LlmConfig {
  return {
    // we assume that Anthropic's tokenizer produces token counts in the same range as gpt-4o's.
    // new OpenAiTokenizer('gpt-4o'),
    tokenizer: new EstimationTokenizer(),
    maxInputTokens: maxInputTokens,
    maxOutputTokens: maxOutputTokens,
    knowledgeCutoff: knowledgeCutoff,
    supportsImageAttachments: ['BINARY'],
    supportsDocumentAttachments: ['BINARY'],
    supportsSystemPrompts: true,
    supportsStreaming: true,
    supportsTools: true,
    supportsStreamingTools: true,
    supportsToolChoice: true,
    supportsToolChoiceByName: true,
    ...config,
  };
}

// https://platform.claude.com/docs/en/about-claude/models/overview
type AnthropicModel =
  | 'claude-opus-4-6'
  | 'claude-opus-4-5'
  | 'claude-opus-4-1'
  | 'claude-opus-4'
  | 'claude-opus-3'
  | 'claude-sonnet-4-5'
  | 'claude-sonnet-4'
  | 'claude-sonnet-3.7'
  // | 'claude-sonnet-3.5-v2'
  // | 'claude-3.5-sonnet'
  | 'claude-haiku-4.5'
  | 'claude-haiku-3.5'
  | 'claude-haiku-3';

const bedrockModels = new Map<AnthropicModel, LlmProviderConfig>();

function registerModel(model: AnthropicModel, config: LlmConfig, bedrockModelName: string) {
  const providerConfig: LlmProviderConfig = {
    providerType: 'bedrock',
    modelName: bedrockModelName,
    config: config,
  };

  const fullName = formatModelName(providerConfig.providerType, model);
  registerProviderConfig(fullName, providerConfig);
  bedrockModels.set(model, providerConfig);
}

export function getBedrock(model: AnthropicModel): string {
  return formatModelName('bedrock', model);
}

// https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/model-catalog/serverless/anthropic.claude-opus-4-6-v1
registerModel(
  'claude-opus-4-6',
  makeConfig(200_000, 64_000, 'May 2025', {
    inputCostPerToken: 0.000005,
    outputCostPerToken: 0.000025,
    supportsPromptCaching: true,
    supportsResponseSchema: true,
    supportsAssistantPrefill: true,
    supportsVision: true,
    supportsPdfInput: true,
    supportsReasoning: true,
    supportsComputerUse: true,
    additionalRequestFields: {
      anthropic_beta: ['output-128k-2025-02-19'],
    },
  }),
  'global.anthropic.claude-opus-4-6-v1',
);

// https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/model-catalog/serverless/anthropic.claude-opus-4-5-20251101-v1:0
registerModel(
  'claude-opus-4-5',
  makeConfig(200_000, 64_000, 'Mar 2025', {
    inputCostPerToken: 0.000005,
    outputCostPerToken: 0.000025,
    supportsPromptCaching: true,
    supportsResponseSchema: true,
    supportsAssistantPrefill: true,
    supportsVision: true,
    supportsPdfInput: true,
    supportsReasoning: true,
    supportsComputerUse: true,
    additionalRequestFields: {
      anthropic_beta: ['output-128k-2025-02-19'],
    },
  }),
  'global.anthropic.claude-opus-4-5-20251101-v1:0',
);

// https://us-west-2.console.aws.amazon.com/bedrock/home?region=us-west-2#/model-catalog/serverless/anthropic.claude-opus-4-1-20250805-v1:0
registerModel(
  'claude-opus-4-1',
  makeConfig(200_000, 32_768, 'Jan 2025', {
    inputCostPerToken: 0.000015,
    outputCostPerToken: 0.000075,
    supportsPromptCaching: true,
    supportsResponseSchema: true,
    supportsAssistantPrefill: true,
    supportsVision: true,
    supportsPdfInput: true,
    supportsReasoning: true,
    supportsComputerUse: true,
    additionalRequestFields: {
      anthropic_beta: ['output-128k-2025-02-19'],
    },
  }),
  'global.anthropic.claude-opus-4-1-20250805-v1:0',
);

// https://us-west-2.console.aws.amazon.com/bedrock/home?region=us-west-2#/model-catalog/serverless/anthropic.claude-opus-4-20250514-v1:0
registerModel(
  'claude-opus-4',
  makeConfig(200_000, 32_768, 'Jan 2025', {
    inputCostPerToken: 0.000015,
    outputCostPerToken: 0.000075,
    supportsPromptCaching: true,
    supportsResponseSchema: true,
    supportsAssistantPrefill: true,
    supportsVision: true,
    supportsPdfInput: true,
    supportsReasoning: true,
    supportsComputerUse: true,
    additionalRequestFields: {
      anthropic_beta: ['output-128k-2025-02-19'],
    },
  }),
  'us.anthropic.claude-opus-4-20250514-v1:0',
);

// https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/providers?model=anthropic.claude-opus-3-20240229-v1:0
// registerModel('claude-opus-3', makeConfig(200_000, 4096), 'us.anthropic.claude-3-opus-20240229-v1:0');

// https://us-west-2.console.aws.amazon.com/bedrock/home?region=us-west-2#/model-catalog/serverless/anthropic.claude-sonnet-4-5-20250929-v1:0
registerModel(
  'claude-sonnet-4-5',
  makeConfig(200_000, 64000, 'Jan 2025', {
    inputCostPerToken: 0.000003,
    outputCostPerToken: 0.000015,
    supportsPromptCaching: true,
    supportsResponseSchema: true,
    supportsAssistantPrefill: true,
    supportsVision: true,
    supportsPdfInput: true,
    supportsReasoning: true,
    supportsComputerUse: true,
    additionalRequestFields: {
      anthropic_beta: ['output-128k-2025-02-19'],
      // anthropic_beta: ['prompt-caching-2024-07-31', 'pdfs-2024-09-25', 'output-128k-2025-02-19'],
    },
  }),
  // https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles-support.html
  // cross-region global (2x quotas)
  'global.anthropic.claude-sonnet-4-5-20250929-v1:0',
  // cross-region us
  // 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
);

// https://us-west-2.console.aws.amazon.com/bedrock/home?region=us-west-2#/model-catalog/serverless/anthropic.claude-sonnet-4-20250514-v1:0
registerModel(
  'claude-sonnet-4',
  makeConfig(200_000, 65_536, 'Jan 2025', {
    inputCostPerToken: 0.000003,
    outputCostPerToken: 0.000015,
    supportsPromptCaching: true,
    supportsResponseSchema: true,
    supportsAssistantPrefill: true,
    supportsVision: true,
    supportsPdfInput: true,
    supportsReasoning: true,
    supportsComputerUse: true,
    additionalRequestFields: {
      anthropic_beta: ['output-128k-2025-02-19'],
      // anthropic_beta: ['prompt-caching-2024-07-31', 'pdfs-2024-09-25', 'output-128k-2025-02-19'],
    },
  }),
  'global.anthropic.claude-sonnet-4-20250514-v1:0',
  // 'us.anthropic.claude-sonnet-4-20250514-v1:0',
);

// https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/model-catalog/serverless/anthropic.claude-3-7-sonnet-20250219-v1:0
// https://console.cloud.google.com/vertex-ai/publishers/anthropic/model-garden/claude-3-7-sonnet
registerModel(
  'claude-sonnet-3.7',
  makeConfig(200_000, 131_072, 'Oct 2024', {
    inputCostPerToken: 0.000003,
    outputCostPerToken: 0.000015,
    supportsPromptCaching: true,
    supportsResponseSchema: true,
    supportsAssistantPrefill: true,
    additionalRequestFields: {
      anthropic_beta: ['output-128k-2025-02-19'],
    },
  }),
  'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
);

// https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/providers?model=anthropic.claude-3-5-sonnet-20241022-v2:0
// https://console.cloud.google.com/vertex-ai/publishers/anthropic/model-garden/claude-3-5-sonnet-v2
// registerModel(
//   'claude-sonnet-3.5-v2',
//   makeConfig(200_000, 8192, {
//     inputCostPerToken: 0.000003,
//     outputCostPerToken: 0.000015,
//     supportsPromptCaching: true,
//     supportsResponseSchema: true,
//     supportsAssistantPrefill: true,
//   }),
//   'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
// );

// https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/model-catalog/serverless/anthropic.claude-haiku-4-5-20251001-v1:0
registerModel(
  'claude-haiku-4.5',
  makeConfig(200_000, 64_000, 'Feb 2025', {
    inputCostPerToken: 0.000001,
    outputCostPerToken: 0.000005,
    supportsPromptCaching: true,
    supportsResponseSchema: true,
    supportsAssistantPrefill: true,
  }),
  'global.anthropic.claude-haiku-4-5-20251001-v1:0',
);

// https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/providers?model=anthropic.claude-3-5-sonnet-20240620-v1:0
// registerModel('claude-3.5-sonnet', makeConfig(200_000, 8192), 'us.anthropic.claude-3-5-sonnet-20240620-v1:0'); // 'anthropic.claude-3-5-sonnet-20240620-v1:0');

// https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/providers?model=anthropic.claude-3-5-haiku-20241022-v1:0
registerModel(
  'claude-haiku-3.5',
  makeConfig(200_000, 8192, 'Jul 2024', {
    inputCostPerToken: 0.0000008,
    outputCostPerToken: 0.000004,
    supportsPromptCaching: true,
    supportsResponseSchema: true,
    supportsAssistantPrefill: true,
  }),
  'us.anthropic.claude-3-5-haiku-20241022-v1:0',
);

// https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/providers?model=anthropic.claude-haiku-3-20240307-v1:0
registerModel(
  'claude-haiku-3',
  makeConfig(200_000, 4096, 'Aug 2023', {
    inputCostPerToken: 0.00000025,
    outputCostPerToken: 0.00000125,
    supportsResponseSchema: true,
  }),
  'us.anthropic.claude-3-haiku-20240307-v1:0',
); // 'anthropic.claude-3-haiku-20240307-v1:0', // ['us-east-1']
