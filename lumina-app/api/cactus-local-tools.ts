import { type CactusLMCompleteResult, type Tool } from 'cactus-react-native';

import { buildOfflineTutorSolutionFromText, type OfflineTutorSolution } from '@/utils/offlineMathTutor';

const SOLVE_MATH_PROBLEM_TOOL_NAME = 'solve_math_problem';

export interface LocalMathToolExecutionResult {
  problemText: string;
  solution: OfflineTutorSolution;
}

export const LOCAL_MATH_TOOLS: Tool[] = [
  {
    name: SOLVE_MATH_PROBLEM_TOOL_NAME,
    description: 'Solve a student math problem and return structured step-by-step guidance.',
    parameters: {
      type: 'object',
      properties: {
        problemText: {
          type: 'string',
          description: 'The math problem text from the user.',
        },
        studentGoal: {
          type: 'string',
          description: 'Requested tutoring mode such as hint, next_step, full_solution, or explanation.',
        },
      },
      required: ['problemText'],
    },
  },
];

function readRecordValue(value: unknown): Record<string, unknown> | undefined {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

function readStringArgument(argumentsRecord: Record<string, unknown>, argumentName: string): string | undefined {
  const value = argumentsRecord[argumentName];
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function readProblemTextFromArguments(argumentsRecord: Record<string, unknown>): string | undefined {
  const candidateArgumentNames = ['problemText', 'problem', 'text', 'query'];

  for (const candidateArgumentName of candidateArgumentNames) {
    const candidateValue = readStringArgument(argumentsRecord, candidateArgumentName);
    if (candidateValue != null) {
      return candidateValue;
    }
  }

  return undefined;
}

export function runLocalMathToolFromFunctionCalls(
  functionCalls: CactusLMCompleteResult['functionCalls'] | undefined,
): LocalMathToolExecutionResult | undefined {
  if (!Array.isArray(functionCalls) || functionCalls.length === 0) {
    return undefined;
  }

  for (const functionCall of functionCalls) {
    if (functionCall.name !== SOLVE_MATH_PROBLEM_TOOL_NAME) {
      continue;
    }

    const argumentsRecord = readRecordValue(functionCall.arguments);
    if (argumentsRecord == null) {
      return undefined;
    }

    const problemText = readProblemTextFromArguments(argumentsRecord);
    if (problemText == null) {
      return undefined;
    }

    const solution = buildOfflineTutorSolutionFromText(problemText);
    if (solution == null) {
      return undefined;
    }

    return {
      problemText,
      solution,
    };
  }

  return undefined;
}
