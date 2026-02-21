import { ENV_VAR_CACTUS_GATEWAY_URL } from '../../_shared/env-var-names.ts';

const TRUE_FLAG_VALUES = new Set(['1', 'true', 'yes', 'on']);

const DEFAULT_LOCAL_CONFIDENCE_THRESHOLD = 0.99;
const DEFAULT_LOCAL_TEMPERATURE = 0;
const DEFAULT_CLOUD_TEMPERATURE = 0;
const DEFAULT_CACTUS_GATEWAY_URL = 'http://127.0.0.1:8788';

const ENV_ENABLE_LOCAL_CACTUS = 'LUMINA_ENABLE_LOCAL_CACTUS';
const ENV_ENABLE_REPAIR_PASS = 'LUMINA_ENABLE_REPAIR_PASS';
const ENV_ENABLE_MULTI_INTENT_REPAIR = 'LUMINA_ENABLE_MULTI_INTENT_REPAIR';
const ENV_ENABLE_CLOUD_MULTI_INTENT_REPAIR = 'LUMINA_ENABLE_CLOUD_MULTI_INTENT_REPAIR';
const ENV_LOCAL_CONFIDENCE_THRESHOLD = 'LUMINA_LOCAL_CONFIDENCE_THRESHOLD';
const ENV_LOCAL_TEMPERATURE = 'LUMINA_LOCAL_TEMPERATURE';
const ENV_CLOUD_TEMPERATURE = 'LUMINA_CLOUD_TEMPERATURE';

export const DEFAULT_SYSTEM_INSTRUCTION = 'You are a helpful assistant that can use tools.';
export const REPAIR_SYSTEM_INSTRUCTION =
  'You must respond using one or more tool calls from the provided tool list. Do not respond with plain text.';
export const MULTI_INTENT_REPAIR_SYSTEM_INSTRUCTION =
  'You must respond using tool calls only. If the user requests multiple actions, return multiple function calls in order, with one function call per action. Do not respond with plain text.';
export const CLOUD_MULTI_INTENT_REPAIR_SYSTEM_INSTRUCTION =
  'You must respond with function calls only. If the user requests multiple actions, output one function call per action in the same order. Do not omit requested actions and do not reply with plain text.';

export interface HybridRoutingPolicy {
  enableLocalCactus: boolean;
  enableRepairPass: boolean;
  enableMultiIntentRepair: boolean;
  enableCloudMultiIntentRepair: boolean;
  localConfidenceThreshold: number;
  localTemperature: number;
  cloudTemperature: number;
  cactusGatewayUrl: string;
}

function readBooleanEnv(name: string, defaultValue: boolean): boolean {
  const rawValue = Deno.env.get(name);
  if (rawValue == null) {
    return defaultValue;
  }
  return TRUE_FLAG_VALUES.has(rawValue.trim().toLowerCase());
}

function readNumberEnv(name: string, defaultValue: number): number {
  const rawValue = Deno.env.get(name);
  if (rawValue == null) {
    return defaultValue;
  }

  const parsedValue = Number(rawValue);
  if (Number.isFinite(parsedValue)) {
    return parsedValue;
  }

  return defaultValue;
}

function readStringEnv(name: string, defaultValue: string): string {
  const rawValue = Deno.env.get(name);
  if (rawValue == null) {
    return defaultValue;
  }

  const trimmedValue = rawValue.trim();
  return trimmedValue.length > 0 ? trimmedValue : defaultValue;
}

export function readHybridRoutingPolicy(): HybridRoutingPolicy {
  return {
    // Frozen winner defaults from the benchmark router.
    enableLocalCactus: readBooleanEnv(ENV_ENABLE_LOCAL_CACTUS, true),
    enableRepairPass: readBooleanEnv(ENV_ENABLE_REPAIR_PASS, true),
    enableMultiIntentRepair: readBooleanEnv(ENV_ENABLE_MULTI_INTENT_REPAIR, false),
    enableCloudMultiIntentRepair: readBooleanEnv(ENV_ENABLE_CLOUD_MULTI_INTENT_REPAIR, true),
    localConfidenceThreshold: readNumberEnv(ENV_LOCAL_CONFIDENCE_THRESHOLD, DEFAULT_LOCAL_CONFIDENCE_THRESHOLD),
    localTemperature: readNumberEnv(ENV_LOCAL_TEMPERATURE, DEFAULT_LOCAL_TEMPERATURE),
    cloudTemperature: readNumberEnv(ENV_CLOUD_TEMPERATURE, DEFAULT_CLOUD_TEMPERATURE),
    cactusGatewayUrl: readStringEnv(ENV_VAR_CACTUS_GATEWAY_URL, DEFAULT_CACTUS_GATEWAY_URL),
  };
}

export const hybridRoutingPolicy = readHybridRoutingPolicy();
