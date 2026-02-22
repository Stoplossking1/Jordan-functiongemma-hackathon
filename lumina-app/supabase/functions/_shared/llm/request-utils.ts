import { OpenAI } from 'openai';

import { LlmAssetProvider } from './LlmAssetProvider.ts';
import { LlmProvider } from './LlmProvider.ts';
import { type LlmConversationMessage, toCompletionMessageParamsWithTools } from './llm-conversation.ts';

export type GptVerbosity = 'low' | 'medium' | 'high';

export async function retryWithBackoff<T>(
  maxAttempts: number,
  tryBlock: () => Promise<T>,
  onError?: () => void,
): Promise<T> {
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      return await tryBlock();
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error(`Error attempt ${attempt + 1}/${maxAttempts}: ${errorMessage}`);

      onError?.();
      attempt++;

      if (attempt >= maxAttempts) {
        console.error(`All ${maxAttempts} retry attempts failed`);
        throw e;
      }

      // Exponential backoff with jitter
      const baseDelay = 1000;
      const backoffDelay = baseDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 1000;
      const delayMs = Math.min(backoffDelay + jitter, 30000); // Cap at 30s

      console.log(`Retrying in ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // This should never be reached due to the throw above, but TypeScript needs it
  throw new Error('Retry logic error');
}

export type ToolChoiceMode = 'auto' | 'required' | 'none';

export async function createCompletionRequest(
  llmProvider: LlmProvider,
  prevMessages: LlmConversationMessage[],
  parallelToolCalls: boolean,
  assetProvider?: LlmAssetProvider,
  toolMessages?: Array<OpenAI.ChatCompletionAssistantMessageParam | OpenAI.ChatCompletionToolMessageParam>,
  systemMessage?: OpenAI.ChatCompletionMessageParam,
  userMessage?: OpenAI.ChatCompletionMessageParam,
  tools?: OpenAI.ChatCompletionTool[],
  maxPrevMessageCount?: number,
  temperature?: number,
  useStreaming?: boolean,
  reasoningEffort?: OpenAI.ReasoningEffort,
  verbosity?: GptVerbosity,
  toolChoiceMode?: ToolChoiceMode,
): Promise<OpenAI.ChatCompletionCreateParams> {
  // Keep default behavior permissive unless a caller explicitly enforces tool usage.
  const toolsChoice = tools ? (toolChoiceMode ?? 'auto') : undefined;

  const messages: Array<OpenAI.ChatCompletionMessageParam> = [];
  const prevMessageFilters = maxPrevMessageCount != null ? prevMessages.slice(-maxPrevMessageCount) : prevMessages;

  if (systemMessage) {
    messages.push(systemMessage);
  }

  for (const prevMessage of prevMessageFilters) {
    const openAiMessages = await toCompletionMessageParamsWithTools(prevMessage, assetProvider);
    messages.push(...openAiMessages);
  }

  if (userMessage != null) {
    messages.push(userMessage);
  }

  if (toolMessages) {
    messages.push(...toolMessages);
  }
  console.log(`prompt_tokens: ${llmProvider.countRequestTokens(messages)}`);
  const openAiRequest: OpenAI.ChatCompletionCreateParams = {
    model: llmProvider.providerConfig.modelName,
    messages: messages,
    tool_choice: toolsChoice,
    tools: tools,
    // 'parallel_tool_calls' is only allowed when 'tools' are specified.
    parallel_tool_calls: tools != null ? parallelToolCalls : undefined,
    stream: useStreaming,
    temperature: temperature,
    reasoning_effort: reasoningEffort,
    verbosity,
  };

  return openAiRequest;
}
