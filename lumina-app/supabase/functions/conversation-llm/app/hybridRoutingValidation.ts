import type { OpenAI } from 'openai';

import type { HybridFallbackReason, HybridToolDefinition, LocalFunctionCall } from './hybridRoutingTypes.ts';

const MULTI_INTENT_SEPARATORS = [' and then ', ' then ', ' and also ', ', and ', ' also '];

interface LocalValidationResult {
  isAccepted: boolean;
  fallbackReason?: HybridFallbackReason;
}

function readTextPart(contentPart: OpenAI.ChatCompletionContentPart): string {
  if (contentPart.type === 'text') {
    return contentPart.text;
  }

  return '';
}

export function extractLatestUserText(messages: OpenAI.ChatCompletionMessageParam[]): string {
  const reversedMessages = [...messages].reverse();
  for (const message of reversedMessages) {
    if (message.role !== 'user') {
      continue;
    }

    if (typeof message.content === 'string') {
      return message.content;
    }

    if (Array.isArray(message.content)) {
      const textContent = message.content.map(readTextPart).filter((value) => value.length > 0).join(' ').trim();
      if (textContent.length > 0) {
        return textContent;
      }
    }
  }

  return '';
}

export function estimateExpectedActionCount(messages: OpenAI.ChatCompletionMessageParam[]): number {
  const latestUserText = extractLatestUserText(messages).toLowerCase();
  if (!latestUserText) {
    return 1;
  }

  for (const separator of MULTI_INTENT_SEPARATORS) {
    if (latestUserText.includes(separator)) {
      return 2;
    }
  }

  return 1;
}

export function isMultiIntentRequest(messages: OpenAI.ChatCompletionMessageParam[]): boolean {
  return estimateExpectedActionCount(messages) > 1;
}

function toSchemaRecord(value: OpenAI.FunctionParameters | undefined): Record<string, unknown> {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function readSchemaType(value: OpenAI.FunctionParameters | undefined): string | undefined {
  const schemaRecord = toSchemaRecord(value);
  const typeValue = schemaRecord.type;
  return typeof typeValue === 'string' ? typeValue.toLowerCase() : undefined;
}

function readSchemaProperties(value: OpenAI.FunctionParameters | undefined): Record<string, OpenAI.FunctionParameters> {
  const schemaRecord = toSchemaRecord(value);
  const propertiesValue = schemaRecord.properties;
  if (propertiesValue != null && typeof propertiesValue === 'object' && !Array.isArray(propertiesValue)) {
    return propertiesValue as Record<string, OpenAI.FunctionParameters>;
  }

  return {};
}

function readSchemaRequired(value: OpenAI.FunctionParameters | undefined): string[] {
  const schemaRecord = toSchemaRecord(value);
  const requiredValue = schemaRecord.required;
  if (!Array.isArray(requiredValue)) {
    return [];
  }

  const requiredArguments: string[] = [];
  for (const item of requiredValue) {
    if (typeof item === 'string' && item.length > 0) {
      requiredArguments.push(item);
    }
  }

  return requiredArguments;
}

export function toHybridToolDefinitions(tools: OpenAI.ChatCompletionTool[] | undefined): HybridToolDefinition[] {
  if (!tools || tools.length === 0) {
    return [];
  }

  const definitions: HybridToolDefinition[] = [];
  for (const tool of tools) {
    if (tool.type !== 'function') {
      continue;
    }

    definitions.push({
      name: tool.function.name,
      requiredArguments: readSchemaRequired(tool.function.parameters),
      properties: readSchemaProperties(tool.function.parameters),
    });
  }

  return definitions;
}

function isArgumentTypeValid(value: unknown, schemaType: string | undefined): boolean {
  if (!schemaType) {
    return true;
  }

  switch (schemaType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'object':
      return value != null && typeof value === 'object' && !Array.isArray(value);
    case 'array':
      return Array.isArray(value);
    default:
      return true;
  }
}

function hasRequiredArguments(functionCall: LocalFunctionCall, definition: HybridToolDefinition): boolean {
  for (const requiredArgument of definition.requiredArguments) {
    if (!Object.prototype.hasOwnProperty.call(functionCall.arguments, requiredArgument)) {
      return false;
    }

    if (functionCall.arguments[requiredArgument] == null) {
      return false;
    }
  }

  return true;
}

function hasInvalidArgumentValue(value: unknown): boolean {
  if (value === undefined) {
    return true;
  }

  if (typeof value === 'number') {
    return !Number.isFinite(value);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      if (hasInvalidArgumentValue(item)) {
        return true;
      }
    }
    return false;
  }

  if (value == null) {
    return false;
  }

  if (typeof value === 'object') {
    for (const [argumentName, argumentValue] of Object.entries(value)) {
      if (argumentName.trim().length === 0) {
        return true;
      }
      if (hasInvalidArgumentValue(argumentValue)) {
        return true;
      }
    }
    return false;
  }

  return typeof value === 'function' || typeof value === 'symbol' || typeof value === 'bigint';
}

function hasMalformedArguments(functionCall: LocalFunctionCall): boolean {
  if (functionCall.arguments == null || typeof functionCall.arguments !== 'object' || Array.isArray(functionCall.arguments)) {
    return true;
  }

  for (const [argumentName, argumentValue] of Object.entries(functionCall.arguments)) {
    if (argumentName.trim().length === 0) {
      return true;
    }
    if (hasInvalidArgumentValue(argumentValue)) {
      return true;
    }
  }

  return false;
}

function hasInvalidArgumentTypes(functionCall: LocalFunctionCall, definition: HybridToolDefinition): boolean {
  if (!definition.properties) {
    return false;
  }

  for (const [argumentName, argumentValue] of Object.entries(functionCall.arguments)) {
    const argumentSchema = definition.properties[argumentName];
    if (!argumentSchema) {
      continue;
    }

    if (!isArgumentTypeValid(argumentValue, readSchemaType(argumentSchema))) {
      return true;
    }
  }

  return false;
}

export function hasObviousInvalidTimeValues(argumentsMap: Record<string, unknown>): boolean {
  const minutesValue = argumentsMap.minutes;
  if (typeof minutesValue === 'number' && Number.isInteger(minutesValue) && minutesValue < 0) {
    return true;
  }

  const hourValue = argumentsMap.hour;
  if (typeof hourValue === 'number' && Number.isInteger(hourValue) && (hourValue < 0 || hourValue > 23)) {
    return true;
  }

  const minuteValue = argumentsMap.minute;
  if (typeof minuteValue === 'number' && Number.isInteger(minuteValue) && (minuteValue < 0 || minuteValue > 59)) {
    return true;
  }

  return false;
}

export function validateLocalFunctionCalls(
  functionCalls: LocalFunctionCall[],
  toolDefinitions: HybridToolDefinition[],
  confidence: number,
  confidenceThreshold: number,
  expectedActionCount: number,
): LocalValidationResult {
  if (functionCalls.length === 0) {
    return { isAccepted: false, fallbackReason: 'no_function_calls' };
  }

  if (confidence < confidenceThreshold) {
    return { isAccepted: false, fallbackReason: 'low_confidence' };
  }

  const toolsByName = new Map<string, HybridToolDefinition>();
  for (const definition of toolDefinitions) {
    toolsByName.set(definition.name, definition);
  }

  for (const functionCall of functionCalls) {
    if (functionCall.name.trim().length === 0) {
      return { isAccepted: false, fallbackReason: 'unknown_tool' };
    }

    if (hasMalformedArguments(functionCall)) {
      return { isAccepted: false, fallbackReason: 'invalid_arguments' };
    }

    const definition = toolsByName.get(functionCall.name);
    if (!definition) {
      return { isAccepted: false, fallbackReason: 'unknown_tool' };
    }

    if (!hasRequiredArguments(functionCall, definition)) {
      return { isAccepted: false, fallbackReason: 'invalid_arguments' };
    }

    if (hasInvalidArgumentTypes(functionCall, definition)) {
      return { isAccepted: false, fallbackReason: 'invalid_arguments' };
    }

    if (hasObviousInvalidTimeValues(functionCall.arguments)) {
      return { isAccepted: false, fallbackReason: 'invalid_arguments' };
    }
  }

  if (expectedActionCount > 1 && functionCalls.length < expectedActionCount) {
    return { isAccepted: false, fallbackReason: 'multi_intent_incomplete' };
  }

  return { isAccepted: true };
}
