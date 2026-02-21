/**
 * App Specific LLM Request Creator for Bot. Given a bot, this function returns the request creator to be used by the LLM for that bot.
 * @todo AUTO-GENERATED INITIAL VERSION - Generic implementation that can be customized
 */

import OpenAI from 'openai';

import type { ConversationContext } from '../../_shared/llm/llm-conversation.ts';
import { toCompletionMessageParam } from '../../_shared/llm/llm-conversation.ts';
import { createCompletionRequest } from '../../_shared/llm/request-utils.ts';
import type { LlmRequestCreator } from '../../_shared/llm/tools/tool-invocation.ts';
import type {
  CustomLlmRequestCreator,
  CustomLlmRequestCreatorProps,
} from '../../_shared/llm/custom-llm-conversation.ts';
import { hybridRoutingPolicy } from './hybridRoutingPolicy.ts';

export default async function useCustomLlmRequestCreator(
  props: CustomLlmRequestCreatorProps,
): Promise<CustomLlmRequestCreator> {
  const creator: LlmRequestCreator<ConversationContext> = async function createLuminaLlmRequest(
    modelProvider,
    context,
    assetProvider,
    tools,
  ) {
    const userCompletionMessage = await toCompletionMessageParam(context.requestMessage, assetProvider);
    const systemMessage: OpenAI.ChatCompletionMessageParam = {
      content: props.systemPrompt,
      role: 'system',
    };

    return await createCompletionRequest(
      modelProvider,
      context.prevMessages,
      true,
      assetProvider,
      context.toolMessages,
      systemMessage,
      userCompletionMessage,
      tools,
      undefined,
      hybridRoutingPolicy.localTemperature,
      context.useStreaming,
    );
  };

  return { creator };
}
