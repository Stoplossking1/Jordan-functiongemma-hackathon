import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { type Database } from '@shared/generated-db-types';
import { sendEmailText } from '../email-api';
import { createSupabaseTestingToken, testingAnonKey, testingUrl, testUserEmail, testUserId } from '../test-utils';

const testingJwt = createSupabaseTestingToken(testUserEmail, testUserId);

// increase the timeout for debugging
jest.setTimeout(20000);

// Create a Supabase client that can access our test database with the generated test token
const supabaseClient: SupabaseClient<Database> = createClient(testingUrl, testingAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      Authorization: `Bearer ${testingJwt}`,
    },
  },
});

describe.skip('Email Api', () => {
  it('sends a simple email with text', async () => {
    // Assert that the function completes without throwing an error
    await expect(
      sendEmailText(supabaseClient, {
        from: 'Acme <onboarding@resend.dev>',
        to: 'delivered@resend.dev',
        subject: 'Hello Test',
        text: 'It works',
      }),
    ).resolves.not.toThrow();
  });
});
