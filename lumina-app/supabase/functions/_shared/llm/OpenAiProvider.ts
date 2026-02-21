import { OpenAI } from 'openai';
import { Stream } from 'openai/streaming';

import { CanceledError, ServerError } from '../../_shared-client/error/index.ts';
import { type ApiProgressHandler } from '../ApiProgressHandler.ts';

import { LlmAssetProvider } from './LlmAssetProvider.ts';
import { type LlmMessageAttachmentType } from './LlmConfig.ts';
import { LlmProvider } from './LlmProvider.ts';
import { type AccessTokenProvider, type LlmProviderConfig } from './LlmProviderConfig.ts';
import { registerProviderFactory, type LlmProviderFactory } from './LlmProviderFactory.ts';
import { makeChoiceFromStreamState, type LlmInputStreamProcessor, type LlmStreamState } from './LlmStreamProcessor.ts';

registerProviderFactory('openai', async (secrets) => {
  if (secrets.openaiApiKey) {
    return new OpenAiProviderFactory(new OpenAI({ apiKey: secrets.openaiApiKey }));
  }
});

class OpenAiProviderFactory implements LlmProviderFactory {
  constructor(private readonly openAiClient: OpenAI) {}
  make(providerConfig: LlmProviderConfig): LlmProvider | undefined {
    return new OpenAiProvider(this.openAiClient, providerConfig);
  }
}

const GPT_REQUEST_TIMEOUT_MS = 15000;

// https://platform.openai.com/docs/guides/vision/what-type-of-files-can-i-upload#what-type-of-files-can-i-upload
const mimeTypeImageFormats = new Set<string>(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

function makeToolCallsFromDeltas(
  toolCallsCollected?: Array<OpenAI.ChatCompletionChunk.Choice.Delta.ToolCall>,
): Array<OpenAI.ChatCompletionMessageToolCall> | undefined {
  if (toolCallsCollected == null) {
    return undefined;
  }
  // assemble a full tool call message if all parameters are available
  const toolCalls: Array<OpenAI.ChatCompletionMessageToolCall> = [];
  for (const tcDelta of toolCallsCollected) {
    if (
      tcDelta.id != null &&
      tcDelta.type != null &&
      tcDelta.function?.name != null &&
      tcDelta.function?.arguments != null
    ) {
      const funcName = tcDelta.function?.name;
      const funcArguments = tcDelta.function?.arguments;
      toolCalls.push({
        id: tcDelta.id,
        type: tcDelta.type,
        function: {
          arguments: funcArguments,
          name: funcName,
        },
      });
    }
  }
  return toolCalls;
}

export class OpenAiProvider extends LlmProvider {
  constructor(
    public readonly openAiClient: OpenAI,
    providerConfig: LlmProviderConfig,
    private readonly accessTokenProvider?: AccessTokenProvider,
  ) {
    super(providerConfig);
  }

  override async invoke<S>(
    request: OpenAI.ChatCompletionCreateParams,
    assetProvider?: LlmAssetProvider,
    abortController?: AbortController,
    streamProcessor?: LlmInputStreamProcessor<S>,
    progress?: ApiProgressHandler,
  ): Promise<OpenAI.ChatCompletion | undefined> {
    // set the model name in the request so we are always consistent
    request.model = this.fullModelName();
    console.log('GPT ChatCompletionRequest'); //, request
    //console.dir(request, { depth: null })
    //console.debug("GPT Done printing ChatCompletionRequest");

    const maxRetries = 1;
    console.log('GPT request starting');
    const accessToken = await this.accessTokenProvider?.();
    if (accessToken) {
      this.openAiClient.apiKey = accessToken;
    }

    // use asset cache to translate private asset urls to publically accessible urls
    const requestAdjusted: OpenAI.ChatCompletionCreateParams = {
      ...request,
      messages: this.adjustMessages(request.messages, assetProvider),
      temperature: this.config.supportsTemperature ? request.temperature : undefined,
      reasoning_effort: this.config.supportsReasoning ? request.reasoning_effort : undefined,
      verbosity: this.config.supportsReasoning ? request.verbosity : undefined,
      // avoid empty tool array, since OpenAI will result in this error:
      // Error: 400 Invalid 'tools': empty array. Expected an array with minimum length 1, but got an empty array instead.
      tools: request.tools?.length ? request.tools : undefined,
    };

    const openAIResponsePromise = this.openAiClient.chat.completions
      .create(
        requestAdjusted,
        requestAdjusted.stream
          ? {
              // in streaming mode, limit the amount of time we wait - if it takes too long, we want to return an error early
              maxRetries: maxRetries,
              timeout: GPT_REQUEST_TIMEOUT_MS,
              signal: abortController?.signal,
            }
          : { maxRetries: maxRetries },
      )
      .catch((e) => {
        let errorToThrow = e;
        if (!(e instanceof CanceledError)) {
          const status = (e?.response?.status satisfies number) ?? (e?.response?.statusCode satisfies number);

          const statusText = (e?.response?.statusText satisfies string) ?? (e?.cause?.code satisfies number);

          const errorMessage = `GPT completion error ${status ?? e?.errno} ${statusText}: ${
            e?.message ?? 'Failed to send request to GPT'
          }`;
          console.error(errorMessage, e);

          errorToThrow = new ServerError(503, errorMessage, e);

          if (!abortController?.signal.aborted) {
            console.debug('GPT error, aborting all other ongoing transfers');
            abortController?.abort(new CanceledError(errorMessage));
          }
        } else {
          console.debug('GPT request canceled');
        }
        throw errorToThrow;
      });

    progress?.onRequestInitiated(openAIResponsePromise);

    const openAIResponse: Stream<OpenAI.ChatCompletionChunk> | OpenAI.ChatCompletion = await openAIResponsePromise;
    if (openAIResponse instanceof Stream) {
      return await OpenAiProvider.handleStreamResponse(openAIResponse, streamProcessor, abortController);
    } else {
      return await OpenAiProvider.handleNoStreamResponse(openAIResponse, streamProcessor);
    }
  }

  private adjustMessages(
    messages: OpenAI.ChatCompletionMessageParam[],
    assetProvider?: LlmAssetProvider,
  ): OpenAI.ChatCompletionMessageParam[] {
    const res: OpenAI.ChatCompletionMessageParam[] = [];
    for (const message of messages) {
      if (message.role === 'user') {
        res.push({
          ...message,
          content: this.adjustUserContent(message.content, assetProvider),
        });
      } else if (message.role === 'developer' && !this.config.supportsDeveloperPrompts) {
        // convert developer messages to system messages
        res.push({
          ...message,
          role: this.config.supportsSystemPrompts ? 'system' : 'user',
        });
      } else if (message.role === 'system' && !this.config.supportsSystemPrompts) {
        // convert system messages to developer messages for reasoning models
        res.push({
          ...message,
          role: this.config.supportsDeveloperPrompts ? 'developer' : 'user',
        } satisfies OpenAI.ChatCompletionDeveloperMessageParam | OpenAI.ChatCompletionUserMessageParam);
      } else {
        res.push(message);
      }
    }
    return res;
  }

  private adjustUserContent(
    contents: string | OpenAI.ChatCompletionContentPart[],
    assetProvider?: LlmAssetProvider,
  ): string | OpenAI.ChatCompletionContentPart[] {
    if (typeof contents === 'string') {
      return contents;
    }
    const res: OpenAI.ChatCompletionContentPart[] = [];
    for (const content of contents) {
      if (content.type === 'image_url') {
        res.push({
          ...content,
          image_url: {
            ...content.image_url,
            url: assetProvider?.adjustUrl(content.image_url.url) ?? content.image_url.url,
          },
        });
      } else {
        res.push(content);
      }
    }
    return res;
  }

  public override getImageAttachmentType(mimeType: string): LlmMessageAttachmentType | undefined {
    const exist = mimeTypeImageFormats.has(mimeType);
    if (exist) return this.config.supportsImageAttachments?.[0];
    return undefined;
  }

  public override getDocumentAttachmentType(mimeType: string): LlmMessageAttachmentType | undefined {
    // const isTextFile =
    //   asset.mimeType === 'text/plain' ||
    //   (asset.mimeType === '' && filenameLower.endsWith('.tsx')) ||
    //   filenameLower.endsWith('.ts');

    // we will just load content and convert to text node
    return undefined;
  }

  private static async handleNoStreamResponse<S>(
    responseData: OpenAI.ChatCompletion,
    streamProcessor?: LlmInputStreamProcessor<S>,
  ): Promise<OpenAI.ChatCompletion | undefined> {
    if (streamProcessor) {
      const choiceIndex = 0;
      const choice = responseData.choices[choiceIndex];

      await streamProcessor(
        {
          isStreamOpen: false,
          finishReason: choice.finish_reason ?? undefined,
          choiceIndex: choiceIndex,
          fullText: choice.message.content ?? undefined,
          toolCallsCollected: false,
        },
        undefined,
        choice.message.content ?? undefined,
      );
    }
    return responseData;
  }

  private static async handleStreamResponse<S>(
    stream: Stream<OpenAI.ChatCompletionChunk>,
    streamProcessor?: LlmInputStreamProcessor<S>,
    abortController?: AbortController,
  ): Promise<OpenAI.ChatCompletion | undefined> {
    const completion: OpenAI.ChatCompletion = {
      id: '',
      created: 0,
      model: '',
      object: 'chat.completion',
      choices: [],
    };
    const streamState: LlmStreamState = {
      isStreamOpen: true,
      choiceIndex: 0,
      toolCallsCollected: false,
    };
    let curProcessingState: S | undefined;

    //const decoder = new TextDecoder("utf-8");
    let toolCallsCollected: Array<OpenAI.ChatCompletionChunk.Choice.Delta.ToolCall> | undefined;

    console.log('GPT stream waiting');

    try {
      for await (const part of stream) {
        completion.id = part.id;
        completion.created = part.created;
        completion.model = part.model;
        completion.service_tier = part.service_tier ?? completion.service_tier;
        completion.system_fingerprint = part.system_fingerprint ?? completion.system_fingerprint;

        if (part.usage != null) {
          if (completion.usage != null) {
            completion.usage.completion_tokens += part.usage.completion_tokens;
            completion.usage.prompt_tokens += part.usage.prompt_tokens;
            completion.usage.total_tokens += part.usage.total_tokens;
            // TODO: add handling of completion_tokens_details and prompt_tokens_details
          } else {
            completion.usage = part.usage;
          }
        }

        const choice = part.choices[0];
        const choiceDelta = choice?.delta;
        streamState.logProbs = choice?.logprobs ?? streamState.logProbs;
        streamState.finishReason = choice?.finish_reason ?? streamState.finishReason;
        streamState.role = choiceDelta?.role ?? streamState.role;

        // assemble a complete tool call by merging new content into existing fragments
        if (choiceDelta?.tool_calls) {
          toolCallsCollected ??= [];
          for (const tcDelta of choiceDelta.tool_calls) {
            const tc = toolCallsCollected[tcDelta.index] ?? {};
            if (tcDelta.id) tc.id = tcDelta.id;
            if (tcDelta.type) tc.type = tcDelta.type;
            if (tcDelta.function) {
              tc.function ??= {};
              if (tcDelta.function?.name) tc.function.name = (tc.function?.name ?? '') + tcDelta.function?.name;
              if (tcDelta.function?.arguments)
                tc.function.arguments = (tc.function.arguments ?? '') + tcDelta.function?.arguments;
            }

            toolCallsCollected[tcDelta.index] = tc;
          }
        }

        if (choiceDelta?.refusal != null) {
          streamState.refusalText = (streamState.refusalText ?? '') + choiceDelta.refusal;
        }

        if (choiceDelta?.content != null) {
          streamState.fullText = (streamState.fullText ?? '') + choiceDelta.content;
        }

        streamState.toolCallsCollected = toolCallsCollected != null;
        curProcessingState = await streamProcessor?.(streamState, curProcessingState, choiceDelta.content ?? undefined);
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') {
        // abort error
        // remove the abort listener, since we don't want to get a second call
        let abortReason: any;
        const errorMessage = 'GPT stream canceled';
        console.error(errorMessage);
        if (!abortController?.signal.aborted) {
          // since this abortion was triggered by most likely a timeout on the GPT side, turn this into a server error
          abortReason = new ServerError(503, errorMessage);
          abortController?.abort(new CanceledError(errorMessage));
        } else {
          abortReason = abortController?.signal.reason;
        }
        throw abortReason;
      } else {
        // // parsing error
        // if (!abortController?.signal.aborted) {
        //     const errorMessage = "GPT json parsing failed: " + e?.message;
        //     console.error("GPT json parsing error, aborting all other ongoing transfers", e, text);
        //     abortController?.abort(new CanceledError(errorMessage));
        //     throw new ServerError(503, errorMessage, e);
        // }

        // general error
        if (!abortController?.signal.aborted) {
          const errorMessage = 'GPT stream error: ' + (e instanceof Error ? e.message : String(e));
          console.error(errorMessage, e);
          console.log('GPT stream error, aborting all other ongoing transfers');
          abortController?.abort(new CanceledError(errorMessage));
          throw new ServerError(503, errorMessage, e);
        }
      }
    }

    // Send the end of the stream on stream end
    console.log('GPT stream end');
    streamState.isStreamOpen = false;
    curProcessingState = await streamProcessor?.(streamState, curProcessingState);

    const choice = makeChoiceFromStreamState(streamState, makeToolCallsFromDeltas(toolCallsCollected));
    if (choice == null) {
      return undefined;
    } else {
      completion.choices.push(choice);
      return completion;
    }
  }
}
