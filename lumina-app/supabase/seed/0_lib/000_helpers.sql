-- We want to store all of this in the tests schema to keep it
-- separate from any application data
CREATE SCHEMA IF NOT EXISTS tests;

-- Creates Supabase test users int he auth.users table
CREATE OR REPLACE FUNCTION tests.create_test_users(
  _n INT,
  _seed INT DEFAULT 1
)
RETURNS void
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO
    auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) (
      SELECT
        '00000000-0000-0000-0000-000000000000',
        public.uuid_at(_seed, ROW_NUMBER() OVER ()),
        -- text('017f3987-'||substr(md5(random()::text), 9))::uuid
        -- gen_random_uuid(),
        'authenticated',
        'authenticated',
        'user' || _seed || '-' || (ROW_NUMBER() OVER ()) || '@example.com',
        extensions.crypt ('TestPassword', extensions.gen_salt ('bf')),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        '{"provider":"email","providers":["email"]}',
        '{}',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        '',
        '',
        '',
        ''
      FROM
        generate_series(1, _n)
    );
END
$$;

/**
  * ### tests.impersonate_user()
  * Impersonate an authenticated user with id
  *
  * Returns:
  * - `void`
  *
  * Example:
  * ```sql
  *   SELECT tests.impersonate_user(public.uuid_at(1, 1));
  * ```
 */
CREATE OR REPLACE FUNCTION tests.impersonate_user(_user_id uuid)
RETURNS void
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  SET ROLE authenticated;
  EXECUTE format('SET request.jwt.claim.sub = %L', _user_id::text);
END
$$;

/**
  * ### tests.clear_authentication()
  * Clears out the authentication and sets role to anon
  *
  * Returns:
  * - `void`
  *
  * Example:
  * ```sql
  *   SELECT tests.impersonate_user(public.uuid_at(1, 1));
  *   SELECT tests.clear_authentication();
  * ```
 */
CREATE OR REPLACE FUNCTION tests.clear_authentication()
RETURNS void
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', null, true);
END
$$;
