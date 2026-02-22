import { OpenAI } from 'openai';

import { removeSuffix } from '../../_shared-client/utils/string-utils.ts';
import { type ApiProgressHandler } from '../ApiProgressHandler.ts';
import { type LlmAssetProvider } from './LlmAssetProvider.ts';
import { type LlmConfig, type LlmMessageAttachmentType } from './LlmConfig.ts';
import { type LlmProviderConfig } from './LlmProviderConfig.ts';
import { type LlmInputStreamProcessor } from './LlmStreamProcessor.ts';
import { type LlmPromptFormat } from './prompt-format/LlmPromptFormat.ts';
import { defaultPromptFormat } from './prompt-format/OpenAiPromptFormat.ts';
import { retryWithBackoff } from './request-utils.ts';
import { type LlmTool, type LlmToolContext } from './tools/llm-tools.ts';
import { type LlmToolHandler, processAllTools } from './tools/tool-invocation.ts';

const ERROR_ATTEMPT_COUNT = 5;

export function makeCompletionTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

function safeAdd(a?: number, b?: number): number | undefined {
  return typeof a === 'number' ? (typeof b === 'number' ? a + b : a) : b;
}

function mergeAddDetails(a: any, b: any): any {
  if (!a && !b) return undefined;
  const result: any = {};
  const keys = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]);

  for (const key of keys) {
    const sum = safeAdd(a?.[key], b?.[key]);
    if (sum != null) result[key] = sum;
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

export function aggregateUsage(
  a: OpenAI.CompletionUsage | undefined,
  b: OpenAI.CompletionUsage | undefined,
): OpenAI.CompletionUsage | undefined {
  if (!b) return a;
  if (!a) return b;

  const result: OpenAI.CompletionUsage = {
    prompt_tokens: safeAdd(a.prompt_tokens, b.prompt_tokens) ?? 0,
    completion_tokens: safeAdd(a.completion_tokens, b.completion_tokens) ?? 0,
    total_tokens: safeAdd(a.total_tokens, b.total_tokens) ?? 0,
  };

  const completionDetails = mergeAddDetails(a.completion_tokens_details, b.completion_tokens_details);
  if (completionDetails) result.completion_tokens_details = completionDetails;

  const promptDetails = mergeAddDetails(a.prompt_tokens_details, b.prompt_tokens_details);
  if (promptDetails) result.prompt_tokens_details = promptDetails;

  return result;
}

export function makeMergedResponse(
  response: OpenAI.ChatCompletion,
  multiResponseContent?: string | null,
  aggregatedUsage?: OpenAI.Completions.CompletionUsage,
): OpenAI.ChatCompletion {
  return {
    ...response,
    choices: [
      {
        ...response.choices?.[0],
        message: {
          ...response.choices?.[0]?.message,
          content: multiResponseContent ?? null,
        },
      },
    ],
    usage: aggregatedUsage,
  };
}

function nameFromClassName(className: string): string {
  const typeName = removeSuffix(className.toLocaleLowerCase(), 'provider')!;
  return typeName;
}

export type LlmInvocationHandler = (
  attempt: number,
  subAttempt: number | undefined,
  curAttemptAt: Date,
  reqOrRes?: OpenAI.ChatCompletion | OpenAI.ChatCompletionCreateParams,
) => Promise<OpenAI.ChatCompletion | undefined>;

export abstract class LlmProvider {
  public readonly config: LlmConfig;
  constructor(
    public readonly providerConfig: LlmProviderConfig,
    public readonly promptFormat: LlmPromptFormat = defaultPromptFormat,
  ) {
    this.config = providerConfig.config;
  }

  static providerName(): string {
    return nameFromClassName(this.name);
  }

  abstract invoke<S>(
    request: OpenAI.ChatCompletionCreateParams,
    assetProvider?: LlmAssetProvider,
    abortController?: AbortController,
    streamProcessor?: LlmInputStreamProcessor<S>,
    progress?: ApiProgressHandler,
  ): Promise<OpenAI.ChatCompletion | undefined>;

  public async invokeWithPreProcessor<S>(
    request: OpenAI.ChatCompletionCreateParams,
    attempt: number,
    subAttempt?: number,
    invocationHandler?: LlmInvocationHandler,
    assetProvider?: LlmAssetProvider,
    abortController?: AbortController,
    streamProcessor?: LlmInputStreamProcessor<S>,
    progress?: ApiProgressHandler,
  ): Promise<OpenAI.ChatCompletion | undefined> {
    const curAttemptAt = new Date();
    let response = await invocationHandler?.(attempt, subAttempt, curAttemptAt, request);
    // if the handler has a response already, skip calling the actual model
    if (!response) {
      response = await retryWithBackoff(ERROR_ATTEMPT_COUNT, async () => {
        return await this.invoke(request, assetProvider, abortController, streamProcessor, progress);
      });

      await invocationHandler?.(attempt, subAttempt, curAttemptAt, response);
      // console.dir(response, { depth: null });
    }
    return response;
  }

  async invokeWithLengthRetry<S>(
    request: OpenAI.ChatCompletionCreateParams,
    attempt: number,
    curSubAttemptIndex: number,
    maxSubAttempts?: number,
    invocationHandler?: LlmInvocationHandler,
    assetProvider?: LlmAssetProvider,
    abortController?: AbortController,
    streamProcessor?: LlmInputStreamProcessor<S>,
    progress?: ApiProgressHandler,
  ): Promise<{ response: OpenAI.ChatCompletion | undefined; curSubAttemptIndex: number }> {
    let subAttempt = 0;

    let response: OpenAI.ChatCompletion | undefined = await this.invokeWithPreProcessor(
      request,
      attempt,
      curSubAttemptIndex++,
      invocationHandler,
      assetProvider,
      abortController,
      streamProcessor,
      progress,
    );

    // if the response is too long we might be able to continue it
    // by sending another message to the LLM with what we got previously
    if (response?.choices?.[0].finish_reason === 'length' && this.config.supportsAssistantPrefill) {
      let aggregatedUsage = response.usage;
      let multiResponseContent = response.choices?.[0].message.content;
      // TODO: is this adjustment needed?
      //multiResponseContent = multiResponseContent.endsWith('\n') ? multiResponseContent.slice(0, -1) : multiResponseContent;

      while (
        response?.choices?.[0].finish_reason === 'length' &&
        this.config.supportsAssistantPrefill &&
        // check that we didn't reach the input token size at the previous request
        (response?.usage?.prompt_tokens ?? 0) < this.config.maxInputTokens &&
        // TODO: just to be on the safe-side we limit the amount to retries. See if we can drop this
        (maxSubAttempts == null || subAttempt < maxSubAttempts)
      ) {
        subAttempt++;
        console.log(`Completion tokens exceeded limit (${response?.usage?.completion_tokens}), trying to continue it`);
        const lastMessage = request.messages[request.messages.length - 1];
        if (lastMessage.role === 'assistant') {
          // update the most recent assistant message with the prefill
          lastMessage.content = multiResponseContent;
        } else {
          request.messages.push({
            role: 'assistant',
            content: multiResponseContent,
          });
        }

        response = await this.invokeWithPreProcessor(request, attempt, curSubAttemptIndex++, invocationHandler);

        // Aggregate message content
        const content = response?.choices?.[0].message.content;
        multiResponseContent =
          multiResponseContent != null
            ? content != null
              ? multiResponseContent + content
              : multiResponseContent
            : (content ?? null);

        // Aggregate usage statistics
        aggregatedUsage = aggregateUsage(aggregatedUsage, response?.usage);
      }
      // Create OpenAI compatible response with aggregated data
      return {
        response: response ? makeMergedResponse(response, multiResponseContent, aggregatedUsage) : undefined,
        curSubAttemptIndex,
      };
    }
    // return unchanged payload if nothing needs to be done
    return { response, curSubAttemptIndex };
  }

  public fullModelName(): string {
    return this.providerConfig.modelName;
  }

  public getImageAttachmentType(mimeType: string): LlmMessageAttachmentType | undefined {
    return undefined;
  }

  public getDocumentAttachmentType(mimeType: string): LlmMessageAttachmentType | undefined {
    return undefined;
  }

  public countRequestTokens(
    messages: Array<OpenAI.ChatCompletionMessageParam>,
    tools?: Array<OpenAI.ChatCompletionTool>,
    toolChoice?: OpenAI.ChatCompletionToolChoiceOption,
  ): number {
    return this.promptFormat.countRequestTokens(this.config.tokenizer, messages, tools, toolChoice);
  }

  public countMessagesTokens(messages: Array<OpenAI.ChatCompletionMessageParam>, haveTools = false): number {
    return this.promptFormat.countMessagesTokens(this.config.tokenizer, messages, haveTools);
  }
  public countMessageTokens(message: OpenAI.ChatCompletionMessageParam, extraContent?: string): number {
    return this.promptFormat.countMessageTokens(this.config.tokenizer, message, extraContent);
  }
  public countTextTokens(text: string): number {
    return this.config.tokenizer.countTextTokens(text);
  }

  public countToolsTokens(
    tools: Array<OpenAI.ChatCompletionTool>,
    toolChoice: OpenAI.ChatCompletionToolChoiceOption = 'auto',
    haveSystemMessage: boolean,
  ): number {
    return this.promptFormat.countToolsTokens(this.config.tokenizer, tools, toolChoice, haveSystemMessage);
  }
}
