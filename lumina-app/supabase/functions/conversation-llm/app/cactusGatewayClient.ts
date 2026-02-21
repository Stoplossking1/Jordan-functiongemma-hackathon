import type { OpenAI } from 'openai';

import type { LocalFunctionCall, LocalInferenceResult } from './hybridRoutingTypes.ts';

const DEFAULT_CACTUS_GATEWAY_TIMEOUT_IN_MS = 15_000;
const MIN_CONFIDENCE = 0;
const MAX_CONFIDENCE = 1;
const MIN_TOTAL_TIME_IN_MS = 0;

interface GatewayMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface CactusGatewayRequest {
  messages: GatewayMessage[];
  tools: OpenAI.ChatCompletionTool[];
  systemInstruction?: string;
  temperature?: number;
  forceTools?: boolean;
  maxTokens?: number;
}

function toRecord(value: unknown): Record<string, unknown> | undefined {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return undefined;
}

function parseJsonRecord(value: string): Record<string, unknown> | undefined {
  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) {
    return undefined;
  }

  try {
    const parsedValue: unknown = JSON.parse(trimmedValue);
    return toRecord(parsedValue);
  } catch (_error) {
    return undefined;
  }
}

function readArgumentsRecord(value: unknown): Record<string, unknown> | undefined {
  const objectRecord = toRecord(value);
  if (objectRecord) {
    return objectRecord;
  }

  if (typeof value === 'string') {
    return parseJsonRecord(value);
  }

  return undefined;
}

function readNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function readFunctionCalls(value: unknown): LocalFunctionCall[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const functionCalls: LocalFunctionCall[] = [];
  for (const item of value) {
    const itemRecord = toRecord(item);
    if (!itemRecord) {
      continue;
    }

    const functionName = readNonEmptyString(itemRecord.name);
    const argumentsRecord = readArgumentsRecord(itemRecord.arguments);

    if (!functionName || !argumentsRecord) {
      continue;
    }

    functionCalls.push({
      name: functionName,
      arguments: argumentsRecord,
    });
  }

  return functionCalls;
}

function readNumber(value: unknown, fallbackValue: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  return fallbackValue;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function readConfidence(value: unknown): number {
  const confidence = readNumber(value, MIN_CONFIDENCE);
  if (confidence < MIN_CONFIDENCE || confidence > MAX_CONFIDENCE) {
    return MIN_CONFIDENCE;
  }

  return confidence;
}

function readTotalTimeInMs(value: unknown): number {
  const totalTimeInMs = readNumber(value, MIN_TOTAL_TIME_IN_MS);
  return totalTimeInMs >= MIN_TOTAL_TIME_IN_MS ? totalTimeInMs : MIN_TOTAL_TIME_IN_MS;
}

function parseGatewayResponse(value: unknown): LocalInferenceResult {
  const responseRecord = toRecord(value);
  if (!responseRecord) {
    return {
      functionCalls: [],
      confidence: MIN_CONFIDENCE,
      totalTimeInMs: MIN_TOTAL_TIME_IN_MS,
    };
  }

  return {
    functionCalls: readFunctionCalls(responseRecord.functionCalls ?? responseRecord.function_calls),
    confidence: readConfidence(responseRecord.confidence),
    totalTimeInMs: readTotalTimeInMs(responseRecord.totalTimeInMs ?? responseRecord.total_time_ms),
    rawText: readString(responseRecord.rawText ?? responseRecord.raw_text),
  };
}

export class CactusGatewayClient {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutInMs = DEFAULT_CACTUS_GATEWAY_TIMEOUT_IN_MS,
  ) {}

  async infer(request: CactusGatewayRequest): Promise<LocalInferenceResult> {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), this.timeoutInMs);

    try {
      let response: Response;
      try {
        response = await fetch(`${this.baseUrl}/infer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
          signal: abortController.signal,
        });
      } catch (error) {
        if (abortController.signal.aborted) {
          throw new Error(`Cactus gateway timeout after ${this.timeoutInMs}ms`);
        }
        throw error;
      }

      if (!response.ok) {
        throw new Error(`Cactus gateway request failed with status ${response.status}`);
      }

      const responseJson = await response.json();
      return parseGatewayResponse(responseJson);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async checkHealth(): Promise<boolean> {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), this.timeoutInMs);

    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: abortController.signal,
      });
      return response.ok;
    } catch (_error) {
      return false;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
