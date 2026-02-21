import type { OpenAI } from 'openai';

export type HybridRouteSource = 'local' | 'cloud';

export type HybridFallbackReason =
  | 'gateway_unavailable'
  | 'no_tools_available'
  | 'no_user_message'
  | 'no_function_calls'
  | 'unknown_tool'
  | 'invalid_arguments'
  | 'low_confidence'
  | 'multi_intent_incomplete'
  | 'local_error'
  | 'cloud_repair_unavailable';

export interface HybridRoutingDecision {
  routeSource: HybridRouteSource;
  fallbackReason?: HybridFallbackReason;
  localConfidence?: number;
  localLatencyInMs?: number;
  localCallCount?: number;
  cloudCallCount?: number;
  expectedActionCount?: number;
  usedRepairPass?: boolean;
  usedMultiIntentRepair?: boolean;
  usedCloudMultiIntentRepair?: boolean;
}

export interface HybridToolDefinition {
  name: string;
  requiredArguments: string[];
  properties?: Record<string, OpenAI.FunctionParameters>;
}

export interface LocalFunctionCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface LocalInferenceResult {
  functionCalls: LocalFunctionCall[];
  confidence: number;
  totalTimeInMs: number;
  rawText?: string;
}
