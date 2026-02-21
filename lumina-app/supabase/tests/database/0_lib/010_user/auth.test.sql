BEGIN;
SELECT plan(2); -- only one statement to run

SELECT has_column(
    'auth',
    'users',
    'id',
    'id should exist'
);


-- Test test user creation
SELECT tests.create_test_users(
  3, -- number of users
  100 -- seed
);

-- Test user authentication impersonation for testing
SELECT tests.impersonate_user(uuid_at(100, 1));
SELECT is((SELECT auth.uid()), uuid_at(100, 1), 'User 1 exists and is authenticated');

-- Clear authentication
SET ROLE postgres;
SELECT tests.clear_authentication();

SELECT * FROM finish();
ROLLBACK;
