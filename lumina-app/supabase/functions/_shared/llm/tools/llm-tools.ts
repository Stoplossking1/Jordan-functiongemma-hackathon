import { OpenAI } from 'openai';

import { validateBoolParam, validateStringParam } from './tool-call-validations.ts';

export interface LlmToolContext {
  useStreaming: boolean;
  toolMessages?: Array<OpenAI.ChatCompletionAssistantMessageParam | OpenAI.ChatCompletionToolMessageParam>;
  abortController?: AbortController;
}

export type LlmToolNextState<C extends LlmToolContext, INVOKE_RES> = (
  context: C,
  prevResult?: INVOKE_RES,
) => Promise<INVOKE_RES | undefined>;

export interface LlmToolCallResult<C extends LlmToolContext, TOOL_RES, INVOKE_RES> {
  llmTool?: LlmTool<C, TOOL_RES, INVOKE_RES>; // identifies the tool that was called
  tool: string; // content for the tool response
  assistant?: string; // content for a direct "virtual" assistance response that skips another followup LLM invocation
  // additional custom tool result data
  toolData?: TOOL_RES;
  /**
   * @deprecated Use `followUpInvocation: 'want'` instead (2025-12-07)
   */
  forceFollowUpInvocation?: boolean;

  /**
   * Define if a follow-up LLM invocation is done in response to one ore multiple executed tool-calls.
   * If no value is set, use the default behaviour - only follow-up if there's no content available otherwise.
   *        want: invoke the LLM again even if the current assistant message had a value for `content`. 
   *              NOTE: if all tools return an explicit value for `assistent` content then it takes precedence over this flag.
   * unnecessary: the tool does not need to report anything back to the LLM - the tool effects are reported back to the LLM through other content messages attached to the request.
   *              If all executed tools use this value, no invocation will happen.
   *     prevent: if any executed tool has this flag set, then no tool execution will take place.
   *
   * Conflict resolution: When multiple tools were executed then the flags take precendence in the following order: 1. prevent 2. want 3. unnecessary
   * NOTE: Only tools that were actually executed will be considered.
   */
  followUpInvocation?: 'want' | 'unnecessary' | 'prevent';
  // a callback that is executed after all tools and follow-up invocations have completed
  next?: LlmToolNextState<C, INVOKE_RES>;
}

export function encodeToolName(metricName: string): string {
  const encoded = metricName.toLocaleLowerCase().replace(/\W/g, '_'); // make sure there's no illegal characters characters in function names
  //.replace(/\s/g, "_"); // make sure there's no whitespace characters
  return encoded;
}

// instructs the LLM about a value rangw
export function numberRangeInclusivePrompt(minInclusive?: number, maxInclusive?: number): string {
  if (minInclusive != null) {
    if (maxInclusive != null) {
      return `Must be between ${minInclusive} and ${maxInclusive}.`;
    } else {
      return `Must be equal or larger than ${minInclusive}.`;
    }
  } else if (maxInclusive != null) {
    return `Must be equal or smaller than ${maxInclusive}.`;
  }
  return '';
}

export abstract class LlmTool<C extends LlmToolContext, TOOL_RES, INVOKE_RES> {
  // identifies the information collected by the tool. Used by the LLM to distinguish multiple tools, should be an english name
  constructor(readonly toolName: string) {
    // string too long. Expected a string with maximum length 64, but got a string with length 68 instead
    if (toolName.length > 64) {
      this.toolName = toolName.substring(0, 64);
      console.warn(`tool name too long, shorten to 64: ${this.toolName}`);
    }
  }
  abstract getTool(): OpenAI.ChatCompletionTool;
  abstract callTool(toolArgsJson: any, context: C): Promise<LlmToolCallResult<C, TOOL_RES, INVOKE_RES>>;
}

export abstract class VoidParamTool<C extends LlmToolContext, TOOL_RES, INVOKE_RES> extends LlmTool<
  C,
  TOOL_RES,
  INVOKE_RES
> {
  // identifies the information collected by the tool. Used by the LLM to distinguish multiple tools, should be an english name
  constructor(
    toolName: string,
    readonly process: () => Promise<LlmToolCallResult<C, TOOL_RES, INVOKE_RES>>,
  ) {
    super(toolName);
  }

  override async callTool(toolArgsJson: any, context: C): Promise<LlmToolCallResult<C, TOOL_RES, INVOKE_RES>> {
    return this.process();
  }
}

export abstract class BoolParamTool<C extends LlmToolContext, TOOL_RES, INVOKE_RES> extends LlmTool<
  C,
  TOOL_RES,
  INVOKE_RES
> {
  constructor(
    // identifies the information collected by the tool. Used by the LLM to distinguish multiple tools, should be an english name
    toolName: string,
    readonly boolParamName: string,
    readonly process: (boolValue: boolean) => Promise<LlmToolCallResult<C, TOOL_RES, INVOKE_RES>>,
  ) {
    super(toolName);
  }

  override async callTool(toolArgsJson: any, context: C): Promise<LlmToolCallResult<C, TOOL_RES, INVOKE_RES>> {
    const boolArg = toolArgsJson[this.boolParamName];
    return this.process(validateBoolParam(boolArg, this.boolParamName));
  }
}

export abstract class StringParamTool<C extends LlmToolContext, TOOL_RES, INVOKE_RES> extends LlmTool<
  C,
  TOOL_RES,
  INVOKE_RES
> {
  constructor(
    // identifies the information collected by the tool. Used by the LLM to distinguish multiple tools, should be an english name
    toolName: string,
    readonly stringParamName: string,
    readonly process: (stringValue: string) => Promise<LlmToolCallResult<C, TOOL_RES, INVOKE_RES>>,
  ) {
    super(toolName);
  }

  override async callTool(toolArgsJson: any, context: C): Promise<LlmToolCallResult<C, TOOL_RES, INVOKE_RES>> {
    const stringArg = toolArgsJson[this.stringParamName];
    return this.process(validateStringParam(stringArg, this.stringParamName));
  }
}
