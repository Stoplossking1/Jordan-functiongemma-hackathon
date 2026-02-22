import * as Network from 'expo-network';
import { type SupabaseClient } from '@supabase/supabase-js';

import {
  toTimestamptzStr,
  toUuidStr,
  type ConversationMessageV1,
  type Database,
  type uuidstr,
} from '@shared/generated-db-types';
import { runCactusLocalTutorAsync } from '../cactus-local-llm-api';
import { postMessageToBot } from '../conversation-llm-api';
import { edgeFunctionInvokeWithStream } from '../edge-function-streaming-client';

jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(),
}));

jest.mock('../edge-function-streaming-client', () => ({
  edgeFunctionInvokeWithStream: jest.fn(),
}));

jest.mock('../cactus-local-llm-api', () => ({
  runCactusLocalTutorAsync: jest.fn(),
}));

jest.mock('@/i18n', () => ({
  t: (key: string) => {
    switch (key) {
      case 'assistant.offlineLocalPrefix':
        return "You're offline, so I'm using on-device math mode. Answer:";
      case 'assistant.offlineImageTypePrompt':
        return "I can't read images offline yet. Please type the math problem so I can help right away.";
      case 'assistant.localRuntimeUnavailableNotice':
        return "On-device tutoring requires a development build or TestFlight. In Expo Go, Lumina uses cloud tutoring when you're online.";
      default:
        return key;
    }
  },
}));

const mockedGetNetworkStateAsync = Network.getNetworkStateAsync as jest.MockedFunction<typeof Network.getNetworkStateAsync>;
const mockedEdgeFunctionInvokeWithStream =
  edgeFunctionInvokeWithStream as jest.MockedFunction<typeof edgeFunctionInvokeWithStream>;
const mockedRunCactusLocalTutorAsync = runCactusLocalTutorAsync as jest.MockedFunction<typeof runCactusLocalTutorAsync>;

const userId = toUuidStr('00000000-0001-0000-0000-000000000001');
const botEntityId = toUuidStr('00000000-0001-0000-0000-000000000002');
const conversationId = toUuidStr('00000000-0001-0000-0000-000000000003');

function createBotMessage(contentText: string): ConversationMessageV1 {
  return {
    id: toUuidStr('00000000-0001-0000-0000-000000000010'),
    createdAt: toTimestamptzStr(new Date().toISOString()),
    updatedAt: toTimestamptzStr(new Date().toISOString()),
    authorEntityId: botEntityId,
    contentText,
    conversationId,
    prevMessageId: null,
    context: null,
  };
}

function readStubClient(): SupabaseClient<Database> {
  return {} as unknown as SupabaseClient<Database>;
}

describe('postMessageToBot local routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('routes online requests to cloud edge function', async () => {
    mockedGetNetworkStateAsync.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    } as Network.NetworkState);

    mockedEdgeFunctionInvokeWithStream.mockResolvedValue({
      data: [createBotMessage('Cloud response')],
      error: null,
    });

    const response = await postMessageToBot(
      readStubClient(),
      userId,
      conversationId,
      'What is 8 + 5?',
      botEntityId,
      'chat',
    );

    expect(mockedEdgeFunctionInvokeWithStream).toHaveBeenCalledTimes(1);
    expect(mockedRunCactusLocalTutorAsync).not.toHaveBeenCalled();
    expect(Array.isArray(response)).toBe(true);
    expect((response as ConversationMessageV1[])[0]?.contentText).toBe('Cloud response');
  });

  it('routes offline text requests to local cactus when available', async () => {
    mockedGetNetworkStateAsync.mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
    } as Network.NetworkState);

    mockedRunCactusLocalTutorAsync.mockResolvedValue({
      resultText: '13',
      solutionSteps: [
        {
          stepNumber: 1,
          explanation: 'Read the expression.',
        },
      ],
      totalTimeInMs: 123,
    });

    const response = await postMessageToBot(
      readStubClient(),
      userId,
      conversationId,
      '8 + 5',
      botEntityId,
      'chat',
    );

    expect(mockedEdgeFunctionInvokeWithStream).not.toHaveBeenCalled();
    expect(mockedRunCactusLocalTutorAsync).toHaveBeenCalledTimes(1);
    expect(Array.isArray(response)).toBe(true);
    const localMessage = (response as ConversationMessageV1[])[0];
    expect(localMessage?.contentText).toContain('on-device math mode');
    expect((localMessage?.context as Record<string, unknown>)?.routeSource).toBe('local');
  });

  it('returns null offline when local cactus result is unavailable', async () => {
    mockedGetNetworkStateAsync.mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
    } as Network.NetworkState);

    mockedRunCactusLocalTutorAsync.mockResolvedValue(undefined);

    const response = await postMessageToBot(
      readStubClient(),
      userId,
      conversationId,
      'Can you explain this?',
      botEntityId,
      'chat',
    );

    expect(mockedEdgeFunctionInvokeWithStream).not.toHaveBeenCalled();
    expect(response).toBeNull();
  });

  it('returns an immediate offline image prompt and skips local call for image-only requests', async () => {
    mockedGetNetworkStateAsync.mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
    } as Network.NetworkState);

    const response = await postMessageToBot(
      readStubClient(),
      userId,
      conversationId,
      "I've taken a photo of a math problem. Please look at the attached image and help me solve it.",
      botEntityId,
      'chat',
      toUuidStr('00000000-0001-0000-0000-000000000011') as uuidstr,
      undefined,
      [{ objectId: toUuidStr('00000000-0001-0000-0000-000000000012') }],
      false,
      undefined,
      { imageUri: 'file:///tmp/problem.jpg' },
    );

    expect(mockedRunCactusLocalTutorAsync).not.toHaveBeenCalled();
    expect(Array.isArray(response)).toBe(true);
    const imagePromptMessage = (response as ConversationMessageV1[])[0];
    expect(imagePromptMessage?.contentText).toContain("can't read images offline yet");
    expect((imagePromptMessage?.context as Record<string, unknown>)?.fallbackReason).toBe(
      'image_unsupported_offline',
    );
  });
});
