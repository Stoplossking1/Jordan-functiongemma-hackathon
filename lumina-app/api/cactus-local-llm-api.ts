import Constants from 'expo-constants';

import type { CactusLM, Message } from 'cactus-react-native';

import { LOCAL_MATH_TOOLS, runLocalMathToolFromFunctionCalls } from '@/api/cactus-local-tools';
import { type OfflineTutorStep } from '@/utils/offlineMathTutor';

const IS_EXPO_GO = Constants.appOwnership === 'expo';

type CactusRuntimeState = 'uninitialized' | 'preparing' | 'ready' | 'unavailable' | 'failed';

const DEFAULT_LOCAL_MODEL = 'functiongemma-270m-it';
const DEFAULT_SYSTEM_INSTRUCTION =
  'You are a math tutor assistant. You must call solve_math_problem with the exact user problem text.';
const ENV_ENABLE_CACTUS_LOCAL = 'EXPO_PUBLIC_ENABLE_CACTUS_LOCAL';
const ENV_CACTUS_MODEL = 'EXPO_PUBLIC_CACTUS_MODEL';
const ENABLED_FLAG_VALUES = new Set(['1', 'true', 'yes', 'on']);
const DISABLED_FLAG_VALUES = new Set(['0', 'false', 'no', 'off']);

let cactusRuntimeState: CactusRuntimeState = 'uninitialized';
let cactusRuntimeAvailability: boolean | undefined;
let cactusLm: CactusLM | undefined;
let cactusPrepareInFlightPromise: Promise<void> | undefined;

export interface RunCactusLocalTutorInput {
  userText: string;
  systemInstruction?: string;
}

export interface CactusLocalTutorResult {
  resultText: string;
  solutionSteps: OfflineTutorStep[];
  totalTimeInMs?: number;
}

function readBooleanEnvWithDefault(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null) {
    return defaultValue;
  }

  const normalizedValue = value.trim().toLowerCase();
  if (ENABLED_FLAG_VALUES.has(normalizedValue)) {
    return true;
  }
  if (DISABLED_FLAG_VALUES.has(normalizedValue)) {
    return false;
  }

  return defaultValue;
}

function isLocalCactusEnabled(): boolean {
  return readBooleanEnvWithDefault(process.env[ENV_ENABLE_CACTUS_LOCAL], true);
}

function readLocalModelSlug(): string {
  const configuredModel = process.env[ENV_CACTUS_MODEL]?.trim();
  return configuredModel && configuredModel.length > 0 ? configuredModel : DEFAULT_LOCAL_MODEL;
}

function setRuntimeUnavailable(): void {
  cactusRuntimeState = 'unavailable';
  cactusRuntimeAvailability = false;
}

function getOrCreateCactusLm(): CactusLM | undefined {
  if (cactusLm != null) {
    return cactusLm;
  }

  if (cactusRuntimeState === 'unavailable') {
    return undefined;
  }

  if (IS_EXPO_GO) {
    setRuntimeUnavailable();
    return undefined;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { CactusLM: CactusLMClass } = require('cactus-react-native') as typeof import('cactus-react-native');
    cactusLm = new CactusLMClass({
      model: readLocalModelSlug(),
    });
    cactusRuntimeAvailability = true;
    return cactusLm;
  } catch (error) {
    setRuntimeUnavailable();
    console.warn('Cactus runtime unavailable on this build:', error);
    return undefined;
  }
}

function buildLocalMessages(input: RunCactusLocalTutorInput): Message[] {
  const systemInstruction = input.systemInstruction?.trim() || DEFAULT_SYSTEM_INSTRUCTION;
  return [
    { role: 'system', content: systemInstruction },
    { role: 'user', content: input.userText },
  ];
}

async function prepareCactusLocalModelInternalAsync(): Promise<void> {
  if (!isLocalCactusEnabled()) {
    setRuntimeUnavailable();
    return;
  }

  const localCactusLm = getOrCreateCactusLm();
  if (localCactusLm == null) {
    return;
  }

  try {
    await localCactusLm.download();
    await localCactusLm.init();
    cactusRuntimeState = 'ready';
    cactusRuntimeAvailability = true;
  } catch (error) {
    cactusRuntimeState = 'failed';
    cactusRuntimeAvailability = true;
    console.error('prepareCactusLocalModelAsync error:', error);
    throw error;
  }
}

export async function isCactusLocalRuntimeAvailableAsync(): Promise<boolean> {
  if (!isLocalCactusEnabled()) {
    return false;
  }

  if (cactusRuntimeAvailability != null) {
    return cactusRuntimeAvailability;
  }

  const localCactusLm = getOrCreateCactusLm();
  return localCactusLm != null;
}

export async function prepareCactusLocalModelAsync(): Promise<void> {
  if (cactusRuntimeState === 'ready' || cactusRuntimeState === 'unavailable') {
    return;
  }

  if (cactusPrepareInFlightPromise != null) {
    return cactusPrepareInFlightPromise;
  }

  cactusRuntimeState = 'preparing';
  cactusPrepareInFlightPromise = prepareCactusLocalModelInternalAsync().finally(() => {
    cactusPrepareInFlightPromise = undefined;
  });

  return cactusPrepareInFlightPromise;
}

export async function runCactusLocalTutorAsync(
  input: RunCactusLocalTutorInput,
): Promise<CactusLocalTutorResult | undefined> {
  if (!isLocalCactusEnabled()) {
    return undefined;
  }

  if (cactusRuntimeState === 'uninitialized' || cactusRuntimeState === 'failed') {
    try {
      await prepareCactusLocalModelAsync();
    } catch (error) {
      console.error('runCactusLocalTutorAsync prepare error:', error);
      return undefined;
    }
  }

  if (cactusRuntimeState !== 'ready') {
    return undefined;
  }

  const localCactusLm = getOrCreateCactusLm();
  if (localCactusLm == null) {
    return undefined;
  }

  try {
    const completionResult = await localCactusLm.complete({
      mode: 'local',
      messages: buildLocalMessages(input),
      tools: LOCAL_MATH_TOOLS,
      options: {
        forceTools: true,
        maxTokens: 256,
        temperature: 0,
      },
    });

    const toolExecutionResult = runLocalMathToolFromFunctionCalls(completionResult.functionCalls);
    if (toolExecutionResult == null) {
      return undefined;
    }

    return {
      resultText: toolExecutionResult.solution.resultText,
      solutionSteps: toolExecutionResult.solution.solutionSteps,
      totalTimeInMs: completionResult.totalTimeMs,
    };
  } catch (error) {
    cactusRuntimeState = 'failed';
    console.error('runCactusLocalTutorAsync error:', error);
    return undefined;
  }
}

export function readCactusRuntimeStateForDebugging(): CactusRuntimeState {
  return cactusRuntimeState;
}
