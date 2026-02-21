import { type LlmConfig } from './LlmConfig.ts';
import { type LlmProviderConfig, formatModelName, registerProviderConfig } from './LlmProviderConfig.ts';
import { EstimationTokenizer } from './tokenizer/EstimationTokenizer.ts';

function makeConfig(
  tokenizerName: string,
  maxInputTokens: number,
  maxOutputTokens: number,
  knowledgeCutoff: string,
  supportsReasoning: boolean,
  supportsDeveloperPrompts = false,
  supportsSystemPrompts?: boolean,
  config?: Partial<LlmConfig>,
): LlmConfig {
  return {
    //tokenizer: new OpenAiTokenizer(tokenizerName),
    tokenizer: new EstimationTokenizer(),
    maxInputTokens: maxInputTokens,
    maxOutputTokens: maxOutputTokens,
    knowledgeCutoff: knowledgeCutoff,
    supportsImageAttachments: ['URL', 'BASE64_URL'],
    supportsSystemPrompts: supportsSystemPrompts ?? !supportsDeveloperPrompts,
    supportsDeveloperPrompts: supportsDeveloperPrompts,
    supportsStreaming: true,
    supportsTools: true,
    supportsStreamingTools: true,
    supportsToolChoice: true,
    supportsToolChoiceByName: true,
    supportsReasoning: supportsReasoning,
    ...config,
  };
}

type OpenAiModel =
  | 'gpt-5.1'
  | 'gpt-5'
  | 'gpt-5-mini'
  | 'gpt-5-nano'
  | 'gpt-4.1'
  | 'gpt-4.1-mini'
  | 'gpt-4.1-nano'
  | 'gpt-4o'
  | 'gpt-4o-mini';
// | 'o1-preview'
// | 'o1'
// | 'o1-mini'
// | 'o3-mini'
// | 'o4-mini'

const openAiModels = new Map<OpenAiModel, LlmProviderConfig>();
function registerModel(model: OpenAiModel, config: LlmConfig, modelName: string) {
  const providerConfig: LlmProviderConfig = { providerType: 'openai', modelName: modelName, config: config };
  const fullName = get(model);
  registerProviderConfig(fullName, providerConfig);
  openAiModels.set(model, providerConfig);
}

export function get(model: OpenAiModel): string {
  return formatModelName('openai', model);
}

export function getDefaultSmall(): string {
  return get('gpt-4o-mini');
}

export function getDefaultLarge(): string {
  return get('gpt-4o');
}

// Account limits: https://platform.openai.com/account/limits

// https://platform.openai.com/docs/models/gpt-5.1
registerModel(
  'gpt-5.1',
  // total tokens 400_000 - 128_000 = 272_000
  makeConfig('gpt-5.1-2025-11-13', 272_000, 128_000, 'Sep 30, 2024', true, true, false),
  'gpt-5.1-2025-11-13',
);

// https://platform.openai.com/docs/models/gpt-5
registerModel(
  'gpt-5',
  // total tokens 400_000 - 128_000 = 272_000
  makeConfig('gpt-5-2025-08-07', 272_000, 128_000, 'Sep 30, 2024', true, true, false),
  'gpt-5-2025-08-07',
);

// https://platform.openai.com/docs/models/gpt-5-mini
registerModel(
  'gpt-5-mini',
  makeConfig('gpt-5-mini-2025-08-07', 272_000, 128_000, 'May 31, 2024', true, true, false),
  'gpt-5-mini-2025-08-07',
);
// https://platform.openai.com/docs/models/gpt-5-nano
registerModel(
  'gpt-5-nano',
  makeConfig('gpt-5-nano-2025-08-07', 272_000, 128_000, 'May 31, 2024', true, true, false),
  'gpt-5-nano-2025-08-07',
);

// https://platform.openai.com/docs/models/gpt-4.1
registerModel(
  'gpt-4.1',
  makeConfig('gpt-4.1-2025-04-14', 1_047_576, 32_768, 'Jun 01, 2024', false, undefined, undefined),
  'gpt-4.1-2025-04-14',
);

//https://platform.openai.com/docs/models/gpt-4.1-mini
registerModel(
  'gpt-4.1-mini',
  makeConfig('gpt-4.1-mini-2025-04-14', 1_047_576, 32_768, 'Jun 01, 2024', false, undefined, undefined),
  'gpt-4.1-mini-2025-04-14',
);

//https://platform.openai.com/docs/models/gpt-4.1-nano
registerModel(
  'gpt-4.1-nano',
  makeConfig('gpt-4.1-nano-2025-04-14', 1_047_576, 32_768, 'Jun 01, 2024', false, undefined, undefined),
  'gpt-4.1-nano-2025-04-14',
);

// https://platform.openai.com/docs/models/gpt-4o
registerModel(
  'gpt-4o',
  makeConfig('gpt-4o-2024-08-06', 128_000, 16_384, 'Oct 01, 2023', false, undefined, undefined),
  'gpt-4o-2024-08-06',
);

// https://platform.openai.com/docs/models/gpt-4o-mini
registerModel(
  'gpt-4o-mini',
  makeConfig('gpt-4o-mini-2024-07-18', 128_000, 16_384, 'Oct 01, 2023', false, undefined, undefined),
  'gpt-4o-mini-2024-07-18',
);

/// reasoning only models

// //https://platform.openai.com/docs/models/o4-mini
// registerModel('o4-mini', makeConfig('o4-mini-2025-04-16', 200_000, 100_000, true, true, false), 'o4-mini-2025-04-16');

// // https://platform.openai.com/docs/models/o3-mini
// registerModel('o3-mini', makeConfig('gpt-4o-2024-08-06', 200_000, 200_000, true, true, false), 'o3-mini-2025-01-31');

// // https://platform.openai.com/docs/models/o1
// registerModel('o1', makeConfig('gpt-4o-2024-08-06', 200_000, 100_000, true, true, false), 'o1-2024-12-17');

// // https://platform.openai.com/docs/models/o1-mini
// registerModel(
//   'o1-mini',
//   makeConfig('gpt-4o-2024-08-06', 128_000, 65_536, true, false, false, { supportsTemperature: false }),
//   'o1-mini-2024-09-12',
// );
