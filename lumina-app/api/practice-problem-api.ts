/**
 * AI-powered practice problem generation using Google Gemini
 * Generates math problems with detailed solutions and hints based on user's needs
 */

import { type MathTopic } from '@shared/generated-db-types';

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = 'gemini-2.0-flash';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_IN_MS = 2000;
const MAX_RETRY_DELAY_IN_MS = 10000;

export interface GeneratedProblem {
  problem: string;
  solution: string;
  hint: string;
  steps: string[];
  difficulty: number;
  topic: MathTopic;
}

export interface ProblemGenerationError {
  message: string;
  code: string;
}

interface MistakeContext {
  topic: MathTopic;
  category: string;
  description?: string;
  occurrenceCount: number;
}

function getGeminiApiKey(): string | undefined {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('EXPO_PUBLIC_GEMINI_API_KEY is not set');
  }
  return apiKey;
}

function sleep(delayInMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayInMs));
}

function extractRetryDelay(errorMessage: string): number | undefined {
  const match = errorMessage.match(/retry in (\d+(?:\.\d+)?)\s*s/i);
  if (match?.[1] != null) {
    const seconds = parseFloat(match[1]);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.min(seconds * 1000, MAX_RETRY_DELAY_IN_MS);
    }
  }
  return undefined;
}

const TOPIC_DESCRIPTIONS: Record<MathTopic, string> = {
  FRACTIONS: 'fractions - adding, subtracting, multiplying, dividing, simplifying, comparing fractions',
  DECIMALS: 'decimals - operations with decimals, rounding, converting between decimals and fractions',
  PERCENTAGES: 'percentages - calculating percentages, percentage increase/decrease, percentage of a number',
  BASIC_ALGEBRA: 'basic algebra - solving linear equations, simplifying expressions, variables',
  WORD_PROBLEMS: 'word problems - translating real-world scenarios into mathematical equations',
};

const DIFFICULTY_DESCRIPTIONS: Record<number, string> = {
  1: 'very easy, suitable for beginners or those just learning the concept',
  2: 'easy, requires basic understanding of the concept',
  3: 'medium difficulty, requires solid understanding and some problem-solving skills',
  4: 'challenging, requires deeper understanding and multi-step reasoning',
  5: 'advanced, requires mastery of the concept and creative problem-solving',
};

function buildPrompt(
  topic: MathTopic,
  difficulty: number,
  mistakeContext?: MistakeContext,
  interestContext?: string,
): string {
  const topicDescription = TOPIC_DESCRIPTIONS[topic] ?? topic;
  const difficultyDescription = DIFFICULTY_DESCRIPTIONS[difficulty] ?? 'medium difficulty';

  let contextSection = '';
  if (mistakeContext != null) {
    contextSection = `
IMPORTANT CONTEXT: The student has made mistakes in this area before.
- Mistake category: ${mistakeContext.category}
- Times this mistake occurred: ${mistakeContext.occurrenceCount}
${mistakeContext.description != null ? `- Description: ${mistakeContext.description}` : ''}

Create a problem that specifically helps address this type of mistake. The problem should gently reinforce the correct approach without being too similar to what they got wrong.
`;
  } else if (interestContext != null) {
    contextSection = `
CONTEXT: The student is interested in practicing ${interestContext}. Create an engaging problem that builds their skills in this area.
`;
  }

  return `You are a math tutor creating practice problems for students. Generate ONE practice problem following these requirements:

TOPIC: ${topicDescription}
DIFFICULTY: ${difficultyDescription}
${contextSection}

REQUIREMENTS:
1. The problem should be clear and unambiguous
2. Use LaTeX notation for mathematical expressions (wrap in \\( \\) for inline or \\[ \\] for block)
3. The solution should be a single, clear answer (not a full explanation)
4. The hint should give a helpful nudge without giving away the answer
5. The steps should break down the complete solution process (3-6 steps)
6. Each step should be educational and explain the reasoning

RESPOND WITH ONLY A VALID JSON OBJECT in this exact format (no markdown, no code blocks):
{
  "problem": "The problem statement with LaTeX math notation",
  "solution": "The final answer (concise)",
  "hint": "A helpful hint that guides without revealing the answer",
  "steps": [
    "Step 1: Description of what to do first",
    "Step 2: Next step with explanation",
    "Step 3: Continue solving...",
    "Step 4: Final step to reach the answer"
  ],
  "difficulty": ${difficulty}
}`;
}

export async function generatePracticeProblem(
  topic: MathTopic,
  difficulty: number = 2,
  mistakeContext?: MistakeContext,
  interestContext?: string,
): Promise<GeneratedProblem> {
  const apiKey = getGeminiApiKey();
  if (apiKey == null) {
    throw {
      message: 'Gemini API key is not configured',
      code: 'API_KEY_MISSING',
    } as ProblemGenerationError;
  }

  const prompt = buildPrompt(topic, difficulty, mistakeContext, interestContext);
  let lastError: ProblemGenerationError | undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const url = `${GEMINI_API_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message ?? `Gemini API error: ${response.status}`;
        console.error('Gemini API error:', response.status, errorData);

        if (response.status === 429) {
          const retryDelay = extractRetryDelay(errorMessage) ?? INITIAL_RETRY_DELAY_IN_MS * Math.pow(2, attempt);
          console.log(`Rate limited. Retrying in ${retryDelay}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`);
          await sleep(retryDelay);
          lastError = {
            message: errorMessage,
            code: 'RATE_LIMITED',
          };
          continue;
        }

        throw {
          message: errorMessage,
          code: 'GEMINI_API_ERROR',
        } as ProblemGenerationError;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text == null) {
        const finishReason = data.candidates?.[0]?.finishReason;
        if (finishReason === 'SAFETY') {
          throw {
            message: 'Content was blocked by safety filters.',
            code: 'SAFETY_BLOCKED',
          } as ProblemGenerationError;
        }
        throw {
          message: 'No response returned from Gemini.',
          code: 'EMPTY_RESPONSE',
        } as ProblemGenerationError;
      }

      // Parse the JSON response
      let parsed: {
        problem: string;
        solution: string;
        hint: string;
        steps: string[];
        difficulty: number;
      };

      try {
        // Clean up the response - remove any markdown code blocks if present
        let cleanText = text.trim();
        if (cleanText.startsWith('```json')) {
          cleanText = cleanText.slice(7);
        }
        if (cleanText.startsWith('```')) {
          cleanText = cleanText.slice(3);
        }
        if (cleanText.endsWith('```')) {
          cleanText = cleanText.slice(0, -3);
        }
        parsed = JSON.parse(cleanText.trim());
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', text);
        throw {
          message: 'Failed to parse problem from AI response',
          code: 'PARSE_ERROR',
        } as ProblemGenerationError;
      }

      // Validate the response structure
      if (
        typeof parsed.problem !== 'string' ||
        typeof parsed.solution !== 'string' ||
        typeof parsed.hint !== 'string' ||
        !Array.isArray(parsed.steps)
      ) {
        throw {
          message: 'Invalid problem structure from AI',
          code: 'INVALID_STRUCTURE',
        } as ProblemGenerationError;
      }

      return {
        problem: parsed.problem,
        solution: parsed.solution,
        hint: parsed.hint,
        steps: parsed.steps,
        difficulty: parsed.difficulty ?? difficulty,
        topic,
      };
    } catch (error) {
      console.error('Problem generation error:', error);

      if (error != null && typeof error === 'object' && 'code' in error) {
        const typedError = error as ProblemGenerationError;
        if (typedError.code !== 'RATE_LIMITED') {
          throw error;
        }
        lastError = typedError;
      } else {
        throw {
          message: 'Failed to generate practice problem. Please try again.',
          code: 'GENERATION_ERROR',
        } as ProblemGenerationError;
      }
    }
  }

  throw lastError ?? {
    message: 'Failed to generate problem after multiple attempts. Please try again later.',
    code: 'RATE_LIMITED',
  } as ProblemGenerationError;
}

/**
 * Generate multiple practice problems in batch
 */
export async function generatePracticeProblems(
  topics: MathTopic[],
  count: number = 3,
  difficulty: number = 2,
  mistakeContexts?: MistakeContext[],
): Promise<GeneratedProblem[]> {
  const problems: GeneratedProblem[] = [];

  // If we have mistake contexts, prioritize those topics
  if (mistakeContexts != null && mistakeContexts.length > 0) {
    for (const context of mistakeContexts.slice(0, count)) {
      try {
        const problem = await generatePracticeProblem(context.topic, difficulty, context);
        problems.push(problem);
      } catch (error) {
        console.error('Failed to generate mistake-based problem:', error);
      }
    }
  }

  // Fill remaining slots with interest-based problems
  const remainingCount = count - problems.length;
  for (let i = 0; i < remainingCount && topics.length > 0; i++) {
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    try {
      const problem = await generatePracticeProblem(randomTopic, difficulty, undefined, TOPIC_DESCRIPTIONS[randomTopic]);
      problems.push(problem);
    } catch (error) {
      console.error('Failed to generate interest-based problem:', error);
    }
  }

  return problems;
}

