/**
 * Algebra LLM Tools
 * Provides LLM-callable tools for algebraic operations
 */

import { OpenAI } from 'openai';

import { ValidationError } from '../../_shared-client/error/ValidationError.ts';
import { LlmTool, type LlmToolCallResult, type LlmToolContext } from '../llm/tools/llm-tools.ts';
import { validateStringParam, validateNumberParam, validateBoolParam } from '../llm/tools/tool-call-validations.ts';
import {
  solveLinearEquation,
  solveSystemOfEquations,
  graphFunction,
  validateSolutionSteps,
  simplifyExpression,
  evaluateExpression,
  expandExpression,
  type EquationSolution,
  type FunctionGraph,
  type StepValidationResult,
} from './algebra-utils.ts';

/**
 * Tool for solving linear equations
 */
export class SolveLinearEquationTool extends LlmTool<LlmToolContext, EquationSolution, boolean> {
  constructor() {
    super('solve_linear_equation');
  }

  override getTool(): OpenAI.ChatCompletionTool {
    return {
      type: 'function',
      function: {
        name: this.toolName,
        description: 'Solves a linear equation and shows step-by-step solution. Use for equations like "2x + 3 = 7" or "3(x - 2) = 9".',
        parameters: {
          type: 'object',
          properties: {
            equation: {
              type: 'string',
              description: 'The linear equation to solve (e.g., "2x + 3 = 7", "x/2 - 1 = 5")',
            },
            showSteps: {
              type: 'boolean',
              description: 'Whether to include step-by-step solution (default: true)',
            },
          },
          required: ['equation'],
        },
      },
    };
  }

  override async callTool(
    toolArgsJson: unknown,
    _context: LlmToolContext,
  ): Promise<LlmToolCallResult<LlmToolContext, EquationSolution, boolean>> {
    const args = toolArgsJson as Record<string, unknown>;
    const equation = validateStringParam(args.equation, 'equation');
    const showSteps = args.showSteps !== false;

    const solution = solveLinearEquation(equation);

    let responseText: string;
    if (solution.isValid) {
      responseText = `Solution: ${solution.variable} = ${solution.solutions.join(' or ')}`;
      
      if (showSteps && solution.steps.length > 0) {
        responseText += '\n\nSteps:\n';
        for (const step of solution.steps) {
          responseText += `${step.stepNumber}. ${step.description}: ${step.expression}`;
          if (step.operation) {
            responseText += ` (${step.operation})`;
          }
          responseText += '\n';
        }
      }
    } else {
      responseText = `Could not solve equation: ${solution.errorMessage}`;
    }

    return {
      tool: responseText,
      toolData: solution,
      followUpInvocation: 'want',
    };
  }
}

/**
 * Tool for solving systems of linear equations
 */
export class SolveSystemOfEquationsTool extends LlmTool<LlmToolContext, Record<string, string>, boolean> {
  constructor() {
    super('solve_system_of_equations');
  }

  override getTool(): OpenAI.ChatCompletionTool {
    return {
      type: 'function',
      function: {
        name: this.toolName,
        description: 'Solves a system of linear equations. Provide multiple equations to find values of all variables.',
        parameters: {
          type: 'object',
          properties: {
            equations: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of equations (e.g., ["2x + y = 5", "x - y = 1"])',
            },
          },
          required: ['equations'],
        },
      },
    };
  }

  override async callTool(
    toolArgsJson: unknown,
    _context: LlmToolContext,
  ): Promise<LlmToolCallResult<LlmToolContext, Record<string, string>, boolean>> {
    const args = toolArgsJson as Record<string, unknown>;
    
    if (!Array.isArray(args.equations)) {
      throw new ValidationError('equations must be an array of strings');
    }
    
    const equations = args.equations.map((eq, i) => validateStringParam(eq, `equation[${i}]`));
    const result = solveSystemOfEquations(equations);

    let responseText: string;
    if (result.isValid) {
      responseText = 'Solutions:\n';
      for (const [variable, value] of Object.entries(result.solutions)) {
        responseText += `  ${variable} = ${value}\n`;
      }
      
      if (result.steps.length > 0) {
        responseText += '\nSteps:\n';
        for (const step of result.steps) {
          responseText += `${step.stepNumber}. ${step.description}\n`;
        }
      }
    } else {
      responseText = `Could not solve system: ${result.errorMessage}`;
    }

    return {
      tool: responseText,
      toolData: result.solutions,
      followUpInvocation: 'want',
    };
  }
}

/**
 * Tool for graphing functions
 */
export class GraphFunctionTool extends LlmTool<LlmToolContext, FunctionGraph, boolean> {
  constructor() {
    super('graph_function');
  }

  override getTool(): OpenAI.ChatCompletionTool {
    return {
      type: 'function',
      function: {
        name: this.toolName,
        description: 'Analyzes a function and generates data for graphing. Returns key points, characteristics (slope, intercepts, vertex), and sample points.',
        parameters: {
          type: 'object',
          properties: {
            expression: {
              type: 'string',
              description: 'The function expression (e.g., "2*x + 3", "x^2 - 4*x + 3")',
            },
            variable: {
              type: 'string',
              description: 'The independent variable (default: "x")',
            },
            domainMin: {
              type: 'number',
              description: 'Minimum x value for the graph (default: -10)',
            },
            domainMax: {
              type: 'number',
              description: 'Maximum x value for the graph (default: 10)',
            },
            numPoints: {
              type: 'integer',
              description: 'Number of points to generate (default: 21)',
            },
          },
          required: ['expression'],
        },
      },
    };
  }

  override async callTool(
    toolArgsJson: unknown,
    _context: LlmToolContext,
  ): Promise<LlmToolCallResult<LlmToolContext, FunctionGraph, boolean>> {
    const args = toolArgsJson as Record<string, unknown>;
    const expression = validateStringParam(args.expression, 'expression');
    const variable = typeof args.variable === 'string' ? args.variable : 'x';
    const domainMin = typeof args.domainMin === 'number' ? args.domainMin : -10;
    const domainMax = typeof args.domainMax === 'number' ? args.domainMax : 10;
    const numPoints = typeof args.numPoints === 'number' ? Math.min(Math.max(args.numPoints, 5), 100) : 21;

    const graph = graphFunction(expression, variable, domainMin, domainMax, numPoints);

    let responseText = `Function Analysis: f(${variable}) = ${expression}\n\n`;
    
    responseText += `Type: ${graph.characteristics.type}\n`;
    responseText += `Domain: [${graph.domain.min}, ${graph.domain.max}]\n`;
    responseText += `Range: [${graph.range.min.toFixed(2)}, ${graph.range.max.toFixed(2)}]\n\n`;
    
    if (graph.characteristics.yIntercept !== undefined) {
      responseText += `Y-intercept: (0, ${graph.characteristics.yIntercept})\n`;
    }
    
    if (graph.characteristics.xIntercepts && graph.characteristics.xIntercepts.length > 0) {
      const xInts = graph.characteristics.xIntercepts.map(x => `(${x.toFixed(2)}, 0)`).join(', ');
      responseText += `X-intercept(s): ${xInts}\n`;
    }
    
    if (graph.characteristics.isLinear && graph.characteristics.slope !== undefined) {
      responseText += `Slope: ${graph.characteristics.slope}\n`;
    }
    
    if (graph.characteristics.vertex) {
      responseText += `Vertex: (${graph.characteristics.vertex.x.toFixed(2)}, ${graph.characteristics.vertex.y.toFixed(2)})\n`;
    }
    
    // Include some sample points
    responseText += '\nSample Points:\n';
    const sampleIndices = [0, Math.floor(numPoints / 4), Math.floor(numPoints / 2), Math.floor(3 * numPoints / 4), numPoints - 1];
    for (const i of sampleIndices) {
      if (graph.points[i]) {
        const p = graph.points[i];
        responseText += `  (${p.x.toFixed(2)}, ${p.y.toFixed(2)})\n`;
      }
    }

    return {
      tool: responseText,
      toolData: graph,
      followUpInvocation: 'want',
    };
  }
}

/**
 * Tool for validating solution steps
 */
export class ValidateSolutionStepsTool extends LlmTool<LlmToolContext, StepValidationResult, boolean> {
  constructor() {
    super('validate_solution_steps');
  }

  override getTool(): OpenAI.ChatCompletionTool {
    return {
      type: 'function',
      function: {
        name: this.toolName,
        description: 'Validates a series of mathematical solution steps to identify errors. Checks if each step is a valid transformation from the previous step.',
        parameters: {
          type: 'object',
          properties: {
            originalProblem: {
              type: 'string',
              description: 'The original problem or equation',
            },
            steps: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of solution steps in order',
            },
            expectedAnswer: {
              type: 'string',
              description: 'Optional expected final answer to verify against',
            },
          },
          required: ['originalProblem', 'steps'],
        },
      },
    };
  }

  override async callTool(
    toolArgsJson: unknown,
    _context: LlmToolContext,
  ): Promise<LlmToolCallResult<LlmToolContext, StepValidationResult, boolean>> {
    const args = toolArgsJson as Record<string, unknown>;
    const originalProblem = validateStringParam(args.originalProblem, 'originalProblem');
    
    if (!Array.isArray(args.steps)) {
      throw new ValidationError('steps must be an array of strings');
    }
    
    const steps = args.steps.map((step, i) => validateStringParam(step, `step[${i}]`));
    const expectedAnswer = typeof args.expectedAnswer === 'string' ? args.expectedAnswer : undefined;

    const result = validateSolutionSteps(originalProblem, steps, expectedAnswer);

    let responseText = `Step Validation Results:\n\n`;
    responseText += `Overall: ${result.isValid ? '✓ All steps valid' : '✗ Errors found'}\n`;
    responseText += `${result.overallFeedback}\n\n`;
    
    responseText += 'Step-by-Step Analysis:\n';
    for (const stepResult of result.stepResults) {
      const status = stepResult.isCorrect ? '✓' : '✗';
      responseText += `  Step ${stepResult.stepNumber}: ${status} ${stepResult.inputExpression}\n`;
      responseText += `    ${stepResult.feedback}\n`;
      
      if (!stepResult.isCorrect && stepResult.errorType) {
        responseText += `    Error type: ${stepResult.errorType}\n`;
      }
    }

    return {
      tool: responseText,
      toolData: result,
      followUpInvocation: 'want',
    };
  }
}

/**
 * Tool for simplifying expressions
 */
export class SimplifyExpressionTool extends LlmTool<LlmToolContext, { simplified: string }, boolean> {
  constructor() {
    super('simplify_expression');
  }

  override getTool(): OpenAI.ChatCompletionTool {
    return {
      type: 'function',
      function: {
        name: this.toolName,
        description: 'Simplifies a mathematical expression by combining like terms and reducing.',
        parameters: {
          type: 'object',
          properties: {
            expression: {
              type: 'string',
              description: 'The expression to simplify (e.g., "2x + 3x - x + 5 - 2")',
            },
          },
          required: ['expression'],
        },
      },
    };
  }

  override async callTool(
    toolArgsJson: unknown,
    _context: LlmToolContext,
  ): Promise<LlmToolCallResult<LlmToolContext, { simplified: string }, boolean>> {
    const args = toolArgsJson as Record<string, unknown>;
    const expression = validateStringParam(args.expression, 'expression');

    const result = simplifyExpression(expression);

    let responseText = `Original: ${result.original}\n`;
    responseText += `Simplified: ${result.simplified}\n`;

    return {
      tool: responseText,
      toolData: { simplified: result.simplified },
      followUpInvocation: 'want',
    };
  }
}

/**
 * Tool for evaluating expressions
 */
export class EvaluateExpressionTool extends LlmTool<LlmToolContext, { result: number | null }, boolean> {
  constructor() {
    super('evaluate_expression');
  }

  override getTool(): OpenAI.ChatCompletionTool {
    return {
      type: 'function',
      function: {
        name: this.toolName,
        description: 'Evaluates a mathematical expression with given variable values.',
        parameters: {
          type: 'object',
          properties: {
            expression: {
              type: 'string',
              description: 'The expression to evaluate (e.g., "2*x + 3*y")',
            },
            variables: {
              type: 'object',
              description: 'Object with variable names and their values (e.g., {"x": 2, "y": 3})',
              additionalProperties: { type: 'number' },
            },
          },
          required: ['expression', 'variables'],
        },
      },
    };
  }

  override async callTool(
    toolArgsJson: unknown,
    _context: LlmToolContext,
  ): Promise<LlmToolCallResult<LlmToolContext, { result: number | null }, boolean>> {
    const args = toolArgsJson as Record<string, unknown>;
    const expression = validateStringParam(args.expression, 'expression');
    
    if (typeof args.variables !== 'object' || args.variables === null) {
      throw new ValidationError('variables must be an object');
    }
    
    const variables: Record<string, number> = {};
    for (const [key, value] of Object.entries(args.variables as Record<string, unknown>)) {
      if (typeof value !== 'number') {
        throw new ValidationError(`Variable ${key} must be a number`);
      }
      variables[key] = value;
    }

    const result = evaluateExpression(expression, variables);

    let responseText: string;
    if (result.result !== null) {
      const varStr = Object.entries(variables).map(([k, v]) => `${k}=${v}`).join(', ');
      responseText = `f(${varStr}) = ${expression} = ${result.result}`;
    } else {
      responseText = `Could not evaluate: ${result.error}`;
    }

    return {
      tool: responseText,
      toolData: { result: result.result },
      followUpInvocation: 'want',
    };
  }
}

/**
 * Tool for expanding expressions
 */
export class ExpandExpressionTool extends LlmTool<LlmToolContext, { expanded: string }, boolean> {
  constructor() {
    super('expand_expression');
  }

  override getTool(): OpenAI.ChatCompletionTool {
    return {
      type: 'function',
      function: {
        name: this.toolName,
        description: 'Expands a factored or grouped expression (e.g., "(x+2)(x-3)" becomes "x^2 - x - 6").',
        parameters: {
          type: 'object',
          properties: {
            expression: {
              type: 'string',
              description: 'The expression to expand',
            },
          },
          required: ['expression'],
        },
      },
    };
  }

  override async callTool(
    toolArgsJson: unknown,
    _context: LlmToolContext,
  ): Promise<LlmToolCallResult<LlmToolContext, { expanded: string }, boolean>> {
    const args = toolArgsJson as Record<string, unknown>;
    const expression = validateStringParam(args.expression, 'expression');

    const result = expandExpression(expression);

    let responseText = `Original: ${result.original}\n`;
    responseText += `Expanded: ${result.expanded}\n`;

    return {
      tool: responseText,
      toolData: { expanded: result.expanded },
      followUpInvocation: 'want',
    };
  }
}

/**
 * Tool for rendering LaTeX expressions
 * This tool helps the model format mathematical expressions as LaTeX
 */
export class RenderLatexTool extends LlmTool<LlmToolContext, { latex: string; displayMode: boolean }, boolean> {
  constructor() {
    super('render_latex');
  }

  override getTool(): OpenAI.ChatCompletionTool {
    return {
      type: 'function',
      function: {
        name: this.toolName,
        description: 'Formats a mathematical expression as LaTeX for beautiful rendering. Use this to ensure math expressions display correctly.',
        parameters: {
          type: 'object',
          properties: {
            expression: {
              type: 'string',
              description: 'The mathematical expression to format as LaTeX (e.g., "x = (-b ± sqrt(b^2 - 4ac)) / (2a)" or already formatted LaTeX like "\\frac{1}{2}")',
            },
            displayMode: {
              type: 'boolean',
              description: 'If true, renders as a display equation ($$...$$). If false, renders inline ($...$). Default: false',
            },
          },
          required: ['expression'],
        },
      },
    };
  }

  override async callTool(
    toolArgsJson: unknown,
    _context: LlmToolContext,
  ): Promise<LlmToolCallResult<LlmToolContext, { latex: string; displayMode: boolean }, boolean>> {
    const args = toolArgsJson as Record<string, unknown>;
    const expression = validateStringParam(args.expression, 'expression');
    const displayMode = args.displayMode === true;

    // Convert common math notation to LaTeX if needed
    let latex = expression;
    
    // Common conversions for expressions that aren't already LaTeX
    if (!expression.includes('\\')) {
      // Convert sqrt() to \sqrt{}
      latex = latex.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');
      // Convert fractions like a/b to \frac{a}{b} (simple cases)
      latex = latex.replace(/\(([^)]+)\)\/\(([^)]+)\)/g, '\\frac{$1}{$2}');
      // Convert ± to \pm
      latex = latex.replace(/±/g, '\\pm');
      // Convert × to \times
      latex = latex.replace(/×/g, '\\times');
      // Convert ÷ to \div
      latex = latex.replace(/÷/g, '\\div');
      // Convert ≤ to \leq
      latex = latex.replace(/≤/g, '\\leq');
      // Convert ≥ to \geq
      latex = latex.replace(/≥/g, '\\geq');
      // Convert ^ for exponents (e.g., x^2 stays as x^2, x^10 becomes x^{10})
      latex = latex.replace(/\^(\d{2,})/g, '^{$1}');
    }

    const formattedLatex = displayMode ? `$$${latex}$$` : `$${latex}$`;

    const responseText = `LaTeX formatted: ${formattedLatex}`;

    return {
      tool: responseText,
      toolData: { latex: formattedLatex, displayMode },
      followUpInvocation: 'want',
    };
  }
}

/**
 * Creates all algebra tools
 */
export function createAlgebraTools(): LlmTool<LlmToolContext, unknown, boolean>[] {
  return [
    new SolveLinearEquationTool(),
    new SolveSystemOfEquationsTool(),
    new GraphFunctionTool(),
    new ValidateSolutionStepsTool(),
    new SimplifyExpressionTool(),
    new EvaluateExpressionTool(),
    new ExpandExpressionTool(),
    new RenderLatexTool(),
  ];
}

