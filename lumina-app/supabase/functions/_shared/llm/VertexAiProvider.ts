// TODO: check if the dependencies for gcp-metadata@6.1.0 need to stay locked: https://github.com/orgs/supabase/discussions/33244

import { OpenAI } from 'openai';
import {
  type Content,
  FinishReason,
  FunctionCallingMode,
  type FunctionDeclaration,
  type FunctionDeclarationSchema,
  type GenerateContentResponse,
  type GenerateContentRequest,
  type GenerateContentResult,
  GenerativeModel,
  type StreamGenerateContentResult,
  type Part,
  type Schema,
  SchemaType,
  type Tool,
  type ToolConfig,
  type UsageMetadata,
  VertexAI,
  type VertexInit,
} from '@google-cloud/vertexai';
import { GoogleAuth } from 'google-auth-library';

import { type ApiProgressHandler } from '../ApiProgressHandler.ts';
import { LlmAssetProvider } from './LlmAssetProvider.ts';
import { type LlmConfig, type LlmMessageAttachmentType } from './LlmConfig.ts';
import { LlmProvider, makeCompletionTimestamp } from './LlmProvider.ts';
import { type LlmProviderConfig } from './LlmProviderConfig.ts';
import { isCompleteGoogleAuthConfig } from './LlmProviderSecrets.ts';
import { type LlmProviderFactory, registerProviderFactory } from './LlmProviderFactory.ts';
import {
  type LlmInputStreamProcessor,
  type GptChatFinishReason,
  type LlmStreamState,
  makeChoiceFromStreamState,
} from './LlmStreamProcessor.ts';
import { OpenAiProvider } from './OpenAiProvider.ts';

import { firstElement, lastElement } from '../../_shared-client/utils/array-utils.ts';
import { dateFromTimestampString } from '../../_shared-client/utils/time-utils.ts';

function stopReasonToFinishReason(toolsCalled: boolean, finishReason?: FinishReason): GptChatFinishReason | undefined {
  if (!finishReason) {
    return undefined;
  }
  switch (finishReason) {
    case FinishReason.MAX_TOKENS:
      return 'length';
    case FinishReason.SAFETY:
    case FinishReason.RECITATION:
    case FinishReason.BLOCKLIST:
    case FinishReason.PROHIBITED_CONTENT:
    case FinishReason.SPII:
      return 'content_filter';

    case FinishReason.FINISH_REASON_UNSPECIFIED:
    case FinishReason.OTHER:
    case FinishReason.STOP:
    default:
      return toolsCalled ? 'tool_calls' : 'stop';
  }
}

registerProviderFactory('vertexai-oai', async (secrets) => {
  if (isCompleteGoogleAuthConfig(secrets.google)) {
    const vertexAiConfig: VertexInit = {
      project: secrets.google.projectId,
      location: secrets.google.location,
      googleAuthOptions: {
        credentials: {
          type: secrets.google.type,
          client_email: secrets.google.clientEmail,
          private_key: secrets.google.privateKey,
        },
      },
    };
    return new VertexAiOaiProviderFactory(vertexAiConfig);
  }

  return undefined;
});

registerProviderFactory('vertexai', async (secrets) => {
  if (isCompleteGoogleAuthConfig(secrets.google)) {
    const vertexAiConfig: VertexInit = {
      project: secrets.google.projectId,
      location: secrets.google.location,
      googleAuthOptions: {
        credentials: {
          type: secrets.google.type,
          client_email: secrets.google.clientEmail,
          private_key: secrets.google.privateKey,
        },
      },
    };
    const vertexAI = new VertexAI(vertexAiConfig);
    return new VertexAiProviderFactory(vertexAI);
  }
  return undefined;
});

// OpenAi compatible endpoint in Vertex AI
class VertexAiOaiProviderFactory implements LlmProviderFactory {
  constructor(private readonly vertexAiConfig: VertexInit) {}
  make(providerConfig: LlmProviderConfig): LlmProvider | undefined {
    // https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/call-vertex-using-openai-library
    const googleOpenAiBaseUrl = `https://${this.vertexAiConfig.location}-aiplatform.googleapis.com/v1beta1/projects/${this.vertexAiConfig.project}/locations/${this.vertexAiConfig.location}/endpoints/openapi`;
    const openAiClient = new OpenAI({ baseURL: googleOpenAiBaseUrl });
    const googleAuth = new GoogleAuth(this.vertexAiConfig.googleAuthOptions);

    return new OpenAiProvider(openAiClient, providerConfig, () => googleAuth?.getAccessToken());
  }
}

class VertexAiProviderFactory implements LlmProviderFactory {
  constructor(private readonly vertexAiClient: VertexAI) {}
  make(providerConfig: LlmProviderConfig): LlmProvider | undefined {
    return new VertexAiProvider(this.vertexAiClient, providerConfig);
  }
}

export class VertexAiProvider extends LlmProvider {
  public readonly vertexAiModel: GenerativeModel;
  constructor(
    public client: VertexAI,
    providerConfig: LlmProviderConfig,
  ) {
    super(providerConfig);
    this.vertexAiModel = client.getGenerativeModel({
      model: providerConfig.modelName,
    });
  }

  static override providerName(): string {
    return 'vertexai';
  }

  override fullModelName(): string {
    return `${VertexAiProvider.providerName()}/${this.providerConfig.modelName}`;
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

    // console.debug('VertexAi ChatCompletionRequest', undefined, requestPayload); //, request
    // console.dir(request, { depth: null });
    // console.dir(requestPayload, { depth: null });
    console.debug('VertexAi Done printing ChatCompletionRequest');

    console.debug('VertexAi request starting');

    // some models don't support streaming for tool use
    const stream = request.stream && (this.config.supportsStreamingTools === true || requestPayload.tools == null);
    try {
      if (stream) {
        const responsePromise = this.vertexAiModel.generateContentStream(requestPayload);
        progress?.onRequestInitiated(responsePromise);

        const vertexAiResponse = await responsePromise;
        return await handleStreamResponse(vertexAiResponse, request.model, streamProcessor, abortController); // TODO: add streaming support
      } else {
        const responsePromise = this.vertexAiModel.generateContent(requestPayload);
        progress?.onRequestInitiated(responsePromise);

        const vertexAiResponse = await responsePromise;
        return await handleNoStreamResponse(vertexAiResponse, request.model, streamProcessor);
      }
    } catch (e: any) {
      throw toOpenAiError(e);
    }
  }

  makeRequestPayload(
    body: OpenAI.Chat.ChatCompletionCreateParams,
    assetProvider?: LlmAssetProvider,
  ): GenerateContentRequest {
    const messages: Content[] = [];
    const systemMessages: string[] = [];

    const useTools = this.config.supportsTools && (body.tools?.length ?? 0) > 0;
    for (const message of body.messages) {
      if (message.role === 'system') {
        const systemTexts = fromSystemCompletionMessage(message);
        systemMessages.push(...systemTexts);
      } else if (message.role === 'user') {
        const parts = fromUserCompletionMessage(message, assetProvider);
        messages.push({ role: message.role, parts: parts }); //this.addPartsToMessages(message.role, parts, messages);
      } else if (message.role === 'assistant') {
        const parts = fromAssistantCompletionMessage(message);

        if (useTools && message.tool_calls != null) {
          parts.push(...fromToolCalls(message.tool_calls));
        }
        messages.push({ role: message.role, parts: parts }); //this.addPartsToMessages(message.role, parts, messages);
      } else if (useTools && message.role === 'tool') {
        const part = fromToolCompletionMessage(message);
        messages.push({ role: message.role, parts: [part] });
      }
    }

    const tools = useTools && body.tools ? fromCompletionTools(body.tools) : undefined;

    return {
      contents: messages,
      systemInstruction: systemMessages.length > 0 ? systemMessages.join('\n') : undefined,
      generationConfig: {
        maxOutputTokens: body.max_completion_tokens ?? undefined,
        temperature: body.temperature ?? undefined,
        topP: body.top_p ?? undefined,
        stopSequences: typeof body.stop === 'string' ? [body.stop] : (body.stop ?? undefined),
      },
      tools: tools,
      toolConfig: this.config.supportsToolChoice ? fromGptToolChoice(this.config, body.tool_choice) : undefined,
    };
  }
}
function fromSystemCompletionMessage(message: OpenAI.ChatCompletionSystemMessageParam): string[] {
  const systemTexts: string[] = [];
  if (typeof message.content === 'string') {
    systemTexts.push(message.content);
  } else if (Array.isArray(message.content)) {
    for (const contentPart of message.content) {
      switch (contentPart.type) {
        case 'text':
          systemTexts.push(contentPart.text);
          break;
        default:
          console.warn(`TODO: object content type ${contentPart.type} not properly converted yet`);
      }
    }
  } else if (message.content != null) {
    console.warn('TODO: object content type not properly converted yet');
  }
  return systemTexts;
}

function fromUserCompletionMessage(
  message: OpenAI.ChatCompletionUserMessageParam,
  assetProvider?: LlmAssetProvider,
): Part[] {
  const parts: Part[] = [];
  if (typeof message.content === 'string') {
    parts.push({ text: message.content });
  } else if (Array.isArray(message.content)) {
    for (const contentPart of message.content) {
      switch (contentPart.type) {
        case 'text':
          parts.push({ text: contentPart.text });
          break;
        case 'image_url':
          {
            const part = fromImageContentPart(contentPart, assetProvider);
            if (part) {
              parts.push(part);
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
  return parts;
}

function fromImageContentPart(
  contentPart: OpenAI.ChatCompletionContentPartImage,
  assetProvider?: LlmAssetProvider,
): Part | undefined {
  // // retrieve prepared image from the provider
  // const asset = assetProvider.getAsset(contentPart.image_url.url);
  // if (asset) {
  //   if (asset.destArrayBuffer) {
  //     const format = asset.srcAsset.mimeType ? getImageMimeTypeFormat(asset.srcAsset.mimeType) : undefined;
  //     if (format) {
  //       return {
  //         image: { format: format, source: { bytes: new Uint8Array(asset.destArrayBuffer) } },
  //       };
  //     } else {
  //       console.warn(`TODO: expecting asset as arraybuffer but none available`);
  //     }
  //   } else if (asset.destUrl) {
  //     return makePartFromImageUrl(asset.destUrl);
  //   } else {
  //     console.warn(`TODO: expecting asset as arraybuffer but none available`);
  //   }
  // } else {
  //   return makePartFromImageUrl(contentPart.image_url.url);
  // }
  return undefined;
}

function fromAssistantCompletionMessage(message: OpenAI.ChatCompletionAssistantMessageParam): Part[] {
  const parts: Part[] = [];
  if (typeof message.content === 'string') {
    parts.push({ text: message.content });
  } else if (Array.isArray(message.content)) {
    for (const contentPart of message.content) {
      switch (contentPart.type) {
        case 'text':
          parts.push({ text: contentPart.text });
          break;
        case 'refusal':
        default:
          console.warn(`TODO: object content type ${contentPart.type} not properly converted yet`);
      }
    }
  } else if (message.content != null) {
    console.warn('TODO: object content type not properly converted yet');
  }
  return parts;
}

function fromToolCompletionMessage(message: OpenAI.ChatCompletionToolMessageParam): Part {
  const toolContents: string[] = [];
  if (typeof message.content === 'string') {
    toolContents.push(message.content);
  } else if (Array.isArray(message.content)) {
    for (const contentPart of message.content) {
      switch (contentPart.type) {
        case 'text':
          toolContents.push(contentPart.text);
          break;
        default:
          console.warn(`TODO: object content type ${contentPart.type} not properly converted yet`);
      }
    }
  } else if (message.content != null) {
    console.warn('TODO: object content type not properly converted yet');
  }
  const part: Part = {
    functionResponse: {
      // We need to use the id field for the function name
      // - when the call was received, we placed the name in the id field to carry it through from to the response call
      name: message.tool_call_id,
      // TODO: it's not entirely clear what format we need to supply the text responses back
      // we can't directly assign the list to response, adding it to a field inside an object seems to work
      response: { content: toolContents },
    },
  };
  return part;
}

function fromToolCalls(toolCalls: OpenAI.ChatCompletionMessageToolCall[]): Part[] {
  const parts: Part[] = [];
  for (const toolCall of toolCalls) {
    if (toolCall.type === 'function') {
      try {
        const argsJson = JSON.parse(toolCall.function.arguments);
        parts.push({
          functionCall: {
            // toolUseId: toolCall.id,
            name: toolCall.function.name,
            args: argsJson,
          },
        });
      } catch (e: unknown) {
        console.warn('Cannot parse to JSON', toolCall.function.arguments, e);
      }
    }
  }
  return parts;
}

export function fromCompletionTools(completionTools: OpenAI.ChatCompletionTool[]): Tool[] | undefined {
  const tools: Tool[] = [];
  const functionDeclarations: FunctionDeclaration[] = [];

  for (const oaiTool of completionTools) {
    if (oaiTool.type === 'function') {
      const functionDeclaration: FunctionDeclaration = {
        name: oaiTool.function.name,
        description: oaiTool.function.description,
        parameters: oaiTool.function.parameters
          ? convertToFunctionDeclarationSchema(oaiTool.function.parameters)
          : undefined,
      };
      functionDeclarations.push(functionDeclaration);
    } else {
      console.warn(`TODO: tool.type "${oaiTool.type}" not properly converted yet`);
    }
  }
  if (functionDeclarations.length) {
    tools.push({ functionDeclarations: functionDeclarations });
  }

  return tools.length ? tools : undefined;
}

export function convertToFunctionDeclarationSchema(parameters: OpenAI.FunctionParameters): FunctionDeclarationSchema {
  const jsonSchema = parameters as {
    type: string;
    properties: Record<string, any>;
    required?: string[];
    description?: string;
  };

  const properties: Record<string, Schema> = {};

  for (const [key, value] of Object.entries(jsonSchema.properties)) {
    properties[key] = convertJsonSchemaPropertyToSchema(value);
  }

  return {
    type: SchemaType.OBJECT,
    properties,
    required: jsonSchema.required,
    description: jsonSchema.description,
  };
}

export function convertJsonSchemaTypeToSchemaType(jsonSchemaType: string): SchemaType {
  switch (jsonSchemaType?.toLowerCase()) {
    case 'string':
      return SchemaType.STRING;
    case 'number':
      return SchemaType.NUMBER;
    case 'integer':
      return SchemaType.INTEGER;
    case 'boolean':
      return SchemaType.BOOLEAN;
    case 'array':
      return SchemaType.ARRAY;
    case 'object':
      return SchemaType.OBJECT;
    default:
      return SchemaType.STRING; // default fallback
  }
}

export function convertJsonSchemaPropertyToSchema(property: any): Schema {
  const schema: Schema = {
    type: convertJsonSchemaTypeToSchemaType(property.type),
  };

  if (property.description) {
    schema.description = property.description;
  }

  if (property.enum) {
    schema.enum = property.enum;
  }

  if (property.format) {
    schema.format = property.format;
  }

  if (property.type === 'array' && property.items) {
    schema.items = convertJsonSchemaPropertyToSchema(property.items);
  }

  if (property.type === 'object' && property.properties) {
    schema.properties = {};
    for (const [key, value] of Object.entries(property.properties)) {
      schema.properties[key] = convertJsonSchemaPropertyToSchema(value);
    }
    if (property.required) {
      schema.required = property.required;
    }
  }

  return schema;
}

function fromGptToolChoice(
  config: LlmConfig,
  toolChoice?: OpenAI.ChatCompletionToolChoiceOption,
): ToolConfig | undefined {
  if (toolChoice != null) {
    switch (toolChoice) {
      case 'auto':
        return { functionCallingConfig: { mode: FunctionCallingMode.AUTO } };
      case 'required':
        return { functionCallingConfig: { mode: FunctionCallingMode.ANY } };
      case 'none':
        return { functionCallingConfig: { mode: FunctionCallingMode.NONE } };
      default:
        break;
    }

    if (config.supportsToolChoiceByName) {
      if (toolChoice.type === 'function') {
        return {
          functionCallingConfig: {
            allowedFunctionNames: [toolChoice.function.name],
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
  contentResult: GenerateContentResult,
  modelName: string,
  streamProcessor?: LlmInputStreamProcessor<S>,
): Promise<OpenAI.ChatCompletion | undefined> {
  console.debug('Response data', undefined, contentResult);
  //console.dir(response, { depth: null })

  const contentResponse = contentResult.response;

  const candidate = firstElement(contentResponse.candidates);
  const content = candidate?.content;
  const parts = content?.parts;

  if (content?.role !== 'model') {
    console.warn(`Unexpected role ${content?.role}`);
  }

  const streamState: LlmStreamState = {
    isStreamOpen: false,
    choiceIndex: 0,
    role: toOpenAiRole(content?.role),
    toolCallsCollected: false,
  };

  const toolCalls: Array<OpenAI.ChatCompletionMessageToolCall> = [];

  if (parts != null) {
    for (const part of parts) {
      if (part.text) {
        streamState.fullText = (streamState.fullText ?? '') + part.text;
      } else if (part.inlineData) {
        console.warn(`Use of inlineData not expected`);
      } else if (part.fileData) {
        console.warn(`Use of fileData not expected`);
      } else if (part.functionResponse) {
        console.warn(`Use of functionResponse not expected`);
      } else if (part.functionCall) {
        const argumentsJson = JSON.stringify(part.functionCall.args);
        toolCalls.push({
          // we need to use the id field for the function name so we can use it to carry the name through to the response call
          id: part.functionCall.name,
          type: 'function',
          function: {
            name: part.functionCall.name,
            arguments: argumentsJson,
          },
        });
      }
    }
  }

  streamState.toolCallsCollected = toolCalls.length > 0;
  streamState.finishReason = stopReasonToFinishReason(streamState.toolCallsCollected, candidate?.finishReason);
  await streamProcessor?.(streamState, undefined, streamState.fullText ?? undefined);

  const choice = makeChoiceFromStreamState(streamState, toolCalls.length > 0 ? toolCalls : undefined);

  if (choice == null) {
    return undefined;
  }

  const timestamp = makeCompletionTimestamp();
  const res: OpenAI.ChatCompletion = {
    id: getIdFromResponse(contentResponse) ?? timestamp.toString(),
    choices: [choice],
    created: getCreatedAtSecsFromResponse(contentResponse) ?? timestamp,
    model: modelName,
    object: 'chat.completion',
  };

  const usage = contentResponse.usageMetadata;
  if (usage != null) {
    res.usage = {
      prompt_tokens: usage?.promptTokenCount ?? 0,
      completion_tokens: usage?.candidatesTokenCount ?? 0,
      total_tokens: usage?.totalTokenCount ?? 0,
    };
  }

  return res;
}

// use the inofficial response field if available
function getCreatedAtSecsFromResponse(response: GenerateContentResponse): number | undefined {
  // createTime = '2025-02-12T17:55:37.835947Z'
  const ts = dateFromTimestampString((response as any)?.createTime);
  return ts != null ? Math.floor(ts.getTime() / 1000) : undefined;
}

// use the inofficial response field if available
function getIdFromResponse(response: GenerateContentResponse): string | undefined {
  // responseId = 'meCsZ-uCM7imhMIP77W34Ac'
  return (response as any)?.responseId;
}

// use the inofficial response field if available
function getModelVersionFromResponse(response: GenerateContentResponse): string | undefined {
  // modelVersion = 'gemini-2.0-flash-lite-preview-02-05'
  return (response as any)?.modelVersion;
}

function toOpenAiRole(contentRole?: string): OpenAI.ChatCompletionRole | undefined {
  if (contentRole !== 'model') {
    console.warn(`Unsupported content role: ${contentRole}`);
  }
  return 'assistant';
}

async function handleStreamResponse<S>(
  contentResult: StreamGenerateContentResult,
  modelName: string,
  streamProcessor?: LlmInputStreamProcessor<S>,
  abortController?: AbortController,
): Promise<OpenAI.ChatCompletion | undefined> {
  const stream = contentResult.stream;
  if (stream == null) {
    return undefined;
  }

  const timestamp = makeCompletionTimestamp();
  const completion: OpenAI.ChatCompletion = {
    id: timestamp.toString(),
    created: timestamp,
    model: modelName,
    object: 'chat.completion',
    choices: [],
  };
  const streamState: LlmStreamState = {
    isStreamOpen: true,
    choiceIndex: 0,
    toolCallsCollected: false,
    role: 'assistant',
  };
  let curProcessingState: S | undefined;

  const curToolCall: OpenAI.ChatCompletionMessageToolCall | undefined = undefined;
  const toolCalls: OpenAI.ChatCompletionMessageToolCall[] = [];

  console.log('VertexAI stream waiting');

  //const contents: ContentBlock[] = [];
  let usage: UsageMetadata | undefined;
  let latencyMs: number | undefined;

  // Extract and print the response stream in real-time.
  for await (const contentResponseChunk of stream) {
    let newContent: string | undefined;
    const newUsage = contentResponseChunk.usageMetadata;
    if (newUsage != null) {
      if (usage != null) {
        usage.promptTokenCount = (usage.promptTokenCount ?? 0) + (newUsage.promptTokenCount ?? 0);
        usage.candidatesTokenCount = (usage.candidatesTokenCount ?? 0) + (newUsage.candidatesTokenCount ?? 0);
        usage.totalTokenCount = (usage.totalTokenCount ?? 0) + (newUsage.totalTokenCount ?? 0);

        // TODO: add handling of completion_tokens_details and prompt_tokens_details
      } else {
        usage = newUsage;
      }
    }

    // use the undocumented fields if availble
    completion.id = getIdFromResponse(contentResponseChunk) ?? completion.id;
    completion.created = getCreatedAtSecsFromResponse(contentResponseChunk) ?? completion.created;
    const candidate = firstElement(contentResponseChunk.candidates);
    const content = candidate?.content;
    const parts = content?.parts;

    if (parts != null) {
      for (const part of parts) {
        if (part.text) {
          newContent = (newContent ?? '') + part.text;
          streamState.fullText = (streamState.fullText ?? '') + part.text;
        } else if (part.inlineData) {
          console.warn(`Use of inlineData not expected`);
        } else if (part.fileData) {
          console.warn(`Use of fileData not expected`);
        } else if (part.functionResponse) {
          console.warn(`Use of functionResponse not expected`);
        } else if (part.functionCall) {
          const argumentsJson = JSON.stringify(part.functionCall.args);
          toolCalls.push({
            // we need to use the id field for the function name so we can use it to carry the name through to the response call
            id: part.functionCall.name,
            type: 'function',
            function: {
              name: part.functionCall.name,
              arguments: argumentsJson,
            },
          });
        }
      }
    }

    streamState.role = toOpenAiRole(content?.role);
    streamState.toolCallsCollected = toolCalls.length > 0;
    streamState.finishReason = stopReasonToFinishReason(streamState.toolCallsCollected, candidate?.finishReason);
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

    if (usage != null) {
      completion.usage = {
        prompt_tokens: usage?.promptTokenCount ?? 0,
        completion_tokens: usage?.candidatesTokenCount ?? 0,
        total_tokens: usage?.totalTokenCount ?? 0,
      };
    }
    return completion;
  }
}

function toOpenAiError(e: any): any {
  console.warn(`TODO: Add support for converting exception: ${JSON.stringify(e)}`);
  return e;
}
