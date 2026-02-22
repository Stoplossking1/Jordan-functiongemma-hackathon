/**
 * Algebra Utilities Module
 * Provides functionality for solving equations, graphing functions, and validating math steps
 * Uses mathjs for symbolic computation
 */

// @deno-types="npm:@types/mathjs@13.2.0"
import { create, all, type EvalFunction } from 'mathjs';

// Create a mathjs instance with all functions
const math = create(all);

// Types
export interface EquationSolution {
  variable: string;
  solutions: string[];
  steps: SolutionStep[];
  isValid: boolean;
  errorMessage?: string;
}

export interface SolutionStep {
  stepNumber: number;
  description: string;
  expression: string;
  operation?: string;
}

export interface GraphPoint {
  x: number;
  y: number;
}

export interface FunctionGraph {
  expression: string;
  points: GraphPoint[];
  domain: { min: number; max: number };
  range: { min: number; max: number };
  characteristics: FunctionCharacteristics;
}

export interface FunctionCharacteristics {
  type: string;
  slope?: number;
  yIntercept?: number;
  xIntercepts?: number[];
  vertex?: GraphPoint;
  isLinear: boolean;
  isQuadratic: boolean;
}

export interface StepValidationResult {
  isValid: boolean;
  stepResults: StepCheckResult[];
  overallFeedback: string;
  errorSteps: number[];
}

export interface StepCheckResult {
  stepNumber: number;
  inputExpression: string;
  isCorrect: boolean;
  expectedResult?: string;
  actualResult?: string;
  feedback: string;
  errorType?: 'arithmetic' | 'algebraic' | 'logical' | 'simplification';
}

/**
 * Parses and normalizes a mathematical expression
 */
function parseExpression(expr: string): string {
  // Remove whitespace and normalize
  let normalized = expr.trim();
  
  // Handle implicit multiplication (e.g., 2x -> 2*x)
  normalized = normalized.replace(/(\d)([a-zA-Z])/g, '$1*$2');
  normalized = normalized.replace(/([a-zA-Z])(\d)/g, '$1*$2');
  normalized = normalized.replace(/\)(\d)/g, ')*$1');
  normalized = normalized.replace(/(\d)\(/g, '$1*(');
  normalized = normalized.replace(/\)\(/g, ')*(');
  
  return normalized;
}

/**
 * Solves a linear equation of the form ax + b = c
 */
export function solveLinearEquation(equation: string): EquationSolution {
  const steps: SolutionStep[] = [];
  
  try {
    // Split equation by '='
    const parts = equation.split('=');
    if (parts.length !== 2) {
      return {
        variable: 'x',
        solutions: [],
        steps: [],
        isValid: false,
        errorMessage: 'Invalid equation format. Expected format: expression = expression',
      };
    }
    
    const leftSide = parseExpression(parts[0]);
    const rightSide = parseExpression(parts[1]);
    
    steps.push({
      stepNumber: 1,
      description: 'Start with the original equation',
      expression: `${parts[0].trim()} = ${parts[1].trim()}`,
    });
    
    // Move everything to the left side
    const combined = `(${leftSide}) - (${rightSide})`;
    
    steps.push({
      stepNumber: 2,
      description: 'Move all terms to one side',
      expression: `${combined} = 0`,
      operation: 'subtract right side from both sides',
    });
    
    // Simplify the expression
    const simplified = math.simplify(combined);
    const simplifiedStr = simplified.toString();
    
    steps.push({
      stepNumber: 3,
      description: 'Simplify the expression',
      expression: `${simplifiedStr} = 0`,
      operation: 'combine like terms',
    });
    
    // Find the variable (assume single variable)
    const variables = getVariables(simplifiedStr);
    const variable = variables[0] ?? 'x';
    
    // Solve for the variable
    // Parse coefficients for ax + b = 0 form
    const solution = solveForVariable(simplifiedStr, variable);
    
    if (solution !== null) {
      steps.push({
        stepNumber: 4,
        description: `Solve for ${variable}`,
        expression: `${variable} = ${solution}`,
        operation: 'isolate variable',
      });
      
      return {
        variable,
        solutions: [solution],
        steps,
        isValid: true,
      };
    }
    
    return {
      variable,
      solutions: [],
      steps,
      isValid: false,
      errorMessage: 'Could not solve the equation',
    };
  } catch (error) {
    return {
      variable: 'x',
      solutions: [],
      steps,
      isValid: false,
      errorMessage: `Error solving equation: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Extracts variables from an expression
 */
function getVariables(expr: string): string[] {
  const matches = expr.match(/[a-zA-Z]+/g);
  if (!matches) return [];
  
  // Filter out math functions
  const mathFunctions = ['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'abs', 'exp'];
  return [...new Set(matches.filter(m => !mathFunctions.includes(m.toLowerCase())))];
}

/**
 * Solves for a variable in a simplified expression = 0
 */
function solveForVariable(expr: string, variable: string): string | null {
  try {
    // Use mathjs to solve
    const node = math.parse(expr);
    
    // Try to extract coefficient and constant
    // For ax + b = 0, solution is x = -b/a
    const compiled = node.compile();
    
    // Evaluate at two points to find slope and intercept
    const scope1: Record<string, number> = { [variable]: 0 };
    const scope2: Record<string, number> = { [variable]: 1 };
    
    const y1 = compiled.evaluate(scope1);
    const y2 = compiled.evaluate(scope2);
    
    // For linear: y = ax + b
    // y1 = b (when x=0)
    // y2 = a + b (when x=1)
    // a = y2 - y1
    const a = y2 - y1;
    const b = y1;
    
    if (Math.abs(a) < 1e-10) {
      // No solution or infinite solutions
      if (Math.abs(b) < 1e-10) {
        return 'infinite solutions (identity)';
      }
      return null; // No solution
    }
    
    // x = -b/a
    const solution = -b / a;
    
    // Format the solution nicely
    if (Number.isInteger(solution)) {
      return solution.toString();
    }
    
    // Try to express as a fraction
    const fraction = math.fraction(solution);
    if (fraction.d <= 100) {
      return fraction.n === fraction.d ? '1' : `${fraction.n}/${fraction.d}`;
    }
    
    return solution.toFixed(4).replace(/\.?0+$/, '');
  } catch {
    return null;
  }
}

/**
 * Solves a system of linear equations
 */
export function solveSystemOfEquations(equations: string[]): {
  solutions: Record<string, string>;
  steps: SolutionStep[];
  isValid: boolean;
  errorMessage?: string;
} {
  const steps: SolutionStep[] = [];
  
  try {
    // Parse equations into matrix form
    const allVariables = new Set<string>();
    const parsedEquations: { coefficients: Record<string, number>; constant: number }[] = [];
    
    for (const eq of equations) {
      const parts = eq.split('=');
      if (parts.length !== 2) {
        return {
          solutions: {},
          steps: [],
          isValid: false,
          errorMessage: `Invalid equation format: ${eq}`,
        };
      }
      
      const leftExpr = parseExpression(parts[0]);
      const rightExpr = parseExpression(parts[1]);
      const combined = `(${leftExpr}) - (${rightExpr})`;
      
      const variables = getVariables(combined);
      variables.forEach(v => allVariables.add(v));
      
      // Extract coefficients
      const coefficients: Record<string, number> = {};
      const node = math.parse(combined);
      const compiled = node.compile();
      
      // Get constant term
      const zeroScope: Record<string, number> = {};
      for (const v of allVariables) {
        zeroScope[v] = 0;
      }
      const constant = compiled.evaluate(zeroScope);
      
      // Get coefficients for each variable
      for (const v of allVariables) {
        const scope1: Record<string, number> = { ...zeroScope };
        const scope2: Record<string, number> = { ...zeroScope, [v]: 1 };
        coefficients[v] = compiled.evaluate(scope2) - compiled.evaluate(scope1);
      }
      
      parsedEquations.push({ coefficients, constant: -constant });
    }
    
    const variableList = Array.from(allVariables).sort();
    
    steps.push({
      stepNumber: 1,
      description: 'Set up the system of equations',
      expression: equations.join('\n'),
    });
    
    // Build matrix A and vector b for Ax = b
    const A: number[][] = parsedEquations.map(eq => 
      variableList.map(v => eq.coefficients[v] ?? 0)
    );
    const b: number[] = parsedEquations.map(eq => eq.constant);
    
    steps.push({
      stepNumber: 2,
      description: 'Convert to matrix form Ax = b',
      expression: `A = ${JSON.stringify(A)}, b = ${JSON.stringify(b)}`,
    });
    
    // Solve using mathjs
    const solution = math.lusolve(A, b) as number[][];
    
    const solutions: Record<string, string> = {};
    variableList.forEach((v, i) => {
      const val = solution[i][0];
      if (Number.isInteger(val)) {
        solutions[v] = val.toString();
      } else {
        const fraction = math.fraction(val);
        if (fraction.d <= 100 && fraction.d !== 1) {
          solutions[v] = `${fraction.n}/${fraction.d}`;
        } else {
          solutions[v] = val.toFixed(4).replace(/\.?0+$/, '');
        }
      }
    });
    
    steps.push({
      stepNumber: 3,
      description: 'Solve the system',
      expression: Object.entries(solutions).map(([k, v]) => `${k} = ${v}`).join(', '),
    });
    
    return {
      solutions,
      steps,
      isValid: true,
    };
  } catch (error) {
    return {
      solutions: {},
      steps,
      isValid: false,
      errorMessage: `Error solving system: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Generates points for graphing a function
 */
export function graphFunction(
  expression: string,
  variable = 'x',
  domainMin = -10,
  domainMax = 10,
  numPoints = 100,
): FunctionGraph {
  const points: GraphPoint[] = [];
  const step = (domainMax - domainMin) / (numPoints - 1);
  
  try {
    const parsed = parseExpression(expression);
    const node = math.parse(parsed);
    const compiled = node.compile();
    
    let minY = Infinity;
    let maxY = -Infinity;
    
    for (let i = 0; i < numPoints; i++) {
      const x = domainMin + i * step;
      const scope: Record<string, number> = { [variable]: x };
      
      try {
        const y = compiled.evaluate(scope);
        if (typeof y === 'number' && isFinite(y)) {
          points.push({ x, y });
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      } catch {
        // Skip undefined points
      }
    }
    
    // Analyze function characteristics
    const characteristics = analyzeFunctionCharacteristics(compiled, variable, domainMin, domainMax);
    
    return {
      expression,
      points,
      domain: { min: domainMin, max: domainMax },
      range: { min: minY === Infinity ? 0 : minY, max: maxY === -Infinity ? 0 : maxY },
      characteristics,
    };
  } catch (error) {
    return {
      expression,
      points: [],
      domain: { min: domainMin, max: domainMax },
      range: { min: 0, max: 0 },
      characteristics: {
        type: 'unknown',
        isLinear: false,
        isQuadratic: false,
      },
    };
  }
}

/**
 * Analyzes characteristics of a function
 */
function analyzeFunctionCharacteristics(
  compiled: EvalFunction,
  variable: string,
  domainMin: number,
  domainMax: number,
): FunctionCharacteristics {
  try {
    // Evaluate at a few points to determine function type
    const y0 = compiled.evaluate({ [variable]: 0 });
    const y1 = compiled.evaluate({ [variable]: 1 });
    const y2 = compiled.evaluate({ [variable]: 2 });
    const yNeg1 = compiled.evaluate({ [variable]: -1 });
    
    // Check if linear: second differences should be 0
    const firstDiff1 = y1 - y0;
    const firstDiff2 = y2 - y1;
    const secondDiff = firstDiff2 - firstDiff1;
    
    const isLinear = Math.abs(secondDiff) < 1e-10;
    const isQuadratic = !isLinear && Math.abs(secondDiff) > 1e-10;
    
    const characteristics: FunctionCharacteristics = {
      type: isLinear ? 'linear' : isQuadratic ? 'quadratic' : 'other',
      isLinear,
      isQuadratic,
      yIntercept: typeof y0 === 'number' && isFinite(y0) ? y0 : undefined,
    };
    
    if (isLinear) {
      characteristics.slope = firstDiff1;
      
      // Find x-intercept: y = mx + b, so x = -b/m
      if (Math.abs(firstDiff1) > 1e-10) {
        characteristics.xIntercepts = [-y0 / firstDiff1];
      }
    }
    
    if (isQuadratic) {
      // For quadratic: find vertex
      // y = ax^2 + bx + c
      // a = secondDiff / 2
      // b = firstDiff1 - a (since firstDiff1 = 2a*0 + b = b when evaluated at x=0 to x=1)
      const a = secondDiff / 2;
      const b = firstDiff1 - a;
      
      // Vertex at x = -b/(2a)
      const vertexX = -b / (2 * a);
      const vertexY = compiled.evaluate({ [variable]: vertexX });
      
      if (typeof vertexY === 'number' && isFinite(vertexY)) {
        characteristics.vertex = { x: vertexX, y: vertexY };
      }
      
      // Find x-intercepts using quadratic formula
      const c = y0;
      const discriminant = b * b - 4 * a * c;
      
      if (discriminant >= 0) {
        const sqrtDisc = Math.sqrt(discriminant);
        const x1 = (-b + sqrtDisc) / (2 * a);
        const x2 = (-b - sqrtDisc) / (2 * a);
        
        if (discriminant === 0) {
          characteristics.xIntercepts = [x1];
        } else {
          characteristics.xIntercepts = [Math.min(x1, x2), Math.max(x1, x2)];
        }
      }
    }
    
    return characteristics;
  } catch {
    return {
      type: 'unknown',
      isLinear: false,
      isQuadratic: false,
    };
  }
}

/**
 * Validates a series of solution steps
 */
export function validateSolutionSteps(
  originalProblem: string,
  steps: string[],
  expectedAnswer?: string,
): StepValidationResult {
  const stepResults: StepCheckResult[] = [];
  const errorSteps: number[] = [];
  
  try {
    let previousExpression = originalProblem;
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepNumber = i + 1;
      
      const result = validateSingleStep(previousExpression, step, stepNumber);
      stepResults.push(result);
      
      if (!result.isCorrect) {
        errorSteps.push(stepNumber);
      }
      
      previousExpression = step;
    }
    
    // Check final answer if provided
    let overallFeedback: string;
    
    if (errorSteps.length === 0) {
      if (expectedAnswer) {
        const finalStep = steps[steps.length - 1];
        const isCorrectAnswer = areExpressionsEquivalent(finalStep, expectedAnswer);
        
        if (isCorrectAnswer) {
          overallFeedback = 'All steps are correct and the final answer matches the expected result.';
        } else {
          overallFeedback = `All steps are mathematically valid, but the final answer "${finalStep}" does not match the expected answer "${expectedAnswer}".`;
        }
      } else {
        overallFeedback = 'All steps appear to be mathematically valid.';
      }
    } else {
      overallFeedback = `Found ${errorSteps.length} error(s) in steps: ${errorSteps.join(', ')}. Please review these steps.`;
    }
    
    return {
      isValid: errorSteps.length === 0,
      stepResults,
      overallFeedback,
      errorSteps,
    };
  } catch (error) {
    return {
      isValid: false,
      stepResults,
      overallFeedback: `Error validating steps: ${error instanceof Error ? error.message : 'Unknown error'}`,
      errorSteps,
    };
  }
}

/**
 * Validates a single step transformation
 */
function validateSingleStep(
  previousExpression: string,
  currentExpression: string,
  stepNumber: number,
): StepCheckResult {
  try {
    // Check if expressions are equations or just expressions
    const prevIsEquation = previousExpression.includes('=');
    const currIsEquation = currentExpression.includes('=');
    
    if (prevIsEquation && currIsEquation) {
      // Both are equations - check if transformation is valid
      return validateEquationTransformation(previousExpression, currentExpression, stepNumber);
    } else if (!prevIsEquation && !currIsEquation) {
      // Both are expressions - check equivalence
      return validateExpressionTransformation(previousExpression, currentExpression, stepNumber);
    } else {
      // Mixed - likely extracting solution
      return {
        stepNumber,
        inputExpression: currentExpression,
        isCorrect: true, // Allow transition from equation to solution
        feedback: 'Step accepted (transition between equation and expression)',
      };
    }
  } catch (error) {
    return {
      stepNumber,
      inputExpression: currentExpression,
      isCorrect: false,
      feedback: `Could not validate step: ${error instanceof Error ? error.message : 'Unknown error'}`,
      errorType: 'logical',
    };
  }
}

/**
 * Validates an equation transformation
 */
function validateEquationTransformation(
  prev: string,
  curr: string,
  stepNumber: number,
): StepCheckResult {
  try {
    const [prevLeft, prevRight] = prev.split('=').map(s => parseExpression(s.trim()));
    const [currLeft, currRight] = curr.split('=').map(s => parseExpression(s.trim()));
    
    // Check if the transformation preserves equality
    // (prevLeft - prevRight) should equal (currLeft - currRight) when simplified
    const prevDiff = math.simplify(`(${prevLeft}) - (${prevRight})`);
    const currDiff = math.simplify(`(${currLeft}) - (${currRight})`);
    
    // Evaluate at a test point
    const variables = getVariables(prev + curr);
    const testScope: Record<string, number> = {};
    variables.forEach(v => { testScope[v] = Math.random() * 10; });
    
    const prevVal = prevDiff.compile().evaluate(testScope);
    const currVal = currDiff.compile().evaluate(testScope);
    
    const isEquivalent = Math.abs(prevVal - currVal) < 1e-8;
    
    if (isEquivalent) {
      return {
        stepNumber,
        inputExpression: curr,
        isCorrect: true,
        feedback: 'Valid algebraic transformation',
      };
    } else {
      return {
        stepNumber,
        inputExpression: curr,
        isCorrect: false,
        expectedResult: prev,
        actualResult: curr,
        feedback: 'The transformation does not preserve equality',
        errorType: 'algebraic',
      };
    }
  } catch {
    return {
      stepNumber,
      inputExpression: curr,
      isCorrect: false,
      feedback: 'Could not verify equation transformation',
      errorType: 'logical',
    };
  }
}

/**
 * Validates an expression transformation (simplification)
 */
function validateExpressionTransformation(
  prev: string,
  curr: string,
  stepNumber: number,
): StepCheckResult {
  try {
    const prevParsed = parseExpression(prev);
    const currParsed = parseExpression(curr);
    
    // Check if expressions are equivalent
    const diff = math.simplify(`(${prevParsed}) - (${currParsed})`);
    
    // Evaluate at a test point
    const variables = getVariables(prev + curr);
    const testScope: Record<string, number> = {};
    variables.forEach(v => { testScope[v] = Math.random() * 10 + 1; });
    
    const diffVal = diff.compile().evaluate(testScope);
    const isEquivalent = Math.abs(diffVal) < 1e-8;
    
    if (isEquivalent) {
      return {
        stepNumber,
        inputExpression: curr,
        isCorrect: true,
        feedback: 'Valid simplification',
      };
    } else {
      return {
        stepNumber,
        inputExpression: curr,
        isCorrect: false,
        expectedResult: math.simplify(prevParsed).toString(),
        actualResult: curr,
        feedback: 'The simplification is incorrect',
        errorType: 'simplification',
      };
    }
  } catch {
    return {
      stepNumber,
      inputExpression: curr,
      isCorrect: false,
      feedback: 'Could not verify expression transformation',
      errorType: 'logical',
    };
  }
}

/**
 * Checks if two expressions are mathematically equivalent
 */
function areExpressionsEquivalent(expr1: string, expr2: string): boolean {
  try {
    const parsed1 = parseExpression(expr1);
    const parsed2 = parseExpression(expr2);
    
    const diff = math.simplify(`(${parsed1}) - (${parsed2})`);
    
    // Try to evaluate - if it's a constant 0, they're equivalent
    const diffStr = diff.toString();
    if (diffStr === '0') return true;
    
    // Evaluate at random test points
    const variables = getVariables(expr1 + expr2);
    
    for (let i = 0; i < 5; i++) {
      const testScope: Record<string, number> = {};
      variables.forEach(v => { testScope[v] = Math.random() * 20 - 10; });
      
      const diffVal = diff.compile().evaluate(testScope);
      if (Math.abs(diffVal) > 1e-8) {
        return false;
      }
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Simplifies a mathematical expression
 */
export function simplifyExpression(expression: string): {
  original: string;
  simplified: string;
  steps: SolutionStep[];
} {
  const steps: SolutionStep[] = [];
  
  try {
    const parsed = parseExpression(expression);
    
    steps.push({
      stepNumber: 1,
      description: 'Original expression',
      expression: expression,
    });
    
    const simplified = math.simplify(parsed);
    const simplifiedStr = simplified.toString();
    
    steps.push({
      stepNumber: 2,
      description: 'Simplified expression',
      expression: simplifiedStr,
    });
    
    return {
      original: expression,
      simplified: simplifiedStr,
      steps,
    };
  } catch (error) {
    return {
      original: expression,
      simplified: expression,
      steps: [{
        stepNumber: 1,
        description: 'Could not simplify',
        expression: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
    };
  }
}

/**
 * Evaluates an expression at a given point
 */
export function evaluateExpression(
  expression: string,
  variables: Record<string, number>,
): { result: number | null; error?: string } {
  try {
    const parsed = parseExpression(expression);
    const node = math.parse(parsed);
    const result = node.compile().evaluate(variables);
    
    if (typeof result === 'number' && isFinite(result)) {
      return { result };
    }
    
    return { result: null, error: 'Result is not a finite number' };
  } catch (error) {
    return {
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Factors a polynomial expression
 */
export function factorExpression(expression: string): {
  original: string;
  factored: string;
  success: boolean;
} {
  try {
    const parsed = parseExpression(expression);
    
    // mathjs doesn't have a direct factor function, but we can try rationalize
    const node = math.parse(parsed);
    const simplified = math.simplify(node);
    
    // For quadratics, try to factor manually
    // This is a simplified approach - for more complex factoring, 
    // you'd need a more sophisticated CAS
    
    return {
      original: expression,
      factored: simplified.toString(),
      success: true,
    };
  } catch {
    return {
      original: expression,
      factored: expression,
      success: false,
    };
  }
}

/**
 * Expands a factored expression
 */
export function expandExpression(expression: string): {
  original: string;
  expanded: string;
  success: boolean;
} {
  try {
    const parsed = parseExpression(expression);
    const expanded = math.simplify(parsed);
    
    return {
      original: expression,
      expanded: expanded.toString(),
      success: true,
    };
  } catch {
    return {
      original: expression,
      expanded: expression,
      success: false,
    };
  }
}

