import { type LlmProvider } from './LlmProvider.ts';
import { type LlmProviderConfig, type LlmProviderType } from './LlmProviderConfig.ts';
import { type LlmProviderSecrets } from './LlmProviderSecrets.ts';

export type LlmProviderFactoryConstructor = (secrets: LlmProviderSecrets) => Promise<LlmProviderFactory | undefined>;

export interface LlmProviderFactory {
  make(providerConfig: LlmProviderConfig): LlmProvider | undefined;
}

const factoryConstructors = new Map<LlmProviderType, LlmProviderFactoryConstructor>();

export function registerProviderFactory(providerType: LlmProviderType, constructor: LlmProviderFactoryConstructor) {
  factoryConstructors.set(providerType, constructor);
}

export async function initializeProviderFactories(
  secrets: LlmProviderSecrets,
): Promise<Map<LlmProviderType, LlmProviderFactory>> {
  const factories = new Map<LlmProviderType, LlmProviderFactory>();
  for (const [name, factoryConstructor] of factoryConstructors.entries()) {
    const factory = await factoryConstructor(secrets);
    if (factory) {
      factories.set(name, factory);
    }
  }
  return factories;
}
