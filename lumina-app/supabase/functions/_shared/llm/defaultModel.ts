import { LlmFactory } from './LlmFactory.ts';
import { LlmProvider } from './LlmProvider.ts';
import { type LlmProviderSecrets } from './LlmProviderSecrets.ts';

import * as AnthropicModel from './AnthropicModel.ts';
import * as GoogleModel from './GoogleModel.ts';
import * as MetaAiModel from './MetaAiModel.ts';
import * as OpenAiModel from './OpenAiModel.ts';

export async function makeDefaultModelOrThrow(secrets: LlmProviderSecrets): Promise<LlmProvider> {
  const factory = await LlmFactory.make(secrets);
  const defaultModel = Deno.env.get('DEFAULT_LLM'); // must be fully qualified with provider, e.g. "openai/gpt-4o-mini"
  let llm = defaultModel ? factory.makeModelProvider(defaultModel) : undefined;
  llm ??= factory.makeModelProvider(GoogleModel.get('gemini-3.0-pro'));
  llm ??= factory.makeModelProvider(GoogleModel.get('gemini-2.0-pro'));
  llm ??= factory.makeModelProvider(GoogleModel.get('gemini-2.0-flash'));
  llm ??= factory.makeModelProvider(AnthropicModel.getBedrock('claude-haiku-3')); // let llm = factory.makeModelProvider(AnthropicModel.getBedrock('claude-sonnet-3.5-v2'));
  llm ??= factory.makeModelProvider(OpenAiModel.get('gpt-4o-mini'));
  if (llm == null) {
    throw new Error('No llmProvider available. Ensure that the environment variables for provider secrets are set.');
  }

  return llm;
}
