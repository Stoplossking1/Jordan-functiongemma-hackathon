import { type LlmConfig } from './LlmConfig.ts';

export type LlmProviderType = 'bedrock' | 'openai' | 'vertexai' | 'vertexai-oai';

export type AccessTokenProvider = () => Promise<string | null | undefined>;

export interface LlmProviderConfig {
  providerType: LlmProviderType;
  modelName: string;
  config: LlmConfig;
  modelRegions?: Array<string>;
  //accessTokenProvider?: AccessTokenProvider;
}

const modelProviders = new Map<string, LlmProviderConfig>();

export function formatModelName(providerType: LlmProviderType, modelName: string): string {
  return `${providerType}/${modelName}`;
}

export function registerProviderConfig(modelName: string, providerConfig: LlmProviderConfig) {
  modelProviders.set(modelName, providerConfig);
}

export function findProviderConfig(modelName: string): LlmProviderConfig | undefined {
  const provider = modelProviders.get(modelName);
  return provider;
}
