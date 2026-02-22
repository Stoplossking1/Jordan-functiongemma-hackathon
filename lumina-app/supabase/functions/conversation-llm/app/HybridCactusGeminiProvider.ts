import { OpenAI } from 'openai';

import { type ApiProgressHandler } from '../../_shared/ApiProgressHandler.ts';
import { type LlmAssetProvider } from '../../_shared/llm/LlmAssetProvider.ts';
import { LlmProvider, makeCompletionTimestamp } from '../../_shared/llm/LlmProvider.ts';
import { type LlmInputStreamProcessor } from '../../_shared/llm/LlmStreamProcessor.ts';
import { CactusGatewayClient } from './cactusGatewayClient.ts';
import {
  CLOUD_MULTI_INTENT_REPAIR_SYSTEM_INSTRUCTION,
  DEFAULT_SYSTEM_INSTRUCTION,
  MULTI_INTENT_REPAIR_SYSTEM_INSTRUCTION,
  REPAIR_SYSTEM_INSTRUCTION,
  type HybridRoutingPolicy,
  hybridRoutingPolicy,
} from './hybridRoutingPolicy.ts';
import type {
  HybridFallbackReason,
  HybridRoutingDecision,
  LocalFunctionCall,
  LocalInferenceResult,
} from './hybridRoutingTypes.ts';
import {
  estimateExpectedActionCount,
  extractLatestUserText,
  toHybridToolDefinitions,
  validateLocalFunctionCalls,
} from './hybridRoutingValidation.ts';

const LOCAL_MODEL_NAME = 'cactus/functiongemma-270m-it';
const LOCAL_MAX_TOKENS = 256;
const MAX_LOCAL_HISTORY_MESSAGES = 6;
const IMAGE_CONTENT_PART_TYPE = 'image_url';

interface GatewayMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function readTextFromContent(
  content: string | { type: string; text?: string }[] | null | undefined,
): string {
  if (typeof content === 'string') {
    return content.trim();
  }

  if (!Array.isArray(content)) {
    return '';
  }

  const textParts: string[] = [];
  for (const contentPart of content) {
    if (contentPart.type === 'text' && contentPart.text != null) {
      textParts.push(contentPart.text);
    }
  }

  return textParts.join(' ').trim();
}

function toGatewayRole(role: OpenAI.ChatCompletionMessageParam['role']): GatewayMessage['role'] | undefined {
  if (role === 'system' || role === 'assistant' || role === 'user') {
    return role;
  }

  return undefined;
}

function buildGatewayMessages(messages: OpenAI.ChatCompletionMessageParam[]): GatewayMessage[] {
  const gatewayMessagesAll: GatewayMessage[] = [];

  for (const message of messages) {
    const gatewayRole = toGatewayRole(message.role);
    if (!gatewayRole) {
      continue;
    }

    if (gatewayRole === 'system') {
      const systemText = readTextFromContent(message.content);
      if (systemText.length > 0) {
        gatewayMessagesAll.push({
          role: gatewayRole,
          content: systemText,
        });
      }
      continue;
    }

    const contentText = readTextFromContent(message.content);
    if (contentText.length === 0) {
      continue;
    }

    gatewayMessagesAll.push({
      role: gatewayRole,
      content: contentText,
    });
  }

  if (gatewayMessagesAll.length <= MAX_LOCAL_HISTORY_MESSAGES) {
    return gatewayMessagesAll;
  }

  return gatewayMessagesAll.slice(-MAX_LOCAL_HISTORY_MESSAGES);
}

function hasTools(request: OpenAI.ChatCompletionCreateParams): boolean {
  return Array.isArray(request.tools) && request.tools.length > 0;
}

function hasImageAttachment(messages: OpenAI.ChatCompletionMessageParam[]): boolean {
  for (const message of messages) {
    if (message.role !== 'user' || !Array.isArray(message.content)) {
      continue;
    }

    for (const contentPart of message.content) {
      if (contentPart.type === IMAGE_CONTENT_PART_TYPE) {
        return true;
      }
    }
  }

  return false;
}

function cloneRequest(request: OpenAI.ChatCompletionCreateParams): OpenAI.ChatCompletionCreateParams {
  return structuredClone(request);
}

function withSystemInstruction(
  request: OpenAI.ChatCompletionCreateParams,
  systemInstruction: string,
): OpenAI.ChatCompletionCreateParams {
  const updatedRequest = cloneRequest(request);

  const withoutSystemMessages = updatedRequest.messages.filter((message) => message.role !== 'system');
  const systemMessage: OpenAI.ChatCompletionSystemMessageParam = {
    role: 'system',
    content: systemInstruction,
  };

  updatedRequest.messages = [systemMessage, ...withoutSystemMessages];
  return updatedRequest;
}

function makeLocalToolCallId(index: number): string {
  return `local-tool-call-${index + 1}`;
}

function makeToolCalls(functionCalls: LocalFunctionCall[]): OpenAI.ChatCompletionMessageToolCall[] {
  const toolCalls: OpenAI.ChatCompletionMessageToolCall[] = [];

  let index = 0;
  for (const functionCall of functionCalls) {
    toolCalls.push({
      id: makeLocalToolCallId(index),
      type: 'function',
      function: {
        name: functionCall.name,
        arguments: JSON.stringify(functionCall.arguments),
      },
    });
    index++;
  }

  return toolCalls;
}

function makeLocalCompletion(
  functionCalls: LocalFunctionCall[],
  modelName: string,
  completionId: string,
): OpenAI.ChatCompletion {
  return {
    id: completionId,
    object: 'chat.completion',
    created: makeCompletionTimestamp(),
    model: modelName,
    choices: [
      {
        index: 0,
        finish_reason: 'tool_calls',
        logprobs: null,
        message: {
          role: 'assistant',
          content: null,
          refusal: null,
          tool_calls: makeToolCalls(functionCalls),
        },
      },
    ],
  };
}

function readToolCallCount(response: OpenAI.ChatCompletion | undefined): number {
  return response?.choices?.[0]?.message?.tool_calls?.length ?? 0;
}

function readModelName(request: OpenAI.ChatCompletionCreateParams): string {
  if (request.model.trim().length > 0) {
    return request.model;
  }

  return LOCAL_MODEL_NAME;
}

function makeCompletionId(): string {
  return `chatcmpl-local-${crypto.randomUUID()}`;
}

function makeRoutingDecision(
  routeSource: 'local' | 'cloud',
  expectedActionCount: number,
  fallbackReason?: HybridFallbackReason,
): HybridRoutingDecision {
  return {
    routeSource,
    fallbackReason,
    expectedActionCount,
  };
}

function logRoutingDecision(decision: HybridRoutingDecision): void {
  console.info(`hybrid-routing=${JSON.stringify(decision)}`);
}

async function emitLocalStreamEvent<S>(
  streamProcessor: LlmInputStreamProcessor<S> | undefined,
  toolCallCount: number,
): Promise<void> {
  if (!streamProcessor) {
    return;
  }

  await streamProcessor(
    {
      isStreamOpen: false,
      finishReason: 'tool_calls',
      choiceIndex: 0,
      role: 'assistant',
      toolCallsCollected: toolCallCount > 0,
    },
    undefined,
    undefined,
    true,
  );
}

function toLocalFallbackReason(error: unknown): HybridFallbackReason {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'gateway_unavailable';
  }

  const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
  if (
    errorMessage.includes('gateway') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('connect') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('timed out') ||
    errorMessage.includes('abort')
  ) {
    return 'gateway_unavailable';
  }

  return 'local_error';
}

function updateDecisionFromLocalResult(decision: HybridRoutingDecision, localResult: LocalInferenceResult): void {
  decision.localConfidence = localResult.confidence;
  decision.localLatencyInMs = localResult.totalTimeInMs;
  decision.localCallCount = localResult.functionCalls.length;
}

async function makeAcceptedLocalCompletion<S>(
  streamProcessor: LlmInputStreamProcessor<S> | undefined,
  localResult: LocalInferenceResult,
  request: OpenAI.ChatCompletionCreateParams,
): Promise<OpenAI.ChatCompletion> {
  await emitLocalStreamEvent(streamProcessor, localResult.functionCalls.length);
  return makeLocalCompletion(localResult.functionCalls, readModelName(request), makeCompletionId());
}

export class HybridCactusGeminiProvider extends LlmProvider {
  private readonly cactusClient: CactusGatewayClient;

  constructor(
    private readonly cloudProvider: LlmProvider,
    private readonly policy: HybridRoutingPolicy = hybridRoutingPolicy,
  ) {
    super(cloudProvider.providerConfig, cloudProvider.promptFormat);
    this.cactusClient = new CactusGatewayClient(policy.cactusGatewayUrl);
  }

  override async invoke<S>(
    request: OpenAI.ChatCompletionCreateParams,
    assetProvider?: LlmAssetProvider,
    abortController?: AbortController,
    streamProcessor?: LlmInputStreamProcessor<S>,
    progress?: ApiProgressHandler,
  ): Promise<OpenAI.ChatCompletion | undefined> {
    const expectedActionCount = estimateExpectedActionCount(request.messages);

    if (!hasTools(request)) {
      return await this.invokeCloudWithRouting(
        request,
        expectedActionCount,
        'no_tools_available',
        assetProvider,
        abortController,
        streamProcessor,
        progress,
      );
    }

    if (hasImageAttachment(request.messages)) {
      return await this.invokeCloudWithRouting(
        request,
        expectedActionCount,
        'gateway_unavailable',
        assetProvider,
        abortController,
        streamProcessor,
        progress,
      );
    }

    const latestUserText = extractLatestUserText(request.messages);
    if (!latestUserText) {
      return await this.invokeCloudWithRouting(
        request,
        expectedActionCount,
        'no_user_message',
        assetProvider,
        abortController,
        streamProcessor,
        progress,
      );
    }

    if (!this.policy.enableLocalCactus) {
      return await this.invokeCloudWithRouting(
        request,
        expectedActionCount,
        'gateway_unavailable',
        assetProvider,
        abortController,
        streamProcessor,
        progress,
      );
    }

    const baseDecision = makeRoutingDecision('local', expectedActionCount);

    try {
      const initialResult = await this.invokeLocal(request, DEFAULT_SYSTEM_INSTRUCTION);
      updateDecisionFromLocalResult(baseDecision, initialResult);

      let currentValidation = this.validateLocalResult(initialResult, request, expectedActionCount);
      if (currentValidation.isAccepted) {
        logRoutingDecision(baseDecision);
        return await makeAcceptedLocalCompletion(streamProcessor, initialResult, request);
      }

      let repairPassAttempted = false;
      let multiIntentRepairAttempted = false;

      while (!currentValidation.isAccepted) {
        if (
          this.policy.enableRepairPass &&
          !repairPassAttempted &&
          currentValidation.fallbackReason === 'no_function_calls'
        ) {
          repairPassAttempted = true;
          const repairResult = await this.invokeLocal(request, REPAIR_SYSTEM_INSTRUCTION);
          updateDecisionFromLocalResult(baseDecision, repairResult);
          currentValidation = this.validateLocalResult(repairResult, request, expectedActionCount);

          if (currentValidation.isAccepted) {
            baseDecision.usedRepairPass = true;
            logRoutingDecision(baseDecision);
            return await makeAcceptedLocalCompletion(streamProcessor, repairResult, request);
          }

          continue;
        }

        if (
          this.policy.enableMultiIntentRepair &&
          !multiIntentRepairAttempted &&
          currentValidation.fallbackReason === 'multi_intent_incomplete'
        ) {
          multiIntentRepairAttempted = true;
          const multiIntentRepairResult = await this.invokeLocal(request, MULTI_INTENT_REPAIR_SYSTEM_INSTRUCTION);
          updateDecisionFromLocalResult(baseDecision, multiIntentRepairResult);
          currentValidation = this.validateLocalResult(multiIntentRepairResult, request, expectedActionCount);

          if (currentValidation.isAccepted) {
            baseDecision.usedMultiIntentRepair = true;
            logRoutingDecision(baseDecision);
            return await makeAcceptedLocalCompletion(streamProcessor, multiIntentRepairResult, request);
          }

          continue;
        }

        break;
      }

      return await this.invokeCloudWithRouting(
        request,
        expectedActionCount,
        currentValidation.fallbackReason ?? 'local_error',
        assetProvider,
        abortController,
        streamProcessor,
        progress,
        baseDecision,
      );
    } catch (error) {
      const fallbackReason = toLocalFallbackReason(error);
      return await this.invokeCloudWithRouting(
        request,
        expectedActionCount,
        fallbackReason,
        assetProvider,
        abortController,
        streamProcessor,
        progress,
        baseDecision,
      );
    }
  }

  private validateLocalResult(
    localResult: LocalInferenceResult,
    request: OpenAI.ChatCompletionCreateParams,
    expectedActionCount: number,
  ): { isAccepted: boolean; fallbackReason?: HybridFallbackReason } {
    const toolDefinitions = toHybridToolDefinitions(request.tools);
    return validateLocalFunctionCalls(
      localResult.functionCalls,
      toolDefinitions,
      localResult.confidence,
      this.policy.localConfidenceThreshold,
      expectedActionCount,
    );
  }

  private async invokeLocal(
    request: OpenAI.ChatCompletionCreateParams,
    systemInstruction: string,
  ): Promise<LocalInferenceResult> {
    const gatewayMessages = buildGatewayMessages(request.messages);
    return await this.cactusClient.infer({
      messages: gatewayMessages,
      tools: request.tools ?? [],
      systemInstruction,
      temperature: this.policy.localTemperature,
      forceTools: true,
      maxTokens: LOCAL_MAX_TOKENS,
    });
  }

  private async invokeCloudWithRouting<S>(
    request: OpenAI.ChatCompletionCreateParams,
    expectedActionCount: number,
    fallbackReason: HybridFallbackReason,
    assetProvider?: LlmAssetProvider,
    abortController?: AbortController,
    streamProcessor?: LlmInputStreamProcessor<S>,
    progress?: ApiProgressHandler,
    existingDecision?: HybridRoutingDecision,
  ): Promise<OpenAI.ChatCompletion | undefined> {
    const decision = existingDecision ?? makeRoutingDecision('cloud', expectedActionCount, fallbackReason);
    decision.routeSource = 'cloud';
    decision.fallbackReason = fallbackReason;

    const cloudRequest = cloneRequest(request);
    cloudRequest.temperature = this.policy.cloudTemperature;

    const cloudResponse = await this.cloudProvider.invoke(
      cloudRequest,
      assetProvider,
      abortController,
      streamProcessor,
      progress,
    );

    const initialCloudCallCount = readToolCallCount(cloudResponse);
    decision.cloudCallCount = initialCloudCallCount;

    if (
      !this.policy.enableCloudMultiIntentRepair ||
      expectedActionCount <= 1 ||
      initialCloudCallCount >= expectedActionCount
    ) {
      logRoutingDecision(decision);
      return cloudResponse;
    }

    try {
      const cloudRepairRequest = withSystemInstruction(cloudRequest, CLOUD_MULTI_INTENT_REPAIR_SYSTEM_INSTRUCTION);
      cloudRepairRequest.temperature = this.policy.cloudTemperature;

      const cloudRepairResponse = await this.cloudProvider.invoke(
        cloudRepairRequest,
        assetProvider,
        abortController,
        streamProcessor,
        progress,
      );

      const repairedCloudCallCount = readToolCallCount(cloudRepairResponse);
      if (repairedCloudCallCount > initialCloudCallCount) {
        decision.usedCloudMultiIntentRepair = true;
        decision.cloudCallCount = repairedCloudCallCount;
        logRoutingDecision(decision);
        return cloudRepairResponse;
      }
    } catch (_error) {
      decision.fallbackReason = 'cloud_repair_unavailable';
    }

    logRoutingDecision(decision);
    return cloudResponse;
  }
}
