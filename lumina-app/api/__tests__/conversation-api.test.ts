import { createClient, SupabaseClient } from '@supabase/supabase-js';

import {
  createConversationWithOtherParticipants,
  readConversations,
  readConversationWithContent,
} from '@shared/conversation-db';
import { type Database } from '@shared/generated-db-types';
import { ENTITY_SYSTEM } from '@shared/profile-db';
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

describe('Conversation', () => {
  it('readAllConversations', async () => {
    const conversations = await readConversations(supabaseClient);
    // Ensure the data is an array
    expect(conversations).toBeInstanceOf(Array);
    expect(conversations?.length).toBeGreaterThan(0);
    expect(conversations?.[0].id).toBeTruthy();
  });

  it('readConversations', async () => {
    const conversation = await readConversationWithContent(supabaseClient, testConversation2Id);
    expect(conversation?.messages).toBeInstanceOf(Array);
    expect(conversation?.messages?.length).toBeGreaterThan(0);
    expect(conversation?.messages?.[0].message?.id).toBeTruthy();
    expect(conversation?.participants).toBeInstanceOf(Array);
    expect(conversation?.participants?.length).toBeGreaterThan(0);
    expect(conversation?.participants?.[0].participant?.entityId).toBeTruthy();
  });

  // Add this to your existing conversation-api.test.ts file, within the 'Conversation Integration' describe block

  it('can create a conversation with other participants', async () => {
    const conversationId = await createConversationWithOtherParticipants(supabaseClient, [ENTITY_SYSTEM]);

    // Verify the conversation was created
    expect(conversationId).toBeTruthy();
    expect(typeof conversationId).toBe('string');

    // Verify the conversation exists and has correct participants
    const conversation = await readConversationWithContent(supabaseClient, conversationId);

    expect(conversation).toBeTruthy();
    expect(conversation?.participants).toBeInstanceOf(Array);
    expect(conversation?.participants?.length).toBe(2); // Owner + ENTITY_SYSTEM

    // Verify participants include both the test user and ENTITY_SYSTEM
    const participantIds = conversation?.participants?.map((p) => p.participant?.entityId);
    expect(participantIds).toContain(testUser2Id);
    expect(participantIds).toContain(ENTITY_SYSTEM);
  });
});
