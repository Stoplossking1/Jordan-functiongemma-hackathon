import { toEmailStr, toUuidStr } from '@shared/generated-db-types';

// id of user created in seed.sql
export const testUserId = toUuidStr('00000000-0001-0000-0000-000000000001');
export const testUserEmail = toEmailStr('user1@example.com');

export const testUser2Id = toUuidStr('00000000-0001-0000-0000-000000000002');
export const testUser2Email = toEmailStr('user2@example.com');
export const testConversation2Id = toUuidStr('00000000-0000-0000-0000-000000000002');
