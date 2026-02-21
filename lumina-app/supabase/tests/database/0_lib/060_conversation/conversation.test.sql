-----------------------
-- Conversation Tests
-- TODO: upgrade this from simple inserts to use the new function API
-----------------------

-- Test: Authenticated user can create conversation
BEGIN;
SELECT plan(22);

-- Create 3 test users
SELECT tests.create_test_users(
  4, -- number of users
  100 -- seed
);

SELECT tests.impersonate_user(uuid_at(100, 1));
SELECT is((SELECT auth.uid()), uuid_at(100, 1), 'User 1 exists and is authenticated');

-- Create temporary tables to store test data relationships
DROP TABLE IF EXISTS test_conversations;
CREATE TEMP TABLE test_conversations (
  conversation_id uuid PRIMARY KEY,
  author_entity_id uuid NOT NULL,
  order_index SMALLINT NOT NULL,
  UNIQUE (author_entity_id, order_index)
);
GRANT SELECT ON test_conversations TO authenticated;

DROP TABLE IF EXISTS test_messages;
CREATE TEMP TABLE test_messages (
  conversation_message_id uuid PRIMARY KEY,
  conversation_id uuid NOT NULL,
  author_entity_id uuid NOT NULL,
  order_index SMALLINT NOT NULL,
  UNIQUE (conversation_id, order_index)
);
GRANT SELECT ON test_messages TO authenticated;

-- ==================
-- CONVERSATION TESTS
-- ==================

-- Test: admin:conversation:user:create - Success with valid inputs
SET ROLE postgres;
SELECT lives_ok(
  $$
    SELECT public."admin:conversation:user:create"(
      uuid_at(100, 1),
      ARRAY[uuid_at(100, 2)] -- Start a conversation with user 2
    )
  $$,
  'admin:conversation:user:create should execute without error'
);

-- Verify conversation was created
SELECT isnt_empty(
  $$ SELECT 1 FROM private.conversation WHERE owner_entity_id = uuid_at(100, 1) LIMIT 1 $$,
  'Conversation should be created for user 1'
);

-- Verify participants count
SELECT results_eq(
  $$
    SELECT COUNT(*)::bigint
    FROM private.conversation_participant cp
    JOIN private.conversation c ON cp.conversation_id = c.id
    WHERE c.owner_entity_id = uuid_at(100, 1)
  $$,
  $$ SELECT 2::bigint $$,
  'Should have 2 participants (owner + bot)'
);

-- Populate temp table with conversation data
INSERT INTO test_conversations (conversation_id, author_entity_id, order_index)
SELECT
  c.id AS conversation_id,
  uuid_at(100, 1) AS author_entity_id,
  0 AS order_index
FROM private.conversation c
WHERE c.owner_entity_id = uuid_at(100, 1);

-- Sanity check: test_conversations has 1 row
SELECT results_eq(
  $$ SELECT COUNT(*) FROM test_conversations $$,
  $$ SELECT 1::bigint $$,
  'test_conversations should have 1 row'
);

-- Test: admin:conversation:user:create - Fail with NULL authorEntityId
SELECT throws_ok(
  $$ SELECT public."admin:conversation:user:create"(NULL, ARRAY['00000000-0000-0000-0000-000000000001'::uuid]) $$,
  'authorEntityId cannot be null',
  'Should raise exception for NULL authorEntityId'
);

-- Test: admin:conversation:user:create - Fail with non-existent authorEntityId
SELECT throws_ok(
  $$ SELECT public."admin:conversation:user:create"('99999999-9999-9999-9999-999999999999'::uuid, ARRAY['00000000-0000-0000-0000-000000000001'::uuid]) $$,
  'authorEntityId does not exist',
  'Should raise exception for non-existent authorEntityId'
);

-- Test: admin:conversation:user:create - Fail with non-existent entity in otherEntityIds
SELECT throws_ok(
  $$ SELECT public."admin:conversation:user:create"(uuid_at(100, 1), ARRAY['99999999-9999-9999-9999-999999999999'::uuid]) $$,
  'One or more entity IDs in otherEntityIds do not exist',
  'Should raise exception for non-existent entity in otherEntityIds'
);

-- Test: admin:conversation:user:create - Does not fail when other other entities are not defined
SELECT lives_ok(
  $$ SELECT public."admin:conversation:user:create"(uuid_at(100, 4), ARRAY[]::uuid[]) $$,
  'Should not raise exception for empty otherEntityIds'
);

-- Sanity check, conversation has 2 participants
SELECT results_eq(
  $$
    SELECT COUNT(*)::bigint
    FROM private.conversation_participant cp
    JOIN private.conversation c ON cp.conversation_id = c.id
    WHERE c.owner_entity_id = uuid_at(100, 1)
  $$,
  $$ SELECT 2::bigint $$,
  'Conversation should still have 2 participants'
);

-- User '1' (from auth) creates conversation with user '2'
SET ROLE postgres;
SELECT tests.impersonate_user(uuid_at(100, 1));
SELECT * FROM public."app:conversation:user:create"(
  ARRAY[uuid_at(100, 2)] -- Start a conversation with user 2
);

-- User '100:1' has one conversation after creating
SELECT results_ne(
  $$ SELECT (result).id::uuid FROM public."app:conversation:user:readAll"() AS result $$,
  $$ SELECT NULL::uuid $$,
  'user100:1 has 1 conversation'
);

-- User '100:2' can see the conversation between user '100:1' and '100:2'
SET ROLE postgres;
SELECT tests.impersonate_user(uuid_at(100, 2));
SELECT results_ne(
  $$ SELECT (result).id::uuid FROM public."app:conversation:user:readAll"() AS result $$,
  $$ SELECT NULL::uuid $$,
  'User 100:2 can see the conversation because he is a participant'
);

-- ==========================================================
-- CONVERSATION MESSAGES, MESSAGE ASSETS, AND STORAGE OBJECTS
-- ==========================================================

-- Send a message from user '100:1' to user '100:2'
SET ROLE postgres;
SELECT tests.impersonate_user(uuid_at(100, 1));

SELECT results_ne(
  $$
    SELECT (result).id::uuid
      FROM public."app:conversation:message:create"(
        (SELECT conversation_id FROM test_conversations WHERE author_entity_id = uuid_at(100, 1) AND order_index = 0),
        'Hello, how are you?',
        uuid_at(100, 1),
        NULL
      ) AS result
  $$,
  $$ SELECT NULL::uuid $$,
  'User 100:1 can send a message to user 100:2'
);

-- See if the message exists
SET ROLE postgres;
SELECT results_eq(
  $$
    SELECT 1
    FROM private.conversation_message cm
    WHERE cm.conversation_id = (SELECT conversation_id FROM test_conversations WHERE author_entity_id = uuid_at(100, 1) AND order_index = 0)
      AND cm.author_entity_id = uuid_at(100, 1)
    LIMIT 1
  $$,
  $$ SELECT 1 $$,
  'Message from user 100:1 should exist'
);

-- Populate temp table with message data
SET ROLE postgres;
INSERT INTO test_messages (conversation_message_id, conversation_id, author_entity_id, order_index)
SELECT
  cm.id AS conversation_message_id,
  cm.conversation_id AS conversation_id,
  cm.author_entity_id AS author_entity_id,
  0 AS order_index
FROM private.conversation_message cm
WHERE cm.author_entity_id = uuid_at(100, 1)
  AND cm.conversation_id = (SELECT conversation_id FROM test_conversations WHERE author_entity_id = uuid_at(100, 1) AND order_index = 0);

-- User '100:1' can see his own message
SELECT results_eq(
  $$
    SELECT COUNT((result).messages) FROM public."app:conversation:user:readWithMessagesAndEntityTypes"(
      (SELECT conversation_id FROM test_conversations WHERE author_entity_id = uuid_at(100, 1) AND order_index = 0)
    ) as result
  $$,
  $$ SELECT 1::bigint $$,
  'User 1 can see his own message'
);

-- User 3 perspective
SET ROLE postgres;
SELECT tests.impersonate_user(uuid_at(100, 3));

-- User '100:3' cannot see the conversation between user '100:1' and '100:2'
SELECT is_empty(
  $$ SELECT public."app:conversation:user:readAll"() $$,
  'User 100:3 cannot see the conversation'
);

-- User '100:3' cannot see the messages, because he is not a participant
SELECT results_eq(
  $$
    SELECT COUNT((result).messages)
      FROM public."app:conversation:user:readWithMessagesAndEntityTypes"(
        (SELECT conversation_id FROM test_conversations WHERE author_entity_id = uuid_at(100, 1) AND order_index = 0)
      ) AS result
  $$,
  $$ SELECT 0::bigint $$,
  'User 100:3 cannot see the message between user 100:1 and 100:2'
);

-- ========================================
-- TEST: User '100:2' can send message back
-- ========================================
SET ROLE postgres;
SELECT tests.impersonate_user(uuid_at(100, 2));

-- User '100:2' can see the message, because he is a participant
SELECT results_eq(
  $$
    SELECT COUNT((result).messages)
      FROM public."app:conversation:user:readWithMessagesAndEntityTypes"(
        (SELECT conversation_id FROM test_conversations WHERE author_entity_id = uuid_at(100, 1) AND order_index = 0)
      ) as result
  $$,
  $$ VALUES (1::bigint) $$,
  'User 100:2 can see the message between user 100:1 and 100:2'
);

SELECT results_ne(
  $$
    SELECT (result).id::uuid
      FROM public."app:conversation:message:create"(
        (SELECT conversation_id FROM test_conversations WHERE author_entity_id = uuid_at(100, 1) AND order_index = 0),
        'I am good, thank you.',
        uuid_at(100, 2),
        NULL
      ) AS result
  $$,
  $$ SELECT NULL::uuid $$,
  'User 100:2 can send a message to the conversation with user 100:1'
);

-- Populate temp table with message data
SET ROLE postgres;
INSERT INTO test_messages (conversation_message_id, conversation_id, author_entity_id, order_index)
SELECT
  cm.id AS conversation_message_id,
  cm.conversation_id AS conversation_id,
  cm.author_entity_id AS author_entity_id,
  1 AS order_index
FROM private.conversation_message cm
WHERE cm.author_entity_id = uuid_at(100, 2)
  AND cm.conversation_id = (SELECT conversation_id FROM test_conversations WHERE author_entity_id = uuid_at(100, 1) AND order_index = 0);

-- Assert user 1 can see both messages now
SET ROLE postgres;
SELECT tests.impersonate_user(uuid_at(100, 1));
SELECT results_eq(
  $$
    SELECT cardinality(ARRAY[result.messages])
      FROM public."app:conversation:user:readWithMessagesAndEntityTypes"(
      (SELECT conversation_id FROM test_conversations WHERE author_entity_id = uuid_at(100, 1) AND order_index = 0)
    ) AS result
  $$,
  $$ SELECT 2::INTEGER $$,
  'User 100:1 can see both messages between user 100:1 and 100:2'
);

-- Assert user '100:2' can see both messages
SET ROLE postgres;
SELECT tests.impersonate_user(uuid_at(100, 2));
SELECT results_eq(
  $$
    SELECT cardinality(ARRAY[result.messages])
      FROM public."app:conversation:user:readWithMessagesAndEntityTypes"(
        (SELECT conversation_id FROM test_conversations WHERE author_entity_id = uuid_at(100, 1) AND order_index = 0)
      ) as result
  $$,
  $$ SELECT 2::INTEGER $$,
  'User 100:2 can see both messages between user 100:1 and 100:2'
);

-- ====================================

-- ==========================================
-- TEST: User '100:3' cannot see the messages
-- ==========================================
SET ROLE postgres;
SELECT tests.impersonate_user(uuid_at(100, 3));
SELECT results_eq(
  $$
    SELECT cardinality(ARRAY[result.messages])
      FROM public."app:conversation:user:readWithMessagesAndEntityTypes"(
        (SELECT conversation_id FROM test_conversations WHERE author_entity_id = uuid_at(100, 1) AND order_index = 0)
      ) as result
  $$,
  $$ VALUES (0::INTEGER) $$,
  'User 100:3 still cannot see the messages between user 100:1 and 100:2'
);

-- ====================================================================================
-- TEST: User can add storage object for an existing conversation message they authored
-- ====================================================================================

-- Insert the object for an existing message
-- SET ROLE postgres;
-- INSERT INTO storage.objects (id, bucket_id, name)
-- VALUES (
--   uuid_at(1, 0),
--   'conversations',
--   (
--     select concat(
--       (SELECT conversation_id FROM test_conversations WHERE author_entity_id = uuid_at(100, 1) LIMIT 1),
--       '/',
--       (SELECT conversation_message_id FROM test_messages WHERE author_entity_id = uuid_at(100, 1) LIMIT 1), -- message id where user is author
--       '/',
--       'user1.jpg'
--     )
--   )
-- );

-- -- Assert the object is there
-- SELECT results_eq(
--   $$ SELECT COUNT(*) FROM storage.objects $$,
--   $$ VALUES (1::bigint) $$,
--   'User 100:1 can add an object to the message'
-- );

-- -- User 100:1 cannot add an object to a message they did not author
-- -- SET ROLE postgres;
-- -- SELECT tests.impersonate_user(uuid_at(100, 1));
-- -- SELECT throws_ok(
-- --   $$
-- --     INSERT INTO storage.objects (id, bucket_id, name)
-- --     VALUES (
-- --       uuid_at(1, 1),
-- --       'conversations',
-- --       (
-- --         select concat(
-- --           (SELECT conversation_id FROM test_conversations WHERE author_entity_id = uuid_at(100, 1) LIMIT 1),
-- --           '/',
-- --           (SELECT conversation_message_id FROM test_messages WHERE author_entity_id = uuid_at(100, 2) LIMIT 1), -- message id where user is author
-- --           '/',
-- --           'user1.jpg'
-- --         )
-- --       )
-- --     );
-- --   $$
-- -- );

-- -- ===============================================================================================
-- -- TEST: User can add an object before sending a message, provided the message does not exist yet.
-- -- ===============================================================================================
-- SET ROLE postgres;
-- -- Add the object with a client-generated id for the message that does not exist yet, but will be created by the user later
-- INSERT INTO storage.objects (id, bucket_id, name)
-- VALUES (
--   uuid_at(1, 1),
--   'conversations',
--   (
--     SELECT CONCAT(
--       (SELECT conversation_id FROM test_conversations WHERE author_entity_id = uuid_at(100, 1) LIMIT 1),
--       '/',
--       uuid_at(100, 100), -- client-generated message id that does not exist yet
--       '/',
--       'cat_of_user100:1.jpg'
--     )
--   )
-- );

-- -- Assert that user '100:1' can download the underlying storage object
-- SET ROLE postgres;
-- SELECT tests.impersonate_user(uuid_at(100, 1));
-- SELECT results_eq(
--   $$ SELECT COUNT(*) FROM storage.objects $$,
--   $$ VALUES (2::bigint) $$,
--   'User 100:1 can download the underlying storage object'
-- );

-- -- Assert that user '100:2' can see the underlying storage objects
-- SET ROLE postgres;
-- SELECT tests.impersonate_user(uuid_at(100, 2));
-- SELECT results_eq(
--   $$ SELECT COUNT(*) FROM storage.objects $$,
--   $$ VALUES (2::bigint) $$,
--   'User 100:2 can see the underlying storage objects'
-- );

-- -- Assert that user '100:3' cannot download the underlying object
-- SELECT results_eq(
--   $$ SELECT COUNT(*) FROM storage.objects $$,
--   $$ VALUES (0::bigint) $$,
--   'User 100:3 cannot see the underlying storage objects'
-- );

-- -- ================================================================================================
-- -- TEST: Users can only DELETE their own message assets and the underlying storage objects they own
-- -- ================================================================================================

-- -- Assert that user '100:2' cannot DELETE the asset or underlying object created by user '1'
-- SET ROLE postgres;
-- SELECT tests.impersonate_user(uuid_at(100, 2));

-- -- Try to delete the underlying storage objects
-- DELETE FROM storage.objects WHERE id = uuid_at(1, 0);
-- DELETE FROM storage.objects WHERE id = uuid_at(1, 1);

-- -- Assert the objects are still there
-- SELECT results_eq(
--   $$ SELECT COUNT(*) FROM storage.objects $$,
--   $$ VALUES (2::bigint) $$,
--   'User 100:2 cannot DELETE the underlying storage objects to message assets they do not own'
-- );

-- -- Assert that user '100:1' can DELETE the asset and underlying object, as they are the owner
-- SET ROLE postgres;
-- SELECT tests.impersonate_user(uuid_at(100, 1));

-- -- Delete the underlying object
-- DELETE FROM storage.objects
-- WHERE id = uuid_at(1, 0);

-- DELETE FROM storage.objects
-- WHERE id = uuid_at(1, 1);

-- -- Assert the object is gone
-- SELECT results_eq(
--   $$ SELECT COUNT(*) FROM storage.objects $$,
--   $$ VALUES (0::bigint) $$,
--   'User 1 can DELETE the underlying objects it owns'
-- );

-- Clear Authentication
SET ROLE postgres;
SELECT tests.clear_authentication();

SELECT * FROM finish();
ROLLBACK;
