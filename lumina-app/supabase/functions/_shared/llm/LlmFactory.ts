import { type LlmProvider } from './LlmProvider.ts';
import { type LlmProviderType, findProviderConfig } from './LlmProviderConfig.ts';
import { type LlmProviderSecrets } from './LlmProviderSecrets.ts';
import { type LlmProviderFactory, initializeProviderFactories } from './LlmProviderFactory.ts';
// trigger registration of all known providers through import below
import './providers.ts';

export class LlmFactory {
  static async make(secrets: LlmProviderSecrets): Promise<LlmFactory> {
    const factories = await initializeProviderFactories(secrets);
    return new LlmFactory(factories);
  }

  private constructor(private readonly factories: Map<LlmProviderType, LlmProviderFactory>) {}

  makeModelProvider(providerAndModelName: string): LlmProvider | undefined {
    const providerConfig = findProviderConfig(providerAndModelName);
    if (providerConfig) {
      const factory = this.factories.get(providerConfig.providerType);
      if (factory) {
        return factory.make(providerConfig);
      }
    }
    return undefined;
  }
}
