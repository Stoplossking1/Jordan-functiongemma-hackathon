import { createClient, SupabaseClient } from '@supabase/supabase-js';

import type { Database, ProfileUpdateV1 } from '@shared/generated-db-types';
import { readProfile, readProfileWithUser, updateProfile } from '@shared/profile-db';
import { createSupabaseTestingToken, testingAnonKey, testingUrl, testUserEmail, testUserId } from '../test-utils';

const testingJwt = createSupabaseTestingToken(testUserEmail, testUserId);

// Create a Supabase client that can access our test database with the generated test token
const supabaseClient: SupabaseClient<Database> = createClient(testingUrl, testingAnonKey, {
  accessToken: async () => {
    return testingJwt;
  },
});

const mockProfile = {
  id: testUserId,
  username: 'testuser',
  fullName: 'Test User',
  avatarUrl: 'https://example.com/avatar.jpg',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  user: { email: testUserEmail },
};

const createMockClient = (data: any = null, error: any = null) => {
  const mockUpsert = jest.fn().mockResolvedValue({ data, error });
  const mockSelect = jest.fn(() => ({
    eq: jest.fn(() => ({
      single: jest.fn().mockResolvedValue({ data, error }),
    })),
  }));

  return {
    from: jest.fn(() => ({
      upsert: mockUpsert,
      select: mockSelect,
    })),
    functions: {
      invoke: jest.fn().mockResolvedValue({ data: {}, error: null }),
    },
  } as unknown as SupabaseClient<Database>;
};

describe('Profile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should fetch basic profile data', async () => {
    const client = createMockClient(mockProfile);
    const result = await readProfile(client);
    expect(result).toEqual(mockProfile);
  });

  it('should throw on fetch error', async () => {
    const client = createMockClient(null, new Error('Database error'));
    await expect(readProfile(client)).rejects.toThrow('Database error');
  });

  it('should fetch profile with user data', async () => {
    const client = createMockClient(mockProfile);
    const result = await readProfileWithUser(client);
    expect(result).toEqual(mockProfile);
  });

  it('should update profile', async () => {
    const client = createMockClient(mockProfile);
    const updates: Partial<ProfileUpdateV1> = { username: 'newname', fullName: 'New Name' };

    await updateProfile(client, updates);

    // // eslint-disable-next-line @typescript-eslint/unbound-method
    // expect(client.from('Profile').upsert).toHaveBeenCalledWith({
    //   id: testUserId,
    //   ...updates,
    //   updatedAt: expect.any(String),
    // });
  });
});

describe('Profile Integration', () => {
  it('should fetch basic profile data from the database', async () => {
    const result = await readProfile(supabaseClient);
    expect(result).toHaveProperty('fullName');
  });

  it('should fetch profile with user data from the database', async () => {
    const result = await readProfileWithUser(supabaseClient);
    expect(result).toHaveProperty('id', testUserId);
    expect(result).toHaveProperty('user.email', testUserEmail);
  });

  it('should update profile in the database', async () => {
    const prevProfile = await readProfile(supabaseClient);
    expect(prevProfile?.fullName).toBeDefined();
    const testName = new Date().toISOString();
    const updates = { username: testName, fullName: testName };
    await updateProfile(supabaseClient, updates);

    const updatedProfile = await readProfile(supabaseClient);
    expect(updatedProfile).toHaveProperty('username', updates.username);
    expect(updatedProfile).toHaveProperty('fullName', updates.fullName);
    expect(updatedProfile?.username).not.toEqual(prevProfile?.username);
    expect(updatedProfile?.fullName).not.toEqual(prevProfile?.fullName);
    // check that the updatedAt field was increased
    expect(updatedProfile?.updatedAt?.localeCompare(prevProfile?.updatedAt ?? '')).toBe(1);
  });
});
