import { OpenAI } from 'openai';

import { ValidationError } from '../../../_shared-client/error/ValidationError.ts';
import { mapNotNullAvoidEmpty } from '../../../_shared-client/utils/array-utils.ts';
import { type ApiProgressHandler } from '../../ApiProgressHandler.ts';
import { LlmAssetProvider } from '../LlmAssetProvider.ts';
import { LlmProvider } from '../LlmProvider.ts';
import { LlmStreamState, type LlmInputStreamProcessor } from '../LlmStreamProcessor.ts';
import { type LlmTool, type LlmToolCallResult, type LlmToolContext, type LlmToolNextState } from './llm-tools.ts';

export type LlmRequestCreator<C extends LlmToolContext> = (
  modelProvider: LlmProvider,
  context: C,
  assetProvider?: LlmAssetProvider,
  tools?: OpenAI.ChatCompletionTool[],
) => Promise<OpenAI.ChatCompletionCreateParams | undefined>;

export type LlmResultCreator<C extends LlmToolContext, TOOL_RES, INVOKE_RES> = (
  generatedByLlm: boolean,
  receivedAsStream: boolean,
  context: C,
  content?: string,
  toolResults?: TOOL_RES[],
  requestDurationMs?: number,
) => INVOKE_RES;

export type LlmToolHandler<C extends LlmToolContext, TOOL_RES, INVOKE_RES> = (
  toolName: string,
  toolArgsJson: any,
  context: C,
  tool?: LlmTool<C, TOOL_RES, INVOKE_RES>,
) => Promise<LlmToolCallResult<C, TOOL_RES, INVOKE_RES>>;

export function makeDefaultToolHandler<C extends LlmToolContext, TOOL_RES, INVOKE_RES>(
  nextStateWhenToolMissing?: LlmToolNextState<C, INVOKE_RES>,
): LlmToolHandler<C, TOOL_RES, INVOKE_RES> {
  return async (toolName, toolArgsJson, context, tool) =>
    defaultToolHandler(toolName, toolArgsJson, context, tool, nextStateWhenToolMissing);
}

export async function defaultToolHandler<C extends LlmToolContext, TOOL_RES, INVOKE_RES>(
  toolName: string,
  toolArgsJson: any,
  context: C,
  llmTool?: LlmTool<C, TOOL_RES, INVOKE_RES>,
  nextStateWhenToolMissing?: LlmToolNextState<C, INVOKE_RES>,
): Promise<LlmToolCallResult<C, TOOL_RES, INVOKE_RES>> {
  if (llmTool) {
    try {
      return await llmTool.callTool(toolArgsJson, context);
    } catch (e: unknown) {
      if (e instanceof ValidationError) {
        console.log(`Validation error: ${e.message}`);
        return {
          // send the validation error message to the LLM
          tool: e.message,
        };
      } else {
        throw e;
      }
    }
  }
  // nothing found that can process the tool, maybe the LLM hallucinated the tool name?
  // just return something to the LLM so we are not stuck in the tool call
  return {
    tool: 'Unknown tool',
    next: nextStateWhenToolMissing,
  };
}

export function checkLlmToolsFollowupInvocation<C extends LlmToolContext, TOOL_RES, INVOKE_RES>(
  choice: OpenAI.ChatCompletion.Choice,
  toolResults: LlmToolCallResult<C, TOOL_RES, INVOKE_RES>[],
): {
  skipInvocation: boolean;
  somePreventInvocation: boolean;
  someWantInvocation: boolean;
  allUnnecessaryInvocation: boolean;
  allHaveToolAssistantContent: boolean;
} {
  let wantFollowUpInvocation = false;
  let preventFollowUpInvocation = false;
  let unnecessaryFollowUpInvocationCount = 0;
  let assistantContentCount = 0;
  for (const toolResult of toolResults) {
    // If any of the tools requires a follow-up invocation, we need to do that by setting the flag to true
    wantFollowUpInvocation ||=
      toolResult.followUpInvocation === 'want' || (toolResult.forceFollowUpInvocation ?? false);
    preventFollowUpInvocation ||= toolResult.followUpInvocation === 'prevent';
    if (toolResult.followUpInvocation === 'unnecessary') unnecessaryFollowUpInvocationCount++;

    if (toolResult.assistant) assistantContentCount++;
  }
  const unnecessaryFollowUpInvocation =
    unnecessaryFollowUpInvocationCount > 0 && unnecessaryFollowUpInvocationCount === toolResults.length;

  const haveAssistantContentForAllTools = assistantContentCount > 0 && assistantContentCount === toolResults.length;

  const skipInvocation =
    haveAssistantContentForAllTools ||
    (!wantFollowUpInvocation && choice.message.content != null) ||
    preventFollowUpInvocation ||
    unnecessaryFollowUpInvocation;

  return {
    skipInvocation,
    somePreventInvocation: preventFollowUpInvocation,
    someWantInvocation: wantFollowUpInvocation,
    allUnnecessaryInvocation: unnecessaryFollowUpInvocation,
    allHaveToolAssistantContent: haveAssistantContentForAllTools,
  };
}

export async function invokeLlmWithTools<C extends LlmToolContext, TOOL_RES, INVOKE_RES, S>(
  modelProvider: LlmProvider,
  context: C,
  createOpenAiRequest: LlmRequestCreator<C>,
  resultCreator: LlmResultCreator<C, TOOL_RES, INVOKE_RES>,
  assetProvider?: LlmAssetProvider,
  streamProcessor?: LlmInputStreamProcessor<S>,
  progress?: ApiProgressHandler,
  llmTools?: LlmTool<C, TOOL_RES, INVOKE_RES>[],
  toolHandler?: LlmToolHandler<C, TOOL_RES, INVOKE_RES>,
): Promise<INVOKE_RES | undefined> {
  // avoid empty tool array, since OpenAI will result in this error:
  // Error: 400 Invalid 'tools': empty array. Expected an array with minimum length 1, but got an empty array instead.
  const tools = mapNotNullAvoidEmpty(llmTools, (t) => t.getTool());

  const openAiRequest = await createOpenAiRequest(modelProvider, context, assetProvider, tools);
  if (!openAiRequest) {
    if (context.toolMessages) {
      // execute the default result handler to trigger side-effects
      resultCreator(false, false, context);
    }
    return undefined;
  }
  console.dir(openAiRequest, { depth: null });
  const requestStartTs = new Date();
  const chatCompletion = await modelProvider.invoke(
    openAiRequest,
    assetProvider,
    context.abortController,
    streamProcessor,
    progress,
  );
  const choice = chatCompletion?.choices?.[0];
  const requestDurationMs = Date.now() - requestStartTs.getTime();

  console.log(`LLM request duration: ${requestDurationMs} ms`);

  if (choice?.finish_reason === 'tool_calls' && choice.message.tool_calls) {
    context.toolMessages ??= [];
    context.toolMessages.push(choice.message);

    const [toolResults, toolMessages] = await processAllTools(
      context,
      choice.message.tool_calls,
      llmTools,
      toolHandler,
    );
    context.toolMessages.push(...toolMessages);

    const assistantContents: string[] = [];
    const toolDataResults: TOOL_RES[] = [];
    for (const toolResult of toolResults) {
      if (toolResult.assistant) {
        assistantContents.push(toolResult.assistant);
      }
      if (toolResult.toolData) {
        toolDataResults.push(toolResult.toolData);
      }
    }

    // one or several functions returned a direct message to the user. Add them all so we can use them in
    // a full choice message and we can avoid calling the LLM
    const assistantContentsJoined = assistantContents.length > 0 ? assistantContents.join('\n') : undefined;

    // sometimes the llm responds also with content inside the tool call.
    // In that case we still make the function calls and use the LLM response directly without making a separate call.
    if (choice.message.content != null) {
      console.warn(
        'Got both content and tool calls, using content for assistant response: ',
        choice.message.tool_calls,
      );
    }

    const { skipInvocation, someWantInvocation } = checkLlmToolsFollowupInvocation(choice, toolResults);

    // clear an assistent message if one was attached to force another round-trip
    const choiceMessageContentAdjusted = someWantInvocation ? undefined : (choice.message.content ?? undefined);
    if (assistantContentsJoined && assistantContentsJoined !== choiceMessageContentAdjusted) {
      // make sure we're streaming a hard coded response received from the tool only.
      // Any content in choice.message.content was already streamed and should not be streamed again.
      const llmStreamState: LlmStreamState = {
        isStreamOpen: true,
        choiceIndex: 0,
        toolCallsCollected: true,
      };
      await streamProcessor?.(llmStreamState, undefined, assistantContentsJoined, true);
    }

    // if there's already an assistant response available, use it directly.
    // Otherwise we need to call the LLM again to get it
    let result: INVOKE_RES | undefined;
    if (skipInvocation) {
      //const toolDataResultsFinal = assistantContentsJoined ? toolDataResults : undefined;
      result = resultCreator(
        false,
        false,
        context,
        assistantContentsJoined ?? choice.message.content ?? undefined,
        toolDataResults,
        requestDurationMs,
      );
    } else {
      // get a response from the LLM by repeating this flow. Also covers the case that The LLM responds with another tool call
      result = await invokeLlmWithTools(
        modelProvider,
        context,
        createOpenAiRequest,
        resultCreator,
        assetProvider,
        streamProcessor,
        progress,
        llmTools,
        toolHandler,
      );
    }

    // when done with the LLM call we might need to transition into a new state in case that is required by a tool we just executed
    for (const toolResult of toolResults) {
      if (toolResult.next) {
        result = await toolResult.next(context, result);
      }
    }
    return result;
  } else {
    if (choice?.finish_reason !== 'stop') {
      console.warn(`LLM finished with "${choice?.finish_reason}", response: ${choice?.message.content}`);
    }

    const result = resultCreator(
      true,
      context.useStreaming,
      context,
      choice?.message.content ?? undefined,
      undefined,
      requestDurationMs,
    );

    return result;
  }
}

export async function processAllTools<C extends LlmToolContext, TOOL_RES, INVOKE_RES>(
  context: C,
  toolCalls: OpenAI.ChatCompletionMessageToolCall[],
  llmTools?: LlmTool<C, TOOL_RES, INVOKE_RES>[],
  toolHandler?: LlmToolHandler<C, TOOL_RES, INVOKE_RES>,
): Promise<[LlmToolCallResult<C, TOOL_RES, INVOKE_RES>[], OpenAI.ChatCompletionToolMessageParam[]]> {
  const toolResults: LlmToolCallResult<C, TOOL_RES, INVOKE_RES>[] = [];
  const toolMessages: OpenAI.ChatCompletionToolMessageParam[] = [];

  for (const toolCall of toolCalls) {
    if (toolCall.type !== 'function') {
      continue;
    }

    console.info(`\nTool call ${toolCall.function.name}: ${toolCall.function.arguments}\n`);
    let toolContent = '';
    let toolArgsJson: any;
    try {
      toolArgsJson = JSON.parse(toolCall.function.arguments);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : JSON.stringify(e);
      toolContent = errorMessage;
      console.warn('Cannot convert LLM tool arguments to JSON', toolCall.function.arguments, e);
    }

    if (toolArgsJson != null) {
      // TODO: we assume there's only a handful of tools and it's not worth to convert them into a map first
      const tool = llmTools?.find((t) => t.toolName === toolCall.function.name);
      const result =
        toolHandler != null
          ? await toolHandler(toolCall.function.name, toolArgsJson, context, tool)
          : await defaultToolHandler(toolCall.function.name, toolArgsJson, context, tool, undefined);
      toolContent = result.tool;
      result.llmTool = tool;
      toolResults.push(result);
    }

    toolMessages.push({
      tool_call_id: toolCall.id,
      role: 'tool',
      content: toolContent,
    });
  }
  return [toolResults, toolMessages];
}
