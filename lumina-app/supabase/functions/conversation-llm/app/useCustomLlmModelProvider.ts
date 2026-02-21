/**
 * App Specific LLM Model Provider for Bot. Given a bot, this function returns the model provider to be used by the LLM for that bot.
 * @todo AUTO-GENERATED INITIAL VERSION - Generic implementation that can be customized
 */

import type { CustomLlmModelProvider, CustomLlmModelProviderProps } from '../../_shared/llm/custom-llm-conversation.ts';
import { makeDefaultModelOrThrow } from '../../_shared/llm/defaultModel.ts';
import { HybridCactusGeminiProvider } from './HybridCactusGeminiProvider.ts';
import { hybridRoutingPolicy } from './hybridRoutingPolicy.ts';

export default async function useCustomLlmModelProvider(
  props: CustomLlmModelProviderProps,
): Promise<CustomLlmModelProvider> {
  const cloudProvider = await makeDefaultModelOrThrow(props.providerSecrets);
  const provider = new HybridCactusGeminiProvider(cloudProvider, hybridRoutingPolicy);
  return { provider };
}
