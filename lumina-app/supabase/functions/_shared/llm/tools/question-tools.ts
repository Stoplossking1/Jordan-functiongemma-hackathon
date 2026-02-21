import { OpenAI } from 'openai';

import { mapNotNull } from '../../../_shared-client/utils/array-utils.ts';
import { validateEnumParam, validateNumberParam } from './tool-call-validations.ts';
import { type ToolEnum } from './ToolEnum.ts';
import {
  encodeToolName,
  numberRangeInclusivePrompt,
  VoidParamTool,
  BoolParamTool,
  StringParamTool,
  LlmTool,
  type LlmToolContext,
  type LlmToolCallResult,
} from './llm-tools.ts';

export class BoolQuestionTool<C extends LlmToolContext, TOOL_RES, INVOKE_RES> extends BoolParamTool<
  C,
  TOOL_RES,
  INVOKE_RES
> {
  constructor(
    readonly question: string,
    // identifies the information we are collecting.
    // Used by the LLM to distinguish multiple tools, should be an english name
    readonly collectedInfoName: string,
    process: (boolValue: boolean) => Promise<LlmToolCallResult<C, TOOL_RES, INVOKE_RES>>,
  ) {
    const encodedToolName = encodeToolName(collectedInfoName);
    const funcName = `${encodedToolName}_decision_provided`;
    const boolParamName = `${encodedToolName}_decision`;
    super(funcName, boolParamName, process);
  }

  override getTool(): OpenAI.ChatCompletionTool {
    return {
      type: 'function',
      function: {
        name: this.toolName,
        //description: `Is user able to provide ${this.collectedInfoName}? Must be explicitely stated by the user`,
        description: `User's response to "${this.question}", such as yes/no, agree/disagree, did/did not. Cannot be "maybe"`,
        parameters: {
          type: 'object',
          properties: {
            // add a reason parameter before the bool value
            // - this helps guiding the correct bool value since the LLM needs to look at the reason text generated
            reason: {
              type: 'string',
            },
            [this.boolParamName]: {
              // string, number, integer, object, array, and boolean
              // https://community.openai.com/t/types-accepted-by-call-functions/549169/2
              // types see here: https://community.openai.com/t/function-calling-parameter-types/268564/8
              type: 'boolean',
              // description: `${this.collectedInfoName} available`
              description: `decision regarding "${this.collectedInfoName}"`,
            },
          },
          required: ['reason', this.boolParamName],
        },
      },
    };
  }
}

export class NumberQuestionTool<C extends LlmToolContext, TOOL_RES, INVOKE_RES, V> extends LlmTool<
  C,
  TOOL_RES,
  INVOKE_RES
> {
  readonly numberParamName: string;
  readonly unitParamName: string;

  constructor(
    readonly question: string,
    // identifies the information we are collecting.
    // Used by the LLM to distinguish multiple tools, should be an english name
    readonly collectedInfoName: string,
    readonly useInt: boolean,
    readonly minIncl: number | undefined,
    readonly maxIncl: number | undefined,
    readonly unitEnums: ToolEnum<V>[] | undefined,
    readonly process: (
      needsUnit: boolean,
      numValue?: number,
      unitEnum?: ToolEnum<V>,
    ) => Promise<LlmToolCallResult<C, TOOL_RES, INVOKE_RES>>,
  ) {
    const encodedToolName = encodeToolName(collectedInfoName);
    const funcName = `extract_${encodedToolName}`;
    super(funcName);
    this.numberParamName = encodedToolName;
    this.unitParamName = 'unit';
  }

  override getTool(): OpenAI.ChatCompletionTool {
    const unitEnum = this.unitEnums ? mapNotNull(this.unitEnums, (u) => u.name) : null;
    const unitEnumCount = unitEnum?.length ?? 0;
    const unitDefinition =
      unitEnumCount > 0
        ? {
            type: 'string',
            description: `The unit for "${this.collectedInfoName}"`, // , must be explicitely mentioned. If not, ask
            enum: unitEnum,
          }
        : undefined;
    // if user says "kilograms" instead of "kg" still accept it without clarifying
    const unitDescription = unitDefinition ? 'If the unit provided is slightly misspelled, still use it.' : '';
    const rangeText = numberRangeInclusivePrompt(this.minIncl, this.maxIncl);

    return {
      type: 'function',
      function: {
        name: this.toolName,
        // description: question.question, // Note: repeating the question in the description lead to more hallucinations
        //description: `${this.collectedInfoName}. Must be explicitely stated by the user`,
        description: `User's numeric response for "${this.collectedInfoName}", answering "${this.question}". ${unitDescription}`,
        parameters: {
          type: 'object',
          properties: {
            // add a reason parameter before the bool value
            // - this helps guiding the correct bool value since the LLM needs to look at the reason text generated
            reason: {
              type: 'string',
            },
            [this.numberParamName]: {
              // string, number, integer, object, array, and boolean
              // https://community.openai.com/t/types-accepted-by-call-functions/549169/2
              // types see here: https://community.openai.com/t/function-calling-parameter-types/268564/8
              type: this.useInt ? 'integer' : 'number',
              //description: "The weight of the user, not of another person",
              description: `"${this.collectedInfoName}". ${rangeText}`,
            },
            ...(unitDefinition && { [this.unitParamName]: unitDefinition }),
          },
          // if we only have one unit, no need to make this required
          required: unitEnumCount > 1 ? [this.numberParamName, this.unitParamName] : [this.numberParamName], //"double_checked_by_user"
        },
      },
    };
  }

  override async callTool(toolArgsJson: any, context: C): Promise<LlmToolCallResult<C, TOOL_RES, INVOKE_RES>> {
    const numberArg = toolArgsJson[this.numberParamName];
    const numValue = validateNumberParam(numberArg, this.numberParamName, this.useInt, this.minIncl, this.maxIncl);
    const needsUnit = (this.unitEnums?.length ?? 0) > 0;

    const unitStringArg = toolArgsJson[this.unitParamName];
    const unitValue = needsUnit ? validateEnumParam(unitStringArg, this.unitParamName, this.unitEnums) : undefined;
    return this.process(needsUnit, numValue, unitValue);
  }
}

export class StringQuestionTool<C extends LlmToolContext, TOOL_RES, INVOKE_RES> extends StringParamTool<
  C,
  TOOL_RES,
  INVOKE_RES
> {
  constructor(
    readonly question: string,
    // identifies the information we are collecting.
    // Used by the LLM to distinguish multiple tools, should be an english name
    readonly collectedInfoName: string,
    process: (stringValue: string) => Promise<LlmToolCallResult<C, TOOL_RES, INVOKE_RES>>,
  ) {
    const encodedToolName = encodeToolName(collectedInfoName);
    const funcName = `extract_${encodedToolName}`;
    const stringParamName = `${encodedToolName}_content`;
    super(funcName, stringParamName, process);
  }

  override getTool(): OpenAI.ChatCompletionTool {
    return {
      type: 'function',
      function: {
        name: this.toolName,
        description: `User's reply to the question "${this.question}". Must be a question or statement and not a simple yes/no answer.`,
        parameters: {
          type: 'object',
          properties: {
            [this.stringParamName]: {
              // string, number, integer, object, array, and boolean
              // https://community.openai.com/t/types-accepted-by-call-functions/549169/2
              // types see here: https://community.openai.com/t/function-calling-parameter-types/268564/8
              type: 'string',
              description: `response text`,
            },
          },
          required: [this.stringParamName],
        },
      },
    };
  }
}

export class EnumQuestionTool<C extends LlmToolContext, TOOL_RES, INVOKE_RES, V> extends LlmTool<
  C,
  TOOL_RES,
  INVOKE_RES
> {
  readonly enumParamName: string;
  constructor(
    readonly question: string,
    // identifies the information we are collecting.
    // Used by the LLM to distinguish multiple tools, should be an english name
    readonly collectedInfoName: string,
    readonly toolEnums: ToolEnum<V>[],
    readonly process: (toolEnum: ToolEnum<V>) => Promise<LlmToolCallResult<C, TOOL_RES, INVOKE_RES>>,
  ) {
    const encodedToolName = encodeToolName(collectedInfoName);
    const funcName = `extract_${encodedToolName}`;
    super(funcName);
    this.enumParamName = `${encodedToolName}_selection`;
  }

  override async callTool(toolArgsJson: any, context: C): Promise<LlmToolCallResult<C, TOOL_RES, INVOKE_RES>> {
    const stringArg = toolArgsJson[this.enumParamName];
    return this.process(validateEnumParam(stringArg, this.enumParamName, this.toolEnums));
  }

  override getTool(): OpenAI.ChatCompletionTool {
    const enumValues = this.toolEnums.map((o) => o.name);
    return {
      type: 'function',
      function: {
        name: this.toolName,
        description: `User's selected response to "${this.question}"`,
        parameters: {
          type: 'object',
          properties: {
            // add a reason parameter before the bool value
            // - this helps guiding the correct bool value since the LLM needs to look at the reason text generated
            reason: {
              type: 'string',
            },
            [this.enumParamName]: {
              // string, number, integer, object, array, and boolean
              // https://community.openai.com/t/types-accepted-by-call-functions/549169/2
              // types see here: https://community.openai.com/t/function-calling-parameter-types/268564/8
              type: 'string',
              enum: enumValues,
              description: `choices regarding "${this.collectedInfoName}"`, // Light Headed
            },
          },
          required: ['reason', this.enumParamName],
        },
      },
    };
  }
}

export class SkipQuestionTool<C extends LlmToolContext, TOOL_RES, INVOKE_RES> extends VoidParamTool<
  C,
  TOOL_RES,
  INVOKE_RES
> {
  private constructor(
    readonly question: string,
    // identifies the information we are collecting.
    // Used by the LLM to distinguish multiple tools, should be an english name
    readonly collectedInfoName: string,
    process: () => Promise<LlmToolCallResult<C, TOOL_RES, INVOKE_RES>>,
  ) {
    const encodedToolName = encodeToolName(collectedInfoName);
    // const funcName = `avoid_answering_question`;
    const funcName = `${encodedToolName}_skip_question`;
    // const funcName = `skip_question`;
    // const funcName = `${encodedToolName}_sure_but_skip_question`;
    // const funcName = `${encodedToolName}_cant_remember_or_skip_question`;
    super(funcName, process);
  }

  override getTool(): OpenAI.ChatCompletionTool {
    return {
      type: 'function',
      function: {
        name: this.toolName,
        // description: `User unable or unwilling to answer "${this.question}"`,
        // description: `User explicitely refuses to answer"`,
        // description: `User wants to skip answering "${this.question}".`,
        // description: `User explicitely refuses to answer "${this.question}" or asks to skip the question.`,
        // description: `User can't remember the answer or wants to skip the question "${this.question}"`,
        description: `User excplitely asks to skip the question "${this.question}" OR user agrees to skip after you asked them OR user refuses to answer OR user does not remember the answer.`, // Never call this if the user answers the question
        parameters: {
          type: 'object',
          properties: {
            // add a reason parameter
            // - this helps guiding the correct decision since the LLM needs to look at the reason text generated
            reason: {
              type: 'string',
              enum: ['user asks to skip', 'user agrees to skip', 'user refuses to answer', "user can't remember"],
            },
          },
          required: ['reason'],
        },
      },
    };
  }
}

export class ConfirmQuestionResponseTool<C extends LlmToolContext, TOOL_RES, INVOKE_RES> extends BoolParamTool<
  C,
  TOOL_RES,
  INVOKE_RES
> {
  private constructor(
    readonly prevQuestion: string,
    // identifies the information we are collecting.
    // Used by the LLM to distinguish multiple tools, should be an english name
    readonly collectedInfoName: string,
    process: (boolValue: boolean) => Promise<LlmToolCallResult<C, TOOL_RES, INVOKE_RES>>,
  ) {
    const encodedToolName = encodeToolName(collectedInfoName);
    const funcName = `${encodedToolName}_confirmation`;
    const boolParamName = `${encodedToolName}_confirmed`;
    super(funcName, boolParamName, process);
  }

  override getTool(): OpenAI.ChatCompletionTool {
    return {
      type: 'function',
      function: {
        name: this.toolName,
        description: `The user responds with saying yes/no, agree/disagree to question "${this.prevQuestion}"`,
        parameters: {
          type: 'object',
          properties: {
            // add a reason parameter before the bool value
            // - this helps guiding the correct bool value since the LLM needs to look at the reason text generated
            reason: {
              type: 'string',
            },
            [this.boolParamName]: {
              type: 'boolean',
              // description: `decision regarding "${this.collectedInfoName}"`
            },
          },
          required: ['reason', this.boolParamName],
        },
      },
    };
  }
}
