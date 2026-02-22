import {
  BedrockRuntimeClient,
  type BedrockRuntimeClientConfig,
  ContentBlock,
  type ConversationRole,
  ConverseCommand,
  type ConverseCommandInput,
  type ConverseCommandOutput,
  ConverseStreamCommand,
  type ConverseStreamCommandOutput,
  DocumentFormat,
  ImageFormat,
  InternalServerException,
  type Message,
  ModelErrorException,
  ModelStreamErrorException,
  ServiceUnavailableException,
  type StopReason,
  SystemContentBlock,
  ThrottlingException,
  type TokenUsage,
  type Tool,
  type ToolChoice,
  type ToolResultContentBlock,
  ValidationException,
} from '@aws-sdk/client-bedrock-runtime';
import { FetchHttpHandler } from '@smithy/fetch-http-handler';
import { type DocumentType, type Provider } from '@smithy/types';
import { OpenAI } from 'openai';

import { lastElement } from '../../_shared-client/utils/array-utils.ts';
import { decodeBase64 } from '../../_shared-client/utils/base64-utils.ts';
import { type ApiProgressHandler } from '../ApiProgressHandler.ts';
import { LlmAssetProvider } from './LlmAssetProvider.ts';
import { type LlmConfig, type LlmMessageAttachmentType } from './LlmConfig.ts';
import { LlmProvider, makeCompletionTimestamp } from './LlmProvider.ts';
import { type LlmProviderConfig } from './LlmProviderConfig.ts';
import { type LlmProviderFactory, registerProviderFactory } from './LlmProviderFactory.ts';
import { isCompleteAwsAuthConfig } from './LlmProviderSecrets.ts';
import {
  type GptChatFinishReason,
  type LlmInputStreamProcessor,
  type LlmStreamState,
  makeChoiceFromStreamState,
} from './LlmStreamProcessor.ts';

const mimeTypeMapImages = {
  GIF: 'image/gif',
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  WEBP: 'image/webp',
} satisfies Record<keyof typeof ImageFormat, string>;

const mimeTypeToImageFormatMap = Object.fromEntries(
  Object.entries(mimeTypeMapImages).map(([key, value]) => [value, ImageFormat[key as keyof typeof ImageFormat]]),
) satisfies Record<string, ImageFormat>;

function getImageMimeTypeFormat(mimeType: string): ImageFormat | undefined {
  return mimeTypeToImageFormatMap[mimeType];
}

const mimeTypeMapDocs = {
  TXT: 'text/plain',
  CSV: 'text/csv',
  HTML: 'text/html',
  MD: 'text/markdown',
  DOC: 'application/msword',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  PDF: 'application/pdf',
  XLS: 'application/vnd.ms-excel',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
} satisfies Record<keyof typeof DocumentFormat, string>;

const mimeTypeToDocumentFormatMap = Object.fromEntries(
  Object.entries(mimeTypeMapDocs).map(([key, value]) => [value, DocumentFormat[key as keyof typeof DocumentFormat]]),
) satisfies Record<string, DocumentFormat>;

function getDocumentMimeTypeFormat(mimeType: string): DocumentFormat | undefined {
  return mimeTypeToDocumentFormatMap[mimeType];
}

function stopReasonToFinishReason(stopReason?: StopReason): GptChatFinishReason | undefined {
  if (stopReason == null) {
    return undefined;
  }
  switch (stopReason) {
    case 'content_filtered':
    case 'guardrail_intervened':
      return 'content_filter';
    case 'max_tokens':
      return 'length';
    case 'tool_use':
      return 'tool_calls';
    case 'end_turn':
    case 'stop_sequence':
    default:
      return 'stop';
  }
}

async function resolveRegion(region?: string | Provider<string>): Promise<string | undefined> {
  if (typeof region === 'string') {
    return region;
  }

  const providedRegion = region != null ? await region() : region;
  return providedRegion;
}

export async function makeBedrockClient(config?: BedrockRuntimeClientConfig): Promise<BedrockClient> {
  const client = config !== undefined ? new BedrockRuntimeClient(config) : new BedrockRuntimeClient();

  const resolvedRegion = await resolveRegion(client.config.region);
  return new BedrockClient(client, resolvedRegion, config);
}

// we need this class to conserver the original configuration in case we need to make a copy for a different region
// the original configuration cannot be retrieved from the created BedrockRuntimeClient
export class BedrockClient {
  constructor(
    public readonly client: BedrockRuntimeClient,
    public readonly regionResolved?: string,
    public readonly config?: BedrockRuntimeClientConfig,
  ) {}
}

function makeClientForRegion(client: BedrockClient, modelRegions?: Array<string>): BedrockRuntimeClient {
  if (modelRegions != null && modelRegions.length > 0) {
    let newRegion: string | undefined;
    if (client.regionResolved != null) {
      // are we in one of the supported model regions?
      for (const modelRegion of modelRegions) {
        if (modelRegion === client.regionResolved) {
          return client.client;
        }
      }

      const regionPrefixIndex = client.regionResolved.indexOf('-');
      if (regionPrefixIndex > 0) {
        const regionPrefix = client.regionResolved.substring(0, regionPrefixIndex);
        for (const modelRegion of modelRegions) {
          if (modelRegion.startsWith(regionPrefix)) {
            newRegion = modelRegion;
            break;
          }
        }
      }
    }

    // couldn't find a matching region, for now we use the first region
    // TODO: maybe build a more sophisticated region selection
    newRegion ??= modelRegions[0];

    const newRuntimeConfig = { ...client.config };
    newRuntimeConfig.region = newRegion;
    const newClient = new BedrockRuntimeClient(newRuntimeConfig);
    return newClient;
  }
  return client.client;
}

function makeContentBlockFromImageUrl(imageUrl: string): ContentBlock | undefined {
  let format: ImageFormat | undefined;
  const dataTag = 'data:'; // data:image/png;base64,image_data_base64
  if (imageUrl.startsWith(dataTag)) {
    const start = dataTag.length;
    const end = imageUrl.indexOf(',', start);
    if (end > 0) {
      const type = imageUrl.substring(start, end);
      const data = imageUrl.substring(end + 1);
      switch (type) {
        // 'data:image/png;base64,'
        case 'image/png;base64':
          format = ImageFormat.PNG;
          break;
        // 'data:image/jpeg;base64,'
        case 'image/jpeg;base64':
          format = ImageFormat.JPEG;
          break;
        // 'data:image/webp;base64,'
        case 'image/webp;base64':
          format = ImageFormat.WEBP;
          break;
        // 'data:image/gif;base64,'
        case 'image/gif;base64':
          format = ImageFormat.GIF;
          break;
        default:
          console.log(`TODO: unsupported image type ${type}`);
      }
      if (format) {
        const decoded = decodeBase64(data);
        const bytes = new Uint8Array(decoded);
        return {
          image: { format: format, source: { bytes: bytes } },
        };
      }
    }
    console.warn('TODO: unsupported data url');
  } else {
    // TOOD: add image loading functionality here
    console.warn('TODO: loading of images by url not support yet');
  }
}

registerProviderFactory('bedrock', async (secrets) => {
  if (isCompleteAwsAuthConfig(secrets.aws)) {
    const bedrockClient = await makeBedrockClient({
      defaultsMode: 'standard',
      region: secrets.aws.region,
      credentials: {
        accessKeyId: secrets.aws.accessKeyId,
        secretAccessKey: secrets.aws.secretAccessKey,
      },
      // This is needed to allow streaming responses through Supabase Edge Functions running Deno
      // The problem is that the AWS SDK is defaulting to using the native http/2 support in Deno
      // instead of the fetch API. And the edge functions don't seem to register if the http/2 connection is still used, closing it too early during streaming.
      // By switching to the fetch handler this is solved.
      // Fixes this error:
      // runtime has escaped from the event loop unexpectedly: event loop error: Error: stream closed because of a broken pipe
      //      at async node:http2:824:44
      //  failed to send request to user worker: event loop error: Error: stream closed because of a broken pipe
      //      at async node:http2:824:44
      //  user worker failed to respond: event loop error: Error: stream closed because of a broken pipe
      //      at async node:http2:824:44
      //  InvalidWorkerResponse: event loop error: Error: stream closed because of a broken pipe
      //      at async node:http2:824:44
      //      at async Function.allSettled (<anonymous>)
      //      at async UserWorker.fetch (ext:user_workers/user_workers.js:84:63)
      //      at async Object.handler (file:///var/tmp/sb-compile-edge-runtime/root/index.ts:194:14)
      //      at async mapped (ext:runtime/http.js:231:18) {
      //    name: "InvalidWorkerResponse"
      //  }
      //  connection aborted (uri: "/conversation-llm")
      //  client connection error (hyper::Error(User(Service), connection aborted))
      requestHandler: new FetchHttpHandler({
        requestTimeout: 10 * 60 * 1000, // set high enough so that even long LLM generations don't trigger it
      }),
    });
    return new BedrockConverseProviderFactory(bedrockClient);
  }
  return undefined;
});

class BedrockConverseProviderFactory implements LlmProviderFactory {
  constructor(private readonly bedrockClient: BedrockClient) {}
  make(providerConfig: LlmProviderConfig): LlmProvider | undefined {
    return new BedrockConverseProvider(this.bedrockClient, providerConfig);
  }
}

// Supported models:
// https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference.html
// https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference-supported-models-features.html
// https://docs.aws.amazon.com/bedrock/latest/userguide/models-regions.html
// https://docs.aws.amazon.com/bedrock/latest/userguide/bedrock-regions.html
// https://docs.aws.amazon.com/bedrock/latest/userguide/tool-use.html
// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/bedrock-runtime/command/ConverseCommand/
// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/bedrock-runtime/command/ConverseStreamCommand/
export class BedrockConverseProvider extends LlmProvider {
  public readonly bedrockClient: BedrockRuntimeClient;
  constructor(
    public readonly client: BedrockClient,
    providerConfig: LlmProviderConfig,
  ) {
    super(providerConfig);
    this.bedrockClient = makeClientForRegion(client, providerConfig.modelRegions);
  }

  static override providerName(): string {
    return 'bedrock';
  }

  override fullModelName(): string {
    return `${BedrockConverseProvider.providerName()}/${this.providerConfig.modelName}`;
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
    const requestPayload = this.makeRequestPayload(request, assetProvider);

    // console.log("BedrockConverse ChatCompletionRequest", undefined, request); //, request
    //console.dir(request, { depth: null })

    // https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_bedrock-runtime_code_examples.html#mistral_ai
    console.log('BedrockConverse request starting');

    // some models don't support streaming for tool use
    const stream =
      request.stream && (this.config.supportsStreamingTools === true || requestPayload.toolConfig?.tools == null);
    try {
      if (stream) {
        const responsePromise = this.bedrockClient.send(new ConverseStreamCommand(requestPayload), {
          abortSignal: abortController?.signal,
        });
        progress?.onRequestInitiated(responsePromise);

        const bedrockResponse = await responsePromise;
        return await handleStreamResponse(bedrockResponse, request.model, streamProcessor, abortController);
      } else {
        const responsePromise = this.bedrockClient.send(new ConverseCommand(requestPayload), {
          abortSignal: abortController?.signal,
        });
        progress?.onRequestInitiated(responsePromise);

        const bedrockResponse = await responsePromise;
        return await handleNoStreamResponse(bedrockResponse, request.model, streamProcessor);
      }
    } catch (e: unknown) {
      throw toOpenAiError(e);
    }
  }

  public override getImageAttachmentType(mimeType: string): LlmMessageAttachmentType | undefined {
    const exist = getImageMimeTypeFormat(mimeType) != null;
    if (exist) return this.config.supportsImageAttachments?.[0];
    return undefined;
  }

  public override getDocumentAttachmentType(mimeType: string): LlmMessageAttachmentType | undefined {
    const exist = getDocumentMimeTypeFormat(mimeType) != null;
    if (exist) return this.config.supportsDocumentAttachments?.[0];
    return undefined;
  }

  makeRequestPayload(body: OpenAI.ChatCompletionCreateParams, assetProvider?: LlmAssetProvider): ConverseCommandInput {
    const messages: Message[] = [];
    const systemContentBlocks: SystemContentBlock[] = [];

    // Address the error message:
    // The toolConfig field must be defined when using toolUse and toolResult content blocks
    const useTools = this.config.supportsTools && (body.tools?.length ?? 0) > 0;
    for (const message of body.messages) {
      if (message.role === 'system') {
        const contentBlocks = fromSystemCompletionMessage(message);
        systemContentBlocks.push(...contentBlocks);
      } else if (message.role === 'user') {
        const contentBlocks = fromUserCompletionMessage(message, assetProvider);
        addContentBlocksToMessages(message.role, contentBlocks, messages, this.config.supportsAssistantPrefill);
      } else if (message.role === 'assistant') {
        const contentBlocks = fromAssistantCompletionMessage(message);

        if (useTools && message.tool_calls != null) {
          contentBlocks.push(...fromToolCalls(message.tool_calls));
        }
        addContentBlocksToMessages(message.role, contentBlocks, messages, !this.config.supportsAssistantPrefill);
      } else if (useTools && message.role === 'tool') {
        const contentBlock = fromToolCompletionMessage(message);

        const prevMessage = lastElement(messages);
        const prevContents = prevMessage?.role === 'user' ? prevMessage.content : null;
        // if multiple tool calls were done in one go in the previous turn, all reasults are expected to be in the same content message
        // otherwise we get an error such as: ValidationException: Expected toolResult blocks at messages.2.content for the following Ids: tooluse_1K4rTHmjRZqsXD8UbMOzBw, tooluse_j7h-Yfp3TrucYuJKZYBduQ
        if (prevContents != null && lastElement(prevContents)?.toolResult != null) {
          prevContents.push(contentBlock);
        } else {
          messages.push({
            role: 'user',
            content: [contentBlock],
          });
        }
      }
    }

    const lastMessage = lastElement(messages);
    if (lastMessage?.role === 'assistant' && !this.config.supportsAssistantPrefill) {
      // Handle this error by adding a dummy user message
      // stream processing error: The model returned the following errors: Your API request included an `assistant` message in the final position, which would pre-fill the `assistant` response. When using tools, pre-filling the `assistant` response is not supported.

      console.log('Adding dummy user message at end');
      messages.push(makeDummyUserMessage());
    }

    // const tool: Tool = {
    //     toolSpec: {
    //         name: "top_song",
    //         description: "Get the most popular song played on a radio station.",
    //         inputSchema: {
    //             json: {
    //                 type: "object",
    //                 properties: {
    //                     sign: {
    //                         type: "string",
    //                         description: "The call sign for the radio station for which you want the most popular song. Example calls signs are WZPZ and WKRP."
    //                     }
    //                 },
    //                 required: [
    //                     "sign"
    //                 ]
    //             }
    //         }
    //     }
    // }

    const tools = useTools && body.tools ? fromCompletionTools(body.tools) : undefined;

    return {
      modelId: this.providerConfig.modelName,
      messages: messages,
      system: systemContentBlocks.length > 0 ? systemContentBlocks : undefined,
      toolConfig: tools?.length
        ? {
            tools: tools,
            toolChoice: this.config.supportsToolChoice ? fromGptToolChoice(this.config, body.tool_choice) : undefined,
          }
        : undefined,
      inferenceConfig: {
        maxTokens: body.max_completion_tokens ?? undefined,
        temperature: body.temperature ?? undefined,
        topP: body.top_p ?? undefined,
        stopSequences: typeof body.stop === 'string' ? [body.stop] : (body.stop ?? undefined),
      },
      additionalModelRequestFields: this.config.additionalRequestFields,
    };
  }
}

function fromSystemCompletionMessage(message: OpenAI.ChatCompletionSystemMessageParam): SystemContentBlock[] {
  const systemContentBlocks: SystemContentBlock[] = [];
  if (typeof message.content === 'string') {
    systemContentBlocks.push({ text: message.content });
  } else if (Array.isArray(message.content)) {
    for (const contentPart of message.content) {
      switch (contentPart.type) {
        case 'text':
          systemContentBlocks.push({ text: contentPart.text });
          break;
        default:
          console.warn(`TODO: object content type ${contentPart.type} not properly converted yet`);
      }
    }
  } else if (message.content != null) {
    console.warn('TODO: object content type not properly converted yet');
  }
  return systemContentBlocks;
}

function addContentBlocksToMessages(
  conversationRole: ConversationRole,
  contentBlocks: ContentBlock[],
  messages: Message[] = [],
  supportsAssistantPrefill?: boolean,
) {
  if (contentBlocks.length > 0) {
    // add a dummy user message at the beginning to address the error:
    // ValidationException: A conversation must start with a user message. Try again with a conversation that starts with a user message.
    if (messages.length === 0 && conversationRole !== 'user' /*&& !supportsAssistantPrefill*/) {
      console.log('Adding dummy user message at beginning');
      messages.push(makeDummyUserMessage());
    }
    const prevMessage = lastElement(messages);
    if (prevMessage?.content && prevMessage?.role === conversationRole) {
      //  Handle error: A conversation must alternate between user and assistant roles. Make sure the conversation alternates between user and assistant roles and try again.
      prevMessage.content = [...prevMessage.content, ...contentBlocks];
    } else {
      messages.push({
        role: conversationRole,
        content: contentBlocks,
      });
    }
  }
}

function makeDummyUserMessage(): Message {
  return {
    role: 'user',
    content: [
      {
        // cannot be just '' as we get this error: The text field in the ContentBlock object at messages.0.content.0 is blank. Add text to the text field, and try again.'
        text: '.',
      },
    ],
  };
}

function fromUserCompletionMessage(
  message: OpenAI.ChatCompletionUserMessageParam,
  assetProvider?: LlmAssetProvider,
): ContentBlock[] {
  const contentBlocks: ContentBlock[] = [];
  if (typeof message.content === 'string') {
    contentBlocks.push({ text: message.content });
  } else if (Array.isArray(message.content)) {
    for (const contentPart of message.content) {
      switch (contentPart.type) {
        case 'text':
          contentBlocks.push({ text: contentPart.text });
          break;
        case 'image_url':
          {
            const contentBlock = fromImageContentPart(contentPart, assetProvider);
            if (contentBlock) {
              contentBlocks.push(contentBlock);
            }
          }
          break;
        case 'input_audio':
        // TODO: add additional support for document nodes into OpenAi format
        // falls through
        default:
          console.warn(`TODO: object content type ${contentPart.type} not properly converted yet`);
      }
    }
  } else {
    console.warn('TODO: object content type not properly converted yet');
  }
  return contentBlocks;
}

function fromImageContentPart(
  contentPart: OpenAI.ChatCompletionContentPartImage,
  assetProvider?: LlmAssetProvider,
): ContentBlock | undefined {
  // retrieve prepared image from the provider
  const asset = assetProvider?.getAsset(contentPart.image_url.url);
  if (asset) {
    if (asset.destArrayBuffer) {
      const format = asset.srcAsset.mimeType ? getImageMimeTypeFormat(asset.srcAsset.mimeType) : undefined;
      if (format) {
        return {
          image: { format: format, source: { bytes: new Uint8Array(asset.destArrayBuffer) } },
        };
      } else {
        console.warn(`TODO: expecting asset as arraybuffer but none available`);
      }
    } else if (asset.destUrl) {
      return makeContentBlockFromImageUrl(asset.destUrl);
    } else {
      console.warn(`TODO: expecting asset as arraybuffer but none available`);
    }
  } else {
    return makeContentBlockFromImageUrl(contentPart.image_url.url);
  }
}

function fromAssistantCompletionMessage(message: OpenAI.ChatCompletionAssistantMessageParam): ContentBlock[] {
  const contentBlocks: ContentBlock[] = [];
  if (typeof message.content === 'string') {
    contentBlocks.push({ text: message.content });
  } else if (Array.isArray(message.content)) {
    for (const contentPart of message.content) {
      switch (contentPart.type) {
        case 'text':
          contentBlocks.push({ text: contentPart.text });
          break;
        case 'refusal':
        default:
          console.warn(`TODO: object content type ${contentPart.type} not properly converted yet`);
      }
    }
  } else if (message.content != null) {
    console.warn('TODO: object content type not properly converted yet');
  }
  return contentBlocks;
}

function fromToolCompletionMessage(message: OpenAI.ChatCompletionToolMessageParam): ContentBlock {
  const toolContents: ToolResultContentBlock[] = [];
  if (typeof message.content === 'string') {
    toolContents.push({ text: message.content });
  } else if (Array.isArray(message.content)) {
    for (const contentPart of message.content) {
      switch (contentPart.type) {
        case 'text':
          toolContents.push({ text: contentPart.text });
          break;
        default:
          console.warn(`TODO: object content type ${contentPart.type} not properly converted yet`);
      }
    }
  } else if (message.content != null) {
    console.warn('TODO: object content type not properly converted yet');
  }
  const contentBlock: ContentBlock = {
    toolResult: {
      toolUseId: message.tool_call_id,
      content: toolContents,
    },
  };
  return contentBlock;
}

function fromToolCalls(toolCalls: OpenAI.ChatCompletionMessageToolCall[]): ContentBlock[] {
  const contentBlocks: ContentBlock[] = [];
  for (const toolCall of toolCalls) {
    if (toolCall.type === 'function') {
      try {
        const argsJson = JSON.parse(toolCall.function.arguments) satisfies DocumentType | undefined;
        contentBlocks.push({
          toolUse: {
            toolUseId: toolCall.id,
            name: toolCall.function.name,
            input: argsJson,
          },
        });
      } catch (e: unknown) {
        console.warn('Cannot parse to JSON', toolCall.function.arguments, e);
      }
    }
  }
  return contentBlocks;
}

function fromCompletionTools(completionTools: OpenAI.ChatCompletionTool[]): Tool[] | undefined {
  const tools: Tool[] = [];
  for (const oaiTool of completionTools) {
    if (oaiTool.type === 'function') {
      const tool: Tool = {
        toolSpec: {
          name: oaiTool.function.name,
          description: oaiTool.function.description,
          inputSchema: {
            json: oaiTool.function.parameters as DocumentType,
          },
        },
      };
      tools.push(tool);
    } else {
      console.warn(`TODO: tool.type "${oaiTool.type}" not properly converted yet`);
    }
  }
  return tools.length ? tools : undefined;
}

function fromGptToolChoice(
  config: LlmConfig,
  toolChoice: OpenAI.ChatCompletionToolChoiceOption | undefined,
): ToolChoice | undefined {
  if (toolChoice != null) {
    switch (toolChoice) {
      case 'auto':
        return { auto: {} };
      case 'required':
        return { any: {} };
      case 'none':
        return undefined;
      default:
        break;
    }

    if (config.supportsToolChoiceByName) {
      if (toolChoice.type === 'function') {
        return {
          tool: {
            name: toolChoice.function.name,
          },
        };
      } else {
        console.warn(`TODO: toolChoice.type "${toolChoice.type}" not properly converted yet`);
      }
    }
  }
  return undefined;
}

async function handleNoStreamResponse<S>(
  commandOutput: ConverseCommandOutput,
  modelName: string,
  streamProcessor?: LlmInputStreamProcessor<S>,
): Promise<OpenAI.ChatCompletion | undefined> {
  // console.log("Response data", undefined, response);
  //console.dir(response, { depth: null })

  const contents = commandOutput.output?.message?.content;
  if (commandOutput.output?.message?.role !== 'assistant') {
    console.warn(`Unexpected role ${commandOutput.output?.message?.role}`);
  }

  const streamState: LlmStreamState = {
    isStreamOpen: false,
    choiceIndex: 0,
    finishReason: stopReasonToFinishReason(commandOutput.stopReason),
    role: commandOutput.output?.message?.role,
    toolCallsCollected: false,
  };

  const toolCalls: Array<OpenAI.ChatCompletionMessageToolCall> = [];
  if (contents != null) {
    for (const content of contents) {
      if (content.text) {
        streamState.fullText = (streamState.fullText ?? '') + content.text;
      } else if (content.image) {
        console.warn(`Use of ImageBlock not expected`);
      } else if (content.document) {
        console.warn(`Use of DocumentBlock not expected`);
      } else if (content.video) {
        console.warn(`Use of VideoBlock not expected`);
      } else if (content.audio) {
        console.warn(`Use of AudioBlock not expected`);
      } else if (content.toolUse) {
        const value = content.toolUse;
        if (value.toolUseId != null && value.name != null) {
          const argumentsJson = JSON.stringify(value.input ?? null);
          toolCalls.push({
            id: value.toolUseId,
            type: 'function',
            function: {
              name: value.name,
              arguments: argumentsJson,
            },
          });
        }
      } else if (content.toolResult) {
        console.warn(`Use of ToolResultBlock not expected`);
      } else if (content.guardContent) {
        console.warn(`Use of GuardrailConverseContentBlock not expected`);
      } else if (content.cachePoint) {
        console.warn(`Use of cachePoint not expected`);
      } else if (content.reasoningContent) {
        console.warn(`Use of ReasoningContent not expected`);
      } else if (content.citationsContent) {
        console.warn(`Use of CitationsContentBlock not expected`);
      } else if (content.searchResult) {
        console.warn(`Use of SearchResultBlock not expected`);
      } else if (content.$unknown) {
        console.log('Unknown ContentBlock key', content.$unknown);
      }
    }
  }

  streamState.toolCallsCollected = toolCalls.length > 0;
  await streamProcessor?.(streamState, undefined, streamState.fullText ?? undefined);

  const choice = makeChoiceFromStreamState(streamState, toolCalls.length > 0 ? toolCalls : undefined);

  if (choice == null) {
    return undefined;
  }

  const timestamp = makeCompletionTimestamp();
  const metaData = commandOutput.$metadata;
  const completion: OpenAI.ChatCompletion = {
    id: metaData.requestId ?? metaData.extendedRequestId ?? metaData.cfId ?? timestamp.toString(),
    choices: [choice],
    created: timestamp,
    model: modelName,
    object: 'chat.completion',
  };

  const usage = commandOutput.usage;
  // const latencyMs = response.metrics?.latencyMs;
  if (usage != null) {
    completion.usage = {
      prompt_tokens: usage?.inputTokens ?? 0,
      completion_tokens: usage?.outputTokens ?? 0,
      total_tokens: usage?.totalTokens ?? 0,
    };
  }
  return completion;
}

async function handleStreamResponse<S>(
  commandOutput: ConverseStreamCommandOutput,
  modelName: string,
  streamProcessor?: LlmInputStreamProcessor<S>,
  abortController?: AbortController,
): Promise<OpenAI.ChatCompletion | undefined> {
  const stream = commandOutput.stream;
  if (stream == null) {
    return undefined;
  }

  const timestamp = makeCompletionTimestamp();
  const metaData = commandOutput.$metadata;
  const completion: OpenAI.ChatCompletion = {
    id: metaData.requestId ?? metaData.extendedRequestId ?? metaData.cfId ?? timestamp.toString(),
    created: timestamp,
    model: modelName,
    object: 'chat.completion',
    choices: [],
  };
  const streamState: LlmStreamState = {
    isStreamOpen: true,
    choiceIndex: 0,
    toolCallsCollected: false,
  };
  let curProcessingState: S | undefined;

  let curToolCall: OpenAI.ChatCompletionMessageFunctionToolCall | undefined = undefined;
  const toolCalls: OpenAI.ChatCompletionMessageToolCall[] = [];

  console.log('BedrockConverse stream waiting');

  //const contents: ContentBlock[] = [];
  let tokenUsage: TokenUsage | undefined;
  let latencyMs: number | undefined;

  // Extract and print the response stream in real-time.
  for await (const chunk of stream) {
    let newContent: string | undefined;
    let _streamText = false;
    if (chunk.messageStart) {
      if (chunk.messageStart.role !== 'assistant') {
        console.warn(`Unexpected role ${chunk.messageStart.role}`);
      }
      streamState.role = chunk.messageStart.role;
      _streamText = false;
    } else if (chunk.contentBlockStart) {
      const value1 = chunk.contentBlockStart;
      const index = value1.contentBlockIndex;
      const start = value1.start;
      if (start && index != null) {
        if (start.toolUse) {
          const value = start.toolUse;
          if (value.toolUseId != null && value.name != null) {
            curToolCall = {
              id: value.toolUseId,
              type: 'function',
              function: {
                name: value.name,
                arguments: '',
              },
            };
          }
        } else if (start.toolResult) {
          console.warn(`Use of ToolResultBlockStart not expected`);
        } else if (start.image) {
          console.warn(`Use of ImageBlockStart not expected`);
        } else if (start.$unknown) {
          console.log('Unknown ContentBlockStart key', start.$unknown);
        }
      }
      _streamText = false;
    } else if (chunk.contentBlockDelta) {
      const value1 = chunk.contentBlockDelta;
      const index = value1.contentBlockIndex;

      if (value1.delta && index != null) {
        const value = value1.delta;
        if (value.text) {
          newContent = value.text;
          streamState.fullText = (streamState.fullText ?? '') + newContent;
          _streamText = true;
        } else if (value.toolUse) {
          if (curToolCall != null) {
            if (value.toolUse.input != null) {
              curToolCall.function.arguments += value.toolUse.input;
            }
          } else {
            console.warn(`Missing previous tool delta`);
          }
          _streamText = false;
        } else if (value.toolResult) {
          console.warn(`Use of ToolResultBlockDelta not expected`);
          _streamText = true;
        } else if (value.reasoningContent) {
          console.warn(`Use of ReasoningContent not expected`);
          _streamText = true;
        } else if (value.citation) {
          console.warn(`Use of CitationsDelta not expected`);
          _streamText = false;
        } else if (value.image) {
          console.warn(`Use of ImageBlockDelta not expected`);
          _streamText = false;
        } else if (value.$unknown) {
          console.log('Unknown ContentBlockDelta key', value.$unknown);
          _streamText = false;
        }
      }
    } else if (chunk.contentBlockStop) {
      const index = chunk.contentBlockStop.contentBlockIndex;
      if (index != null) {
        if (curToolCall != null) {
          toolCalls.push(curToolCall);
          curToolCall = undefined;
        }
      }
      _streamText = false;
    } else if (chunk.messageStop) {
      streamState.finishReason = stopReasonToFinishReason(chunk.messageStop.stopReason);
      _streamText = true;
    } else if (chunk.metadata) {
      latencyMs = chunk.metadata.metrics?.latencyMs;
      tokenUsage = chunk.metadata.usage;
      _streamText = false;
    } else if (chunk.internalServerException) {
      throw toOpenAiError(chunk.internalServerException);
    } else if (chunk.modelStreamErrorException) {
      throw toOpenAiError(chunk.modelStreamErrorException);
    } else if (chunk.validationException) {
      throw toOpenAiError(chunk.validationException);
    } else if (chunk.throttlingException) {
      throw toOpenAiError(chunk.throttlingException);
    } else if (chunk.serviceUnavailableException) {
      throw toOpenAiError(chunk.serviceUnavailableException);
    } else if (chunk.$unknown) {
      console.log('Unknown ConverseStreamOutput key', chunk.$unknown);
      _streamText = false;
    }

    streamState.toolCallsCollected = toolCalls.length > 0;
    curProcessingState = await streamProcessor?.(streamState, curProcessingState, newContent);
  }

  // Send the end of the stream on stream end
  console.log('BedrockConverse stream end');

  streamState.isStreamOpen = false;
  curProcessingState = await streamProcessor?.(streamState, curProcessingState);

  const choice = makeChoiceFromStreamState(streamState, toolCalls.length > 0 ? toolCalls : undefined);
  if (choice == null) {
    return undefined;
  } else {
    completion.choices.push(choice);
    // const latencyMs;
    if (tokenUsage != null) {
      completion.usage = {
        prompt_tokens: tokenUsage?.inputTokens ?? 0,
        completion_tokens: tokenUsage?.outputTokens ?? 0,
        total_tokens: tokenUsage?.totalTokens ?? 0,
      };
    }
    return completion;
  }
}

function toOpenAiError(e: unknown): unknown {
  if (e instanceof InternalServerException) {
    console.log(`Handled Bedrock InternalServerException: ${JSON.stringify(e)}`);
    return new OpenAI.InternalServerError(e.$metadata.httpStatusCode ?? 500, e, e.message, new Headers());
  } else if (e instanceof ModelStreamErrorException) {
    console.log(`Handled Bedrock ModelStreamErrorException: ${JSON.stringify(e)}`);
    return new OpenAI.APIError(e.originalStatusCode ?? e.$metadata.httpStatusCode ?? 400, e, e.message, new Headers());
  } else if (e instanceof ValidationException) {
    console.log(`Handled Bedrock ValidationException: ${JSON.stringify(e)}`);
    return new OpenAI.APIError(e.$metadata.httpStatusCode ?? 400, e, e.message, new Headers());
  } else if (e instanceof ThrottlingException) {
    console.log(`Handled Bedrock ThrottlingException: ${JSON.stringify(e)}`);
    return new OpenAI.RateLimitError(429, e, e.message, new Headers());
  } else if (e instanceof ServiceUnavailableException) {
    console.log(`Handled Bedrock ServiceUnavailableException: ${JSON.stringify(e)}`);
    // Rather use OpenAI.APIConnectionError?. But it doesn't support passing messages
    // OpenAI.APIConnectionTimeoutError
    return new OpenAI.RateLimitError(429, e, e.message, new Headers());
  } else if (e instanceof ModelErrorException) {
    console.log(`Handled Bedrock ModelErrorException: ${JSON.stringify(e)}`);
    return new OpenAI.APIConnectionError({ message: e.message, cause: e });
  }
  console.warn(`TODO: Add support for converting exception: ${JSON.stringify(e)}`);
  return e;
}
