-- create test users
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
      uuid_at(1, ROW_NUMBER() OVER ()),
      -- text('017f3987-'||substr(md5(random()::text), 9))::uuid
      -- gen_random_uuid(),
      'authenticated',
      'authenticated',
      'user' || (ROW_NUMBER() OVER ()) || '@example.com',
      crypt ('TestPassword', gen_salt ('bf')),
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
      generate_series(1, 11)
  );

-- update the 11th user to have email 'woz@example.com' for better UX
UPDATE auth.users SET email = 'woz@example.com' WHERE id = uuid_at(1, 1);

-- test user email identities
INSERT INTO
  auth.identities (
    id,
    user_id,
    identity_data,
    provider_id,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) (
    SELECT
      id,
      id,
      format('{"sub":"%s","email":"%s"}', id::text, email)::jsonb,
      -- provider is email or phone,
      -- the id is the user's id from the auth.users table.
      id,
      'email',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    FROM
      auth.users
  );


-- CREATE OR REPLACE FUNCTION pg_temp.id(id bigint) RETURNS uuid
-- LANGUAGE SQL IMMUTABLE
-- RETURNS NULL ON NULL INPUT
-- AS $$ SELECT public.uuid_at(0, id); $$;

-- SELECT pg_temp.id(1);

WITH profiles AS (
  VALUES
(uuid_at(1, 1), 'MALE'::gender_type, 'Joe', 'Tester', '2000-01-01'::date),
(uuid_at(1, 2), 'FEMALE', 'Jane', 'Tester', '2000-03-01')
)
UPDATE private.profile AS p SET (id, gender, given_name, family_name, birth_date) = (SELECT * FROM profiles WHERE p.id = profiles.column1)
FROM profiles
WHERE p.id = profiles.column1;
