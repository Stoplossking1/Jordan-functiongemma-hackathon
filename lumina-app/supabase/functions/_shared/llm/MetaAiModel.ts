import { type LlmConfig } from './LlmConfig.ts';
import { type LlmProviderConfig, formatModelName, registerProviderConfig } from './LlmProviderConfig.ts';
import { EstimationTokenizer } from './tokenizer/EstimationTokenizer.ts';

function makeConfig(maxInputTokens: number, supportsTools: boolean, effectiveInputTokens?: number): LlmConfig {
  return {
    tokenizer: new EstimationTokenizer(),
    maxInputTokens: maxInputTokens,
    effectiveInputTokens: effectiveInputTokens,
    maxOutputTokens: undefined,
    knowledgeCutoff: '2023', // TODO: update if we use newer models
    supportsSystemPrompts: true,
    supportsStreaming: true,
    supportsTools: supportsTools,
    supportsStreamingTools: false,
    supportsToolChoice: false,
    supportsToolChoiceByName: false,
  };
}

type MetaAiModel =
  | 'llama3-2-90b'
  | 'llama3-2-11b'
  | 'llama3-2-3b'
  | 'llama3-2-1b'
  | 'llama3-1-405b'
  | 'llama3-1-70b'
  | 'llama3-1-8b'
  | 'llama3-70b'
  | 'llama3-8b';

const bedrockModels = new Map<MetaAiModel, LlmProviderConfig>();
function registerModel(model: MetaAiModel, config: LlmConfig, bedrockModelName: string, modelRegions?: Array<string>) {
  const providerConfig: LlmProviderConfig = {
    providerType: 'bedrock',
    modelName: bedrockModelName,
    modelRegions: modelRegions,
    config: config,
  };

  const fullName = formatModelName(providerConfig.providerType, model);
  registerProviderConfig(fullName, providerConfig);

  bedrockModels.set(model, providerConfig);
}

export function getBedrock(model: MetaAiModel): string {
  return formatModelName('bedrock', model);
}

// https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/providers?model=meta.llama3-2-90b-instruct-v1:0
registerModel('llama3-2-90b', makeConfig(128_000, true), 'us.meta.llama3-2-90b-instruct-v1:0');

// https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/providers?model=meta.llama3-2-11b-instruct-v1:0
registerModel('llama3-2-11b', makeConfig(128_000, true), 'us.meta.llama3-2-11b-instruct-v1:0');

// https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/providers?model=meta.llama3-2-3b-instruct-v1:0
registerModel('llama3-2-3b', makeConfig(131_000, false), 'us.meta.llama3-2-3b-instruct-v1:0');

// https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/providers?model=meta.llama3-2-1b-instruct-v1:0
registerModel('llama3-2-1b', makeConfig(131_000, false), 'us.meta.llama3-2-1b-instruct-v1:0');

// https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/providers?model=meta.llama3-1-405b-instruct-v1:0
registerModel('llama3-1-405b', makeConfig(128_000, true), 'meta.llama3-1-405b-instruct-v1:0');

// https://us-west-2.console.aws.amazon.com/bedrock/home?region=us-west-2#/providers?model=meta.llama3-1-70b-instruct-v1:0
registerModel('llama3-1-70b', makeConfig(128_000, true, 64_000), 'meta.llama3-1-70b-instruct-v1:0', ['us-west-2']);

// https://us-west-2.console.aws.amazon.com/bedrock/home?region=us-west-2#/providers?model=meta.llama3-1-8b-instruct-v1:0
registerModel('llama3-1-8b', makeConfig(128_000, true, 32_000), 'meta.llama3-1-8b-instruct-v1:0', ['us-west-2']);

// https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/providers?model=meta.llama3-70b-instruct-v1:0
registerModel('llama3-70b', makeConfig(8192, false), 'meta.llama3-70b-instruct-v1:0');

// https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/providers?model=meta.llama3-8b-instruct-v1:0
registerModel('llama3-8b', makeConfig(8192, false), 'meta.llama3-8b-instruct-v1:0');
