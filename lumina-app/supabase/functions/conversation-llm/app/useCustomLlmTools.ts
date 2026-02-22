/**
 * App Specific LLM Tools for Bot. Given a bot, this function returns the tools to be used by the LLM for that bot.
 */

import { OpenAI } from 'openai';

import { ValidationError } from '../../_shared-client/error/ValidationError.ts';
import { createAlgebraTools } from '../../_shared/algebra/algebra-tools.ts';
import type { CustomLlmTools, CustomLlmToolsProps } from '../../_shared/llm/custom-llm-conversation.ts';
import { LlmTool, type LlmToolCallResult, type LlmToolContext } from '../../_shared/llm/tools/llm-tools.ts';
import { validateBoolParam, validateNumberParam, validateStringParam } from '../../_shared/llm/tools/tool-call-validations.ts';

const CHAT_BOT_PROMPT_NAME = 'chat';

type ToolPropertyType = 'string' | 'number' | 'integer' | 'boolean';

interface TutoringToolPropertySpec {
  type: ToolPropertyType;
  description: string;
  enumValues?: string[];
  minValue?: number;
  maxValue?: number;
}

interface TutoringToolSpec {
  name: string;
  description: string;
  properties: Record<string, TutoringToolPropertySpec>;
  required: string[];
  buildToolPayload: (validatedArguments: Record<string, unknown>) => Record<string, unknown>;
}

function toOpenAiToolProperties(
  properties: Record<string, TutoringToolPropertySpec>,
): Record<string, OpenAI.FunctionParameters> {
  const openAiProperties: Record<string, OpenAI.FunctionParameters> = {};

  for (const [propertyName, propertySpec] of Object.entries(properties)) {
    openAiProperties[propertyName] = {
      type: propertySpec.type,
      description: propertySpec.description,
      enum: propertySpec.enumValues,
      minimum: propertySpec.minValue,
      maximum: propertySpec.maxValue,
    } as OpenAI.FunctionParameters;
  }

  return openAiProperties;
}

function normalizeStringEnumValue(value: string, enumValues: string[], paramName: string): string {
  for (const enumValue of enumValues) {
    if (value.toLowerCase() === enumValue.toLowerCase()) {
      return enumValue;
    }
  }

  throw new ValidationError(`Error: ${paramName} parameter has unknown value`);
}

function validatePropertyValue(
  rawValue: unknown,
  propertyName: string,
  propertySpec: TutoringToolPropertySpec,
): unknown {
  switch (propertySpec.type) {
    case 'string': {
      const stringValue = validateStringParam(rawValue, propertyName);
      if (!propertySpec.enumValues || propertySpec.enumValues.length === 0) {
        return stringValue;
      }

      return normalizeStringEnumValue(stringValue, propertySpec.enumValues, propertyName);
    }

    case 'number':
      return validateNumberParam(rawValue, propertyName, false, propertySpec.minValue, propertySpec.maxValue);

    case 'integer':
      return validateNumberParam(rawValue, propertyName, true, propertySpec.minValue, propertySpec.maxValue);

    case 'boolean':
      return validateBoolParam(rawValue, propertyName);

    default:
      throw new ValidationError(`Error: ${propertyName} has unsupported property type`);
  }
}

function validateToolArguments(
  toolArgsJson: unknown,
  spec: TutoringToolSpec,
): Record<string, unknown> {
  if (toolArgsJson == null || typeof toolArgsJson !== 'object' || Array.isArray(toolArgsJson)) {
    throw new ValidationError('Error: tool arguments are missing or invalid');
  }

  const argumentsRecord = toolArgsJson as Record<string, unknown>;
  const validatedArguments: Record<string, unknown> = {};

  for (const [propertyName, propertySpec] of Object.entries(spec.properties)) {
    const propertyValue = argumentsRecord[propertyName];
    const isRequired = spec.required.includes(propertyName);

    if (propertyValue == null) {
      if (isRequired) {
        throw new ValidationError(`Error: ${propertyName} parameter missing`);
      }
      continue;
    }

    validatedArguments[propertyName] = validatePropertyValue(propertyValue, propertyName, propertySpec);
  }

  return validatedArguments;
}

class TutoringStructuredTool extends LlmTool<LlmToolContext, void, boolean> {
  constructor(private readonly spec: TutoringToolSpec) {
    super(spec.name);
  }

  override getTool(): OpenAI.ChatCompletionTool {
    return {
      type: 'function',
      function: {
        name: this.spec.name,
        description: this.spec.description,
        parameters: {
          type: 'object',
          properties: toOpenAiToolProperties(this.spec.properties),
          required: this.spec.required,
        },
      },
    };
  }

  override async callTool(
    toolArgsJson: unknown,
    _context: LlmToolContext,
  ): Promise<LlmToolCallResult<LlmToolContext, void, boolean>> {
    const validatedArguments = validateToolArguments(toolArgsJson, this.spec);
    const payload = this.spec.buildToolPayload(validatedArguments);

    return {
      tool: JSON.stringify(payload),
      followUpInvocation: 'want',
    };
  }
}

function makeTutoringToolSpecs(): TutoringToolSpec[] {
  return [
    {
      name: 'plan_math_solution',
      description:
        'Create a step-by-step tutoring plan for solving a specific math problem in a student-friendly way.',
      properties: {
        problemText: {
          type: 'string',
          description: 'The exact math problem the student needs help solving.',
        },
        studentGoal: {
          type: 'string',
          description: 'Whether the student wants a hint, next step, full solution, or explanation.',
          enumValues: ['hint', 'next_step', 'full_solution', 'explanation'],
        },
        gradeLevel: {
          type: 'string',
          description: 'Estimated grade or level if provided by the student.',
        },
      },
      required: ['problemText'],
      buildToolPayload: (validatedArguments) => ({
        action: 'plan_math_solution',
        inputs: validatedArguments,
        tutorPolicy: {
          style: 'supportive_step_by_step',
          requirements: [
            'Use concise steps and clear transitions.',
            'If possible, include one checkpoint question for the student.',
            'Avoid skipping algebra/arithmetic transformations.',
          ],
        },
      }),
    },
    {
      name: 'check_math_answer',
      description:
        'Check a student answer against a given problem and explain if it is correct, partially correct, or incorrect.',
      properties: {
        problemText: {
          type: 'string',
          description: 'The original problem statement.',
        },
        studentAnswer: {
          type: 'string',
          description: 'The student answer to verify.',
        },
        expectedFormat: {
          type: 'string',
          description: 'Optional expected answer format (fraction, decimal, equation, etc.).',
        },
      },
      required: ['problemText', 'studentAnswer'],
      buildToolPayload: (validatedArguments) => ({
        action: 'check_math_answer',
        inputs: validatedArguments,
        tutorPolicy: {
          style: 'feedback_first',
          requirements: [
            'State correctness clearly.',
            'If incorrect, show where reasoning diverged.',
            'Provide the corrected reasoning path in short steps.',
          ],
        },
      }),
    },
    {
      name: 'explain_math_concept',
      description:
        'Explain a math concept at the student level, with optional worked example and quick recap.',
      properties: {
        concept: {
          type: 'string',
          description: 'The concept to explain (for example: distributive property, slope, fractions).',
        },
        gradeLevel: {
          type: 'string',
          description: 'Student grade or level if known.',
        },
        includeWorkedExample: {
          type: 'boolean',
          description: 'Whether to include a solved example.',
        },
      },
      required: ['concept'],
      buildToolPayload: (validatedArguments) => ({
        action: 'explain_math_concept',
        inputs: validatedArguments,
        tutorPolicy: {
          style: 'plain_language',
          requirements: [
            'Use one short definition first.',
            'Use intuitive language before symbols when possible.',
            'End with a one-line recap.',
          ],
        },
      }),
    },
    {
      name: 'generate_practice_problems',
      description:
        'Generate targeted practice problems for a topic with adjustable difficulty and amount.',
      properties: {
        topic: {
          type: 'string',
          description: 'The topic to practice.',
        },
        difficulty: {
          type: 'string',
          description: 'Difficulty level to target.',
          enumValues: ['easy', 'medium', 'hard'],
        },
        questionCount: {
          type: 'integer',
          description: 'How many practice problems to generate (1-5).',
          minValue: 1,
          maxValue: 5,
        },
        includeWordProblems: {
          type: 'boolean',
          description: 'Whether to include word problems.',
        },
      },
      required: ['topic'],
      buildToolPayload: (validatedArguments) => ({
        action: 'generate_practice_problems',
        inputs: validatedArguments,
        tutorPolicy: {
          style: 'practice_mode',
          requirements: [
            'Return clear numbered problems.',
            'Do not reveal full solutions unless asked.',
            'Include a quick answer key only if explicitly requested.',
          ],
        },
      }),
    },
  ];
}

function makeTutoringTools(): LlmTool<LlmToolContext, void, boolean>[] {
  const tools: LlmTool<LlmToolContext, void, boolean>[] = [];

  for (const spec of makeTutoringToolSpecs()) {
    tools.push(new TutoringStructuredTool(spec));
  }

  return tools;
}

function shouldEnableTutoringTools(botPromptName?: string): boolean {
  if (botPromptName == null) {
    return true;
  }

  return botPromptName === CHAT_BOT_PROMPT_NAME;
}

export default async function useCustomLlmTools(props: CustomLlmToolsProps): Promise<CustomLlmTools> {
  if (!shouldEnableTutoringTools(props.botPromptName)) {
    return {};
  }

  // Combine tutoring tools with algebra tools
  const tutoringTools = makeTutoringTools();
  const algebraTools = createAlgebraTools();

  return {
    tools: [...tutoringTools, ...algebraTools],
  };
}
