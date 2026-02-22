export interface OfflineTutorStep {
  stepNumber: number;
  explanation: string;
}

export interface OfflineTutorSolution {
  resultText: string;
  solutionSteps: OfflineTutorStep[];
}

type MathOperatorToken = '+' | '-' | '*' | '/';
type MathToken = number | MathOperatorToken | '(' | ')';

const MAX_DECIMAL_PLACES = 6;
const SOLUTION_STEP_ONE = 1;
const SOLUTION_STEP_TWO = 2;
const SOLUTION_STEP_THREE = 3;

const MATH_ALLOWED_CHARACTERS_PATTERN = /^[0-9+\-*/().\s]+$/;
const MATH_OPERATOR_PATTERN = /[+\-*/]/;
const MATH_DIGIT_PATTERN = /\d/;
const MATH_EXPRESSION_MAX_LENGTH = 120;
const NUMBER_TRAILING_ZEROES_PATTERN = /\.?0+$/;
const DECIMAL_NUMBER_PATTERN = /\d+\.\d+/;
const FRACTION_EXPRESSION_PATTERN = /(-?\d+)\s*\/\s*(-?\d+)\s*([+\-*/])\s*(-?\d+)\s*\/\s*(-?\d+)/;
const BASIC_ALGEBRA_EQUATION_PATTERN =
  /([xX]|-?\d+(?:\.\d+)?)\s*([+\-*/])\s*([xX]|-?\d+(?:\.\d+)?)\s*=\s*(-?\d+(?:\.\d+)?)/;

function isMathOperatorToken(token: MathToken): token is MathOperatorToken {
  return token === '+' || token === '-' || token === '*' || token === '/';
}

function isUnarySignPosition(previousToken?: MathToken): boolean {
  if (previousToken == null) {
    return true;
  }
  if (previousToken === '(') {
    return true;
  }
  return isMathOperatorToken(previousToken);
}

function tokenizeMathExpression(expression: string): MathToken[] | undefined {
  const tokens: MathToken[] = [];
  let index = 0;

  while (index < expression.length) {
    const char = expression[index];
    if (char == null) {
      return undefined;
    }

    if (char === ' ') {
      index++;
      continue;
    }

    const previousToken = tokens.length > 0 ? tokens[tokens.length - 1] : undefined;
    const isUnaryMinus = char === '-' && isUnarySignPosition(previousToken);

    if (isUnaryMinus || /[0-9.]/.test(char)) {
      const startIndex = index;
      index++;
      while (index < expression.length) {
        const nextChar = expression[index];
        if (nextChar == null || !/[0-9.]/.test(nextChar)) {
          break;
        }
        index++;
      }

      const numberText = expression.slice(startIndex, index);
      const numberValue = Number(numberText);
      if (!Number.isFinite(numberValue)) {
        return undefined;
      }
      tokens.push(numberValue);
      continue;
    }

    if (char === '+' || char === '-' || char === '*' || char === '/' || char === '(' || char === ')') {
      tokens.push(char);
      index++;
      continue;
    }

    return undefined;
  }

  return tokens.length > 0 ? tokens : undefined;
}

function readOperatorPrecedence(operator: MathOperatorToken): number {
  if (operator === '*' || operator === '/') {
    return 2;
  }
  return 1;
}

function applyMathOperation(values: number[], operator: MathOperatorToken): boolean {
  const rightValue = values.pop();
  const leftValue = values.pop();
  if (leftValue == null || rightValue == null) {
    return false;
  }

  let result = 0;
  switch (operator) {
    case '+':
      result = leftValue + rightValue;
      break;
    case '-':
      result = leftValue - rightValue;
      break;
    case '*':
      result = leftValue * rightValue;
      break;
    case '/':
      if (rightValue === 0) {
        return false;
      }
      result = leftValue / rightValue;
      break;
  }

  if (!Number.isFinite(result)) {
    return false;
  }

  values.push(result);
  return true;
}

function evaluateMathExpression(expression: string): number | undefined {
  const tokens = tokenizeMathExpression(expression);
  if (!tokens) {
    return undefined;
  }

  const values: number[] = [];
  const operators: Array<MathOperatorToken | '('> = [];

  for (const token of tokens) {
    if (typeof token === 'number') {
      values.push(token);
      continue;
    }

    if (token === '(') {
      operators.push(token);
      continue;
    }

    if (token === ')') {
      while (operators.length > 0 && operators[operators.length - 1] !== '(') {
        const operator = operators.pop();
        if (operator == null || operator === '(' || !applyMathOperation(values, operator)) {
          return undefined;
        }
      }

      if (operators[operators.length - 1] !== '(') {
        return undefined;
      }
      operators.pop();
      continue;
    }

    while (operators.length > 0) {
      const activeOperator = operators[operators.length - 1];
      if (activeOperator == null || activeOperator === '(') {
        break;
      }
      if (readOperatorPrecedence(activeOperator) < readOperatorPrecedence(token)) {
        break;
      }

      operators.pop();
      if (!applyMathOperation(values, activeOperator)) {
        return undefined;
      }
    }

    operators.push(token);
  }

  while (operators.length > 0) {
    const operator = operators.pop();
    if (operator == null || operator === '(') {
      return undefined;
    }
    if (!applyMathOperation(values, operator)) {
      return undefined;
    }
  }

  if (values.length !== 1) {
    return undefined;
  }

  const finalValue = values[0];
  return Number.isFinite(finalValue) ? finalValue : undefined;
}

function isMathExpressionCandidate(value: string): boolean {
  if (value.length === 0 || value.length > MATH_EXPRESSION_MAX_LENGTH) {
    return false;
  }
  if (!MATH_ALLOWED_CHARACTERS_PATTERN.test(value)) {
    return false;
  }
  if (!MATH_DIGIT_PATTERN.test(value) || !MATH_OPERATOR_PATTERN.test(value)) {
    return false;
  }
  return true;
}

function extractMathExpressionFromText(userText: string): string | undefined {
  const trimmedText = userText.trim().replace(/\?+$/, '').trim();
  if (isMathExpressionCandidate(trimmedText)) {
    return trimmedText;
  }

  const strippedText = trimmedText
    .replace(/[^0-9+\-*/().\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (isMathExpressionCandidate(strippedText)) {
    return strippedText;
  }

  return undefined;
}

function parseNumberText(value: string): number | undefined {
  const parsedNumber = Number(value);
  return Number.isFinite(parsedNumber) ? parsedNumber : undefined;
}

function formatMathResult(value: number): string {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(MAX_DECIMAL_PLACES).replace(NUMBER_TRAILING_ZEROES_PATTERN, '');
}

function readGreatestCommonDivisor(leftNumber: number, rightNumber: number): number {
  let leftAbs = Math.abs(leftNumber);
  let rightAbs = Math.abs(rightNumber);

  while (rightAbs !== 0) {
    const remainder = leftAbs % rightAbs;
    leftAbs = rightAbs;
    rightAbs = remainder;
  }

  return leftAbs;
}

function simplifyFraction(
  numerator: number,
  denominator: number,
): { numerator: number; denominator: number } | undefined {
  if (denominator === 0) {
    return undefined;
  }

  const normalizedNumerator = denominator < 0 ? -numerator : numerator;
  const normalizedDenominator = Math.abs(denominator);
  const divisor = readGreatestCommonDivisor(normalizedNumerator, normalizedDenominator);
  const safeDivisor = divisor === 0 ? 1 : divisor;

  return {
    numerator: normalizedNumerator / safeDivisor,
    denominator: normalizedDenominator / safeDivisor,
  };
}

function formatFractionResult(numerator: number, denominator: number): string {
  if (denominator === 1) {
    return numerator.toString();
  }
  return `${numerator}/${denominator}`;
}

function buildOfflineArithmeticSteps(expression: string, resultText: string): OfflineTutorStep[] {
  return [
    {
      stepNumber: SOLUTION_STEP_ONE,
      explanation: `Read the expression: ${expression}`,
    },
    {
      stepNumber: SOLUTION_STEP_TWO,
      explanation: 'Apply order of operations (parentheses, then multiply/divide, then add/subtract).',
    },
    {
      stepNumber: SOLUTION_STEP_THREE,
      explanation: `Final answer: ${resultText}`,
    },
  ];
}

function buildOfflineDecimalSteps(expression: string, resultText: string): OfflineTutorStep[] {
  return [
    {
      stepNumber: SOLUTION_STEP_ONE,
      explanation: `Read the decimal expression: ${expression}`,
    },
    {
      stepNumber: SOLUTION_STEP_TWO,
      explanation: 'Use order of operations and keep decimal places aligned during each operation.',
    },
    {
      stepNumber: SOLUTION_STEP_THREE,
      explanation: `Final decimal answer: ${resultText}`,
    },
  ];
}

function buildOfflineFractionSteps(expression: string, resultText: string): OfflineTutorStep[] {
  return [
    {
      stepNumber: SOLUTION_STEP_ONE,
      explanation: `Read the fraction expression: ${expression}`,
    },
    {
      stepNumber: SOLUTION_STEP_TWO,
      explanation: 'Apply the fraction rule for the operation, then simplify numerator and denominator by their GCD.',
    },
    {
      stepNumber: SOLUTION_STEP_THREE,
      explanation: `Simplified result: ${resultText}`,
    },
  ];
}

function buildOfflineAlgebraSteps(equationText: string, resultText: string): OfflineTutorStep[] {
  return [
    {
      stepNumber: SOLUTION_STEP_ONE,
      explanation: `Read the equation: ${equationText}`,
    },
    {
      stepNumber: SOLUTION_STEP_TWO,
      explanation: 'Isolate x by applying inverse operations to keep both sides balanced.',
    },
    {
      stepNumber: SOLUTION_STEP_THREE,
      explanation: `Solution: ${resultText}`,
    },
  ];
}

function buildOfflineFractionSolution(userText: string): OfflineTutorSolution | undefined {
  const fractionMatch = userText.match(FRACTION_EXPRESSION_PATTERN);
  if (fractionMatch == null) {
    return undefined;
  }

  const leftNumerator = parseNumberText(fractionMatch[1]);
  const leftDenominator = parseNumberText(fractionMatch[2]);
  const operator = fractionMatch[3] as MathOperatorToken;
  const rightNumerator = parseNumberText(fractionMatch[4]);
  const rightDenominator = parseNumberText(fractionMatch[5]);

  if (leftNumerator == null || leftDenominator == null || rightNumerator == null || rightDenominator == null) {
    return undefined;
  }
  if (leftDenominator === 0 || rightDenominator === 0) {
    return undefined;
  }

  let resultNumerator = 0;
  let resultDenominator = 1;

  switch (operator) {
    case '+':
      resultNumerator = leftNumerator * rightDenominator + rightNumerator * leftDenominator;
      resultDenominator = leftDenominator * rightDenominator;
      break;
    case '-':
      resultNumerator = leftNumerator * rightDenominator - rightNumerator * leftDenominator;
      resultDenominator = leftDenominator * rightDenominator;
      break;
    case '*':
      resultNumerator = leftNumerator * rightNumerator;
      resultDenominator = leftDenominator * rightDenominator;
      break;
    case '/':
      if (rightNumerator === 0) {
        return undefined;
      }
      resultNumerator = leftNumerator * rightDenominator;
      resultDenominator = leftDenominator * rightNumerator;
      break;
  }

  const simplifiedFraction = simplifyFraction(resultNumerator, resultDenominator);
  if (simplifiedFraction == null) {
    return undefined;
  }

  const expression = fractionMatch[0].replace(/\s+/g, ' ').trim();
  const resultText = formatFractionResult(simplifiedFraction.numerator, simplifiedFraction.denominator);
  return {
    resultText,
    solutionSteps: buildOfflineFractionSteps(expression, resultText),
  };
}

function buildOfflineDecimalSolution(userText: string): OfflineTutorSolution | undefined {
  const mathExpression = extractMathExpressionFromText(userText);
  if (mathExpression == null || !DECIMAL_NUMBER_PATTERN.test(mathExpression)) {
    return undefined;
  }

  const resultValue = evaluateMathExpression(mathExpression);
  if (resultValue == null) {
    return undefined;
  }

  const resultText = formatMathResult(resultValue);
  return {
    resultText,
    solutionSteps: buildOfflineDecimalSteps(mathExpression, resultText),
  };
}

function buildOfflineAlgebraSolution(userText: string): OfflineTutorSolution | undefined {
  const algebraMatch = userText.match(BASIC_ALGEBRA_EQUATION_PATTERN);
  if (algebraMatch == null) {
    return undefined;
  }

  const leftOperandText = algebraMatch[1];
  const operator = algebraMatch[2] as MathOperatorToken;
  const rightOperandText = algebraMatch[3];
  const equationResultValue = parseNumberText(algebraMatch[4]);

  if (equationResultValue == null) {
    return undefined;
  }

  const isLeftOperandVariable = /^x$/i.test(leftOperandText);
  const isRightOperandVariable = /^x$/i.test(rightOperandText);
  if (isLeftOperandVariable === isRightOperandVariable) {
    return undefined;
  }

  const knownOperandText = isLeftOperandVariable ? rightOperandText : leftOperandText;
  const knownOperandValue = parseNumberText(knownOperandText);
  if (knownOperandValue == null) {
    return undefined;
  }

  let solvedXValue: number | undefined;
  if (isLeftOperandVariable) {
    switch (operator) {
      case '+':
        solvedXValue = equationResultValue - knownOperandValue;
        break;
      case '-':
        solvedXValue = equationResultValue + knownOperandValue;
        break;
      case '*':
        if (knownOperandValue === 0) {
          return undefined;
        }
        solvedXValue = equationResultValue / knownOperandValue;
        break;
      case '/':
        if (knownOperandValue === 0) {
          return undefined;
        }
        solvedXValue = equationResultValue * knownOperandValue;
        break;
    }
  } else {
    switch (operator) {
      case '+':
        solvedXValue = equationResultValue - knownOperandValue;
        break;
      case '-':
        solvedXValue = knownOperandValue - equationResultValue;
        break;
      case '*':
        if (knownOperandValue === 0) {
          return undefined;
        }
        solvedXValue = equationResultValue / knownOperandValue;
        break;
      case '/':
        if (equationResultValue === 0) {
          return undefined;
        }
        solvedXValue = knownOperandValue / equationResultValue;
        break;
    }
  }

  if (solvedXValue == null || !Number.isFinite(solvedXValue)) {
    return undefined;
  }

  const solvedResultText = `x = ${formatMathResult(solvedXValue)}`;
  const equationText = `${leftOperandText} ${operator} ${rightOperandText} = ${formatMathResult(equationResultValue)}`;

  return {
    resultText: solvedResultText,
    solutionSteps: buildOfflineAlgebraSteps(equationText, solvedResultText),
  };
}

function buildOfflineArithmeticSolution(userText: string): OfflineTutorSolution | undefined {
  const mathExpression = extractMathExpressionFromText(userText);
  if (mathExpression == null) {
    return undefined;
  }

  const resultValue = evaluateMathExpression(mathExpression);
  if (resultValue == null) {
    return undefined;
  }

  const resultText = formatMathResult(resultValue);
  return {
    resultText,
    solutionSteps: buildOfflineArithmeticSteps(mathExpression, resultText),
  };
}

export function buildOfflineTutorSolutionFromText(userText: string): OfflineTutorSolution | undefined {
  const fractionSolution = buildOfflineFractionSolution(userText);
  if (fractionSolution != null) {
    return fractionSolution;
  }

  const decimalSolution = buildOfflineDecimalSolution(userText);
  if (decimalSolution != null) {
    return decimalSolution;
  }

  const algebraSolution = buildOfflineAlgebraSolution(userText);
  if (algebraSolution != null) {
    return algebraSolution;
  }

  return buildOfflineArithmeticSolution(userText);
}

export function canBuildOfflineTutorSolutionFromText(userText: string): boolean {
  return buildOfflineTutorSolutionFromText(userText) != null;
}
