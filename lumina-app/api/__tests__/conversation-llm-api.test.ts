import * as fs from 'fs';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { CONVERSATIONS_BUCKET, validateConversationMessageAssetsWithDefaults } from '@shared/conversation-db';
import {
  toTimestamptzStr,
  toUuidStr,
  type ConversationMessageAssetV1,
  type Database,
} from '@shared/generated-db-types';
import { ENTITY_SYSTEM } from '@shared/profile-db';
import { uploadPrivateAssetFromBuffer } from '../asset-api';
import { postMessageToBot } from '../conversation-llm-api';
import { EventStream } from '../event-stream/streaming';
import {
  createSupabaseTestingToken,
  testConversation2Id,
  testingAnonKey,
  testingUrl,
  testUser2Email,
  testUser2Id,
} from '../test-utils';

const testingJwt = createSupabaseTestingToken(testUser2Email, testUser2Id);

// increase the timeout for debugging
jest.setTimeout(20000);

// Create a Supabase client that can access our test database with the generated test token
const supabaseClient: SupabaseClient<Database> = createClient(testingUrl, testingAnonKey, {
  accessToken: async () => {
    return testingJwt;
  },
});

describe('Conversation LLM', () => {
  // skip this test since we are calling an llm in the process. We should stub this out
  it('postConversation', async () => {
    const abortController = new AbortController();
    const messagesOrStream = await postMessageToBot(
      supabaseClient,
      testUser2Id,
      testConversation2Id,
      'If you ask me "is this a subscription service?". My answer is Yes',
      // 'sounds good',
      ENTITY_SYSTEM,
      'tooltest',
      undefined,
      undefined,
      undefined,
      true,
      abortController,
    );
    let count = 0;
    if (messagesOrStream instanceof EventStream) {
      for await (const { data, event } of messagesOrStream) {
        console.log(`Read event: ${event} data: ${data.content}`);
        count++;
      }
      expect(count).toBeGreaterThan(0);
    } else {
      const messages = messagesOrStream;
      expect(messages?.length).toBeGreaterThan(0);
      const firstMessage = messages?.[0];
      expect(firstMessage).toBeTruthy();
      expect(firstMessage?.authorEntityId).toEqual(ENTITY_SYSTEM);
      // expect(firstMessage?.contentText?.length).toBeGreaterThan(0);
    }
  });

  // skip this test since we are calling an llm in the process. We should stub this out
  it.skip('postConversationWithAttachedFile', async () => {
    const testConversationMessageId = toUuidStr('00000000-0001-0000-0000-000000000099');
    const fileName = 'assets/images/avatar-placeholder.png';
    // const imageBinary = await fs.promises.readFile(fileName);
    const imageStream = fs.createReadStream(fileName);
    const res = await uploadPrivateAssetFromBuffer(
      supabaseClient,
      imageStream,
      'image/png',
      CONVERSATIONS_BUCKET,
      `${testConversation2Id}/${testConversationMessageId}/image.png`,
    );

    const attachedAssets: Partial<ConversationMessageAssetV1>[] = [
      {
        objectId: toUuidStr(res.id),
      },
    ];

    validateConversationMessageAssetsWithDefaults(
      attachedAssets,
      testConversationMessageId,
      toTimestamptzStr(new Date().toISOString()),
    );

    const abortController = new AbortController();
    const messagesOrStream = await postMessageToBot(
      supabaseClient,
      testUser2Id,
      testConversation2Id,
      // 'If you ask me "is this a subscription service?". My answer is Yes',
      // 'sounds good',
      "What's show on the image?",
      ENTITY_SYSTEM,
      'subscription',
      testConversationMessageId,
      undefined,
      attachedAssets,
      true,
      abortController,
    );
    if (messagesOrStream instanceof EventStream) {
      for await (const { data, event } of messagesOrStream) {
        if (event === 'done') {
          // todo
        }
        console.log(`Read event: ${event} data: ${data.content}`);
      }
    } else {
      const messages = messagesOrStream;
      expect(messages?.length).toBeGreaterThan(0);
      const firstMessage = messages?.[0];
      expect(firstMessage).toBeTruthy();
      expect(firstMessage?.authorEntityId).toEqual(ENTITY_SYSTEM);
      expect(firstMessage?.contentText?.length).toBeGreaterThan(0);
    }
  });
});
