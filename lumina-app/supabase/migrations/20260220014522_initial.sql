-- 0_lib/000_init/0_init.sql

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
-- Disable this line as otherwise the search path for pgcrypt functions needs to be explicitly specified
-- SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
-- pgjwt not supported anymore by supabase. If needed, use functions from here
---https://github.com/michelp/pgjwt/blob/master/pgjwt--0.2.0.sql
-- CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
-- Supabase vault extension resets the search path causiong "ERROR:  3F000: no schema has been selected to create in"
-- https://woz-crew.slack.com/archives/C09MUU8PXQB/p1761616184946489
-- Remove once supabase resolves this issue
SET search_path to "\$user", public, extensions; 

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- The schema we are using to store the actual data
CREATE SCHEMA IF NOT EXISTS private AUTHORIZATION pg_database_owner;
COMMENT ON SCHEMA "public" IS 'standard public schema';

-- https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/api/using-custom-schemas.mdx
GRANT USAGE ON SCHEMA private TO service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA private TO service_role, postgres;
GRANT ALL ON ALL ROUTINES IN SCHEMA private TO service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA private TO service_role, postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA private GRANT ALL ON TABLES TO service_role, postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA private GRANT ALL ON ROUTINES TO service_role, postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA private GRANT ALL ON SEQUENCES TO service_role, postgres;

-- Change the privileges for all functions created in the future in all schemas. 
-- Currently there is no way to limit it to a single schema. https://postgrest.org/en/v12/explanations/db_authz.html#functions
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated, service_role;


-- 0_lib/000_init/1_types.sql

-- NOT NULL types to be used in composite types which otherwise don't support it: https://dba.stackexchange.com/a/342852/118434
CREATE DOMAIN public.bool_notnull AS bool NOT NULL;
CREATE DOMAIN public.smallint_notnull AS smallint NOT NULL;
CREATE DOMAIN public.int2_notnull AS int2 NOT NULL; 
CREATE DOMAIN public.int_notnull AS int NOT NULL;
CREATE DOMAIN public.int4_notnull AS int4 NOT NULL;
CREATE DOMAIN public.bigint_notnull AS bigint NOT NULL;
CREATE DOMAIN public.int8_notnull AS int8 NOT NULL; 
CREATE DOMAIN public.real_notnull AS real NOT NULL;
CREATE DOMAIN public.float4_notnull AS float4 NOT NULL;
CREATE DOMAIN public.double_notnull AS double precision NOT NULL;
CREATE DOMAIN public.float8_notnull AS float8 NOT NULL;
CREATE DOMAIN public.decimal_notnull AS decimal NOT NULL;
CREATE DOMAIN public.numeric_notnull AS numeric NOT NULL;
CREATE DOMAIN public.money_notnull AS money NOT NULL;

CREATE DOMAIN public.interval_notnull AS interval NOT NULL;
CREATE DOMAIN public.date_notnull AS date NOT NULL;
CREATE DOMAIN public.timetz_notnull AS timetz NOT NULL;
CREATE DOMAIN public.time_notnull AS time NOT NULL;
CREATE DOMAIN public.timestamptz_notnull AS timestamptz NOT NULL;
CREATE DOMAIN public.timestamp_notnull AS timestamp NOT NULL;
CREATE DOMAIN public.uuid_notnull AS uuid NOT NULL;

CREATE DOMAIN public.text_notnull AS text NOT NULL;
CREATE DOMAIN public.bytea_notnull AS bytea NOT NULL;
CREATE DOMAIN public.varchar_notnull AS varchar NOT NULL;
CREATE DOMAIN public.jsonb_notnull AS jsonb NOT NULL;

-- First, create the email domain for testing
CREATE DOMAIN public.email AS TEXT
CHECK (
    VALUE ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND LENGTH(VALUE) <= 254
    AND VALUE NOT LIKE '%..%'  -- No consecutive dots
    AND VALUE NOT LIKE '.%'    -- No leading dot
    AND VALUE NOT LIKE '%.'    -- No trailing dot
);

CREATE DOMAIN public.url AS TEXT;
-- CHECK (
    -- VALUE ~* '^(https?|ftp|ftps|file)://[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*(:(\d{1,5}))?(/.*)?(\?.*)?(\#.*)?$'
    -- OR VALUE ~* '^file:///[a-zA-Z0-9/._\-~%]+$'  -- Special handling for file:// URLs
    -- AND LENGTH(VALUE) <= 2048
-- )


-- 0_lib/000_init/7-uuid-api-funcs.sql

-- Implements a UUID "similar" to type v7 (without the version tag) to generate sortable UUIDs using a timestamp and random number:
-- https://www.ietf.org/archive/id/draft-peabody-dispatch-new-uuid-format-04.html#name-uuid-version-7
-- https://uuid7.com/
-- http://www.codeproject.com/Articles/388157/GUIDs-as-fast-primary-keys-under-multiple-database
--
-- We use 6 bytes (signed) for milliseconds since 1970 = 1628906 days = 4462 years
-- The remaining 10 bytes are random numbers

CREATE OR REPLACE FUNCTION public.uuid_from_millis(millis_since_1970 bigint, uuid1 uuid)
RETURNS uuid
RETURNS NULL ON NULL INPUT
IMMUTABLE
SET search_path = ''
LANGUAGE SQL
AS $$ SELECT (lpad(to_hex(millis_since_1970), 12, '0') || substring(uuid1::text from 14))::UUID; $$;
-- SELECT text('007bdc9c-'||substr(md5(random()::text), 9))::uuid

GRANT EXECUTE ON FUNCTION public.uuid_from_millis TO PUBLIC;

CREATE OR REPLACE FUNCTION public.uuid_from_timestamp(ts timestamptz = now(), uuid1 uuid = gen_random_uuid())
RETURNS uuid
RETURNS NULL ON NULL INPUT
IMMUTABLE
SET search_path = ''
LANGUAGE SQL
AS $$ SELECT public.uuid_from_millis((EXTRACT(EPOCH FROM ts)*1000)::bigint, uuid1);$$;

GRANT EXECUTE ON FUNCTION public.uuid_from_timestamp TO PUBLIC;


CREATE OR REPLACE FUNCTION public.uuid_from_longs(msb bigint, lsb bigint)
RETURNS uuid
RETURNS NULL ON NULL INPUT
IMMUTABLE
SET search_path = ''
LANGUAGE SQL
AS $$ SELECT (lpad(to_hex(msb), 16, '0') || lpad(to_hex(lsb), 16, '0'))::UUID; $$;

GRANT EXECUTE ON FUNCTION public.uuid_from_longs TO PUBLIC;

-- set the time and space component of the uuid to fixed values
CREATE OR REPLACE FUNCTION public.uuid_at(time_id bigint, space_id bigint = 0)
RETURNS uuid
RETURNS NULL ON NULL INPUT
IMMUTABLE
SET search_path = ''
LANGUAGE SQL
AS $$ SELECT (lpad(to_hex(time_id), 12, '0') || lpad(to_hex(space_id), 20, '0'))::UUID; $$;

GRANT EXECUTE ON FUNCTION public.uuid_at TO PUBLIC;


CREATE OR REPLACE FUNCTION public.int_id_from_millis(millis_since_1970 bigint) 
RETURNS integer
RETURNS NULL ON NULL INPUT
IMMUTABLE
SET search_path = ''
LANGUAGE SQL
-- use seconds since epoch, which is 2025-01-01 00:00:00 UTC
AS $$ SELECT (millis_since_1970 - 1735689600000)/1000; $$;

GRANT EXECUTE ON FUNCTION public.int_id_from_millis TO PUBLIC;


CREATE OR REPLACE FUNCTION public.int_id_from_timestamp(ts timestamptz = now()) 
RETURNS integer
RETURNS NULL ON NULL INPUT
IMMUTABLE
SET search_path = ''
LANGUAGE SQL 
-- epoch is 2025-01-01 00:00:00 UTC
AS $$ SELECT public.int_id_from_millis((EXTRACT(EPOCH FROM ts)*1000)::bigint); $$;

GRANT EXECUTE ON FUNCTION public.int_id_from_timestamp TO PUBLIC;


CREATE OR REPLACE FUNCTION private.bytea_to_int8(ba BYTEA, start_pos INT, num_bytes INT)
RETURNS int8
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  result int8 := 0;
  msb_bit int;
BEGIN
  IF num_bytes < 1 OR num_bytes > 8 THEN RETURN NULL; END IF;

  -- Get the most significant bit of the first byte
  msb_bit := (get_byte(ba, start_pos) >> 7) & 1;

  -- If MSB is 1 and we're reading less than 8 bytes, start with all 1s in upper bits
  IF msb_bit = 1 AND num_bytes < 8 THEN
    result := -1 << (num_bytes * 8);
  END IF;

  FOR i IN 0..num_bytes-1 LOOP
    result := result | (get_byte(ba, start_pos + i)::int8 << (8 * (num_bytes - 1 - i)));
  END LOOP;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.uuid_to_millis(uuid1 uuid)
RETURNS bigint
RETURNS NULL ON NULL INPUT
IMMUTABLE
SET search_path = ''
LANGUAGE SQL
AS $$ SELECT private.bytea_to_int8(uuid_send(uuid1), 0, 6); $$;
-- AS $$ SELECT ('x' || translate(uuid1::text, '-', ''))::bit(46)::bigint; $$;
-- AS $$ SELECT ('x' || translate(uuid1::text, '-', ''))::bit(64)::bigint; $$;

GRANT EXECUTE ON FUNCTION public.uuid_to_millis TO PUBLIC;


-- Combine an existing uuid and given millis into a new uuid. The millis will define the time part of
-- the uuid. The random part inside the uuid will be combined using XOR. We also include the millis into
-- XOR to make sure that a uuid with a timestamp part equal to the given millis will not just return the given uuid.
CREATE OR REPLACE FUNCTION public.uuid_add_millis_and_id(uuid1 uuid, millis_since1970 bigint = NULL, uuid2 uuid = NULL) 
RETURNS uuid
IMMUTABLE
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  v_bytea1 bytea;
  v_bytea2 bytea;
  v_millis_shifted bigint;
  v_tmp int;
BEGIN
    -- swap in case only one is null
  IF uuid1 IS NULL THEN
    uuid1 := uuid2;
    uuid2 := NULL;
  END IF;
  -- v_bytea1 := decode(replace(uuid1::text, '-', ''), 'hex');
  -- v_bytea2 := decode(replace(uuid2::text, '-', ''), 'hex');
  v_bytea1 := uuid_send(uuid1);
  v_bytea2 := uuid_send(uuid2);

  -- RAISE NOTICE '%', octet_length(v_bytea1);
  IF millis_since1970 IS NOT NULL THEN
    v_millis_shifted := (millis_since1970) << 16;
    FOR i IN 0..5 LOOP
      -- Write milliseconds to first 6 bytes
      v_tmp := (v_millis_shifted >> ((7 - (i % 8)) * 8) & 255)::int;
      v_bytea1 := set_byte(v_bytea1, i, v_tmp);
    END LOOP;
  END IF;

  FOR i IN 6..15 LOOP
    v_tmp := get_byte(v_bytea1, i);
    -- Apply milliseconds XOR if provided
    IF millis_since1970 IS NOT NULL THEN
      v_tmp := v_tmp # (millis_since1970 >> ((7 - (i % 8)) * 8) & 255)::int;
    END IF;

    -- Apply milliseconds XOR if provided
    IF v_bytea2 IS NOT NULL THEN
      v_tmp := v_tmp # get_byte(v_bytea2, i);
    END IF;
    v_bytea1 := set_byte(v_bytea1, i, v_tmp);
  END LOOP;

  RETURN encode(v_bytea1, 'hex')::uuid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.uuid_add_millis_and_id TO PUBLIC;


CREATE OR REPLACE FUNCTION public.uuid_add_timestamp_and_id(uuid1 uuid, ts timestamptz = NULL, uuid2 uuid = NULL)
RETURNS uuid
IMMUTABLE
SET search_path = ''
LANGUAGE SQL
AS $$ SELECT public.uuid_add_millis_and_id(uuid1, (EXTRACT(EPOCH FROM ts)*1000)::bigint, uuid2); $$;

GRANT EXECUTE ON FUNCTION public.uuid_add_timestamp_and_id TO PUBLIC;


-- Convert UUID into url safe base64 ID
CREATE OR REPLACE FUNCTION public.uuid_to_base64(uuid1 uuid)
RETURNS text
IMMUTABLE
SET search_path = ''
LANGUAGE SQL
AS $$ SELECT substring(translate(encode(decode(replace(uuid1::text, '-', ''), 'hex'), 'base64'), '+/', '-_') for 22); $$;

GRANT EXECUTE ON FUNCTION public.uuid_to_base64 TO PUBLIC;

-- Convert url safe base64 ID into UUID
CREATE OR REPLACE FUNCTION public.uuid_from_base64(uuid_base64 text)
RETURNS uuid
IMMUTABLE
SET search_path = ''
LANGUAGE SQL 
-- add the trailing '==' characters to base64 string if missing
AS $$ SELECT encode(decode(translate(CASE WHEN right(uuid_base64, 2) != '==' THEN uuid_base64 || '==' ELSE uuid_base64 END, '-_', '+/'), 'base64'), 'hex')::UUID; $$;

GRANT EXECUTE ON FUNCTION public.uuid_from_base64 TO PUBLIC;

-- 0_lib/010_user/5_user-api-types.sql

CREATE TYPE public."UserV1" AS (
  id uuid_notnull,
  email public.email,
  "role" varchar(255),
  "emailConfirmedAt" timestamptz,
  "lastSignInAt" timestamptz,
  "createdAt" timestamptz,
  "updatedAt" timestamptz,
  phone text,
  "isSsoUser" bool_notnull,
  "deletedAt" timestamptz
);

-- 0_lib/010_user/7_user-api-funcs.sql

-- Method to be called by the client to delete user related data
CREATE OR REPLACE FUNCTION public."admin:user:deleteRelatedData"(
  "userId" UUID
)
RETURNS void
-- No SECURITY DEFINER, caller is admin
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete organization
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'private' 
      AND table_name = 'organization'
  ) THEN
    DELETE FROM private.organization
    WHERE owner_entity_id = "userId";

    DELETE FROM private.organization_membership
    WHERE entity_id = "userId";
  END IF;

  -- Delete entity
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'private'
      AND table_name = 'entity'
  ) THEN
    DELETE FROM private.entity
    WHERE user_id = "userId";
  END IF;

  -- Delete profile
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'private'
      AND table_name = 'profile'
  ) THEN
    DELETE FROM private.profile
    WHERE id = "userId";
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public."admin:user:deleteRelatedData" TO service_role;

-- 0_lib/020_entity/1_entity-types.sql

CREATE TYPE public.entity_type AS ENUM (
  'PERSON', -- A user or person not in the system. We can tell if a person is a "user" if the user_id in the entity table is not null. Other use-case specific roles should probably be expressed through additional tables 
  'SYSTEM', -- Any system generated content that doesn't represent a "Bot". For example status messages
  'BOT' -- Has a persona and possibly a name and the user engages with it
);

COMMENT ON TYPE public.entity_type IS '
description: Entities that are used throughout the system
values:
  PERSON: A user or person not in the system. We can tell if a person is a "user" if the user_id in the entity table is not null. Other use-case specific roles should probably be expressed through additional tables 
  SYSTEM: Any system generated content that doesn''t represent a "Bot". For example status messages
  BOT: Has a persona and possibly a name and the user engages with it
';

-- 0_lib/020_entity/3_entity-tables.sql

CREATE TABLE IF NOT EXISTS private.entity (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  entity_type public.entity_type NOT NULL,
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE, -- make this index unique so we prevent more than one entity per user
  name text, -- can be used to name the system or bots or persons not registered in the system

  -- whenever user_id is not null, the id and user id should be equal. This makes querying easier in some cases since we usually have the user id available
  CONSTRAINT id_matches_user_id CHECK (user_id IS NULL OR id = user_id)
);

-- make this index unique so we prevent more than one entity per user
--CREATE UNIQUE INDEX IF NOT EXISTS entity_idx_user_id ON private.entity(user_id) WHERE user_id IS NOT NULL;

-- Add fixed entities
INSERT INTO private.entity (id, entity_type, name)
VALUES ('00000000-0000-0000-0000-000000000000', 'SYSTEM', 'system');

-- 0_lib/020_entity/5_entity-api-types.sql

CREATE TYPE public."EntityV1" AS (
  id uuid_notnull,
  "createdAt" timestamptz_notnull,
  "updatedAt" timestamptz_notnull,
  "entityType" public.entity_type,
  "userId" uuid,
  name text
);

-- 0_lib/020_entity/7_entity-api-funcs.sql

-- Function to check if entity exists
CREATE OR REPLACE FUNCTION public."app:entity:exists"("entityId" uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT EXISTS(
  SELECT 1 
  FROM private.entity e
  WHERE e.id = "entityId"
  -- any authenticated user can read entities
  AND auth.uid() IS NOT NULL
);
$$;

GRANT EXECUTE ON FUNCTION public."app:entity:exists" TO authenticated;

-- Function to create user entity
CREATE OR REPLACE FUNCTION public."app:entity:user:create"()
RETURNS boolean
SECURITY DEFINER
SET search_path = ''
LANGUAGE sql
AS $$
WITH inserted AS (
  INSERT INTO private.entity (id, entity_type, user_id)
  SELECT auth.uid(), 'PERSON', auth.uid()
  -- Only allow if user is authenticated and creating their own entity
  WHERE auth.uid() IS NOT NULL 
  ON CONFLICT (id) DO NOTHING
  RETURNING id
)
SELECT EXISTS(SELECT 1 FROM inserted) OR EXISTS(
  SELECT 1 FROM private.entity WHERE id = auth.uid()
);
$$;

GRANT EXECUTE ON FUNCTION public."app:entity:user:create" TO authenticated;

-- Function to update user entity
CREATE OR REPLACE FUNCTION public."app:entity:user:update"(
  "newEntityType" public.entity_type DEFAULT NULL,
  "newName" text DEFAULT NULL
)
RETURNS boolean
SECURITY DEFINER
SET search_path = ''
LANGUAGE sql
AS $$
WITH updated AS (
  UPDATE private.entity
  SET 
    entity_type = COALESCE("newEntityType", entity_type),
    name = COALESCE("newName", name),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = auth.uid()
    -- Only allow users to update their own entity
    AND user_id = auth.uid()
    AND auth.uid() IS NOT NULL
  RETURNING id
)
SELECT EXISTS(SELECT 1 FROM updated);
$$;

GRANT EXECUTE ON FUNCTION public."app:entity:user:update" TO authenticated;

-- Function to read user entity data
CREATE OR REPLACE FUNCTION public."app:entity:user:read"()
RETURNS public."EntityV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  e.id,
  e.created_at,
  e.updated_at,
  e.entity_type,
  e.user_id,
  e.name
)::public."EntityV1"
FROM private.entity e
WHERE e.id = auth.uid()
  AND e.user_id = auth.uid()
  AND auth.uid() IS NOT NULL
LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public."app:entity:user:read" TO authenticated;

-- Get entity by email (case-insensitive)
CREATE OR REPLACE FUNCTION public."admin:entity:getByEmail"("userEmail" TEXT)
RETURNS TABLE("entityId" UUID, email TEXT)
SECURITY DEFINER -- Added SECURITY DEFINER to access auth.users from admin function with service_role
SET search_path = ''
LANGUAGE sql
STABLE
AS $$
  SELECT e.id, u.email
  FROM private.entity e
  JOIN auth.users u ON u.id = e.user_id
  WHERE LOWER(u.email) = LOWER("userEmail")
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public."admin:entity:getByEmail" TO service_role;
-- 0_lib/030_asset/5_asset-api-types.sql

CREATE TYPE public."AssetV1" AS (
  id uuid_notnull,
  "bucketId" text,
  name text,
  "ownerId" text,
  "mimeType" text
);


-- 0_lib/030_asset/7_asset-api-funcs.sql


CREATE OR REPLACE FUNCTION public."app:assets:user:read"()
RETURNS SETOF public."AssetV1"
STABLE
SECURITY DEFINER
SET search_path = ''
LANGUAGE sql
AS $$    
SELECT 
  id,
  bucket_id,
  name,
  owner_id,
  metadata->>'mimetype'
FROM "storage".objects
-- Can only read your own
WHERE owner_id = auth.uid()::text;
$$;

GRANT EXECUTE ON FUNCTION public."app:assets:user:read" TO authenticated;

CREATE OR REPLACE FUNCTION public."admin:assets:user:read"("ownerId" uuid)
RETURNS SETOF public."AssetV1"
STABLE
-- No SECURITY DEFINER, caller is admin
SET search_path = ''
LANGUAGE sql
AS $$    
SELECT 
  id,
  bucket_id,
  name,
  owner_id,
  metadata->>'mimetype'
FROM "storage".objects
-- Admin can read all
WHERE owner_id = "ownerId"::text;
$$;

-- Restrict admin access to service role 
GRANT EXECUTE ON FUNCTION public."admin:assets:user:read" TO service_role;

-- 0_lib/040_profile/1_profile-types.sql


CREATE TYPE public.gender_type AS ENUM (
  'MALE',
  'FEMALE',
  'NON_BINARY'
);
COMMENT ON TYPE public.gender_type IS '
description: Available genders
values:
  MALE: Male gender
  FEMALE: Female gender
  NON_BINARY: Non-binary gender
';

-- 0_lib/040_profile/3_profile-tables.sql

-- Based on https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native
-- Create a table for user profiles
CREATE TABLE IF NOT EXISTS private.profile (
  id uuid NOT NULL primary key REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  username text unique,
  full_name text,
  avatar_url text,
  -- gender_type_id int2 REFERENCES private.gender_type(id),
  gender public.gender_type,
  given_name text, -- use also for "first_name"
  family_name text, -- use also for "last_name"
  birth_date date,

  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Add structured comment with metadata
COMMENT ON COLUMN private.profile.avatar_url IS '
description: URL to user''s profile picture
type: imageUrl
';


-- 0_lib/040_profile/4_profile-funcs.sql


-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.
CREATE OR REPLACE FUNCTION private.handle_new_user() RETURNS trigger
SECURITY DEFINER -- need security definer for RLS
SET "search_path" TO ''
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO private.profile (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');

  INSERT INTO private.entity (id, entity_type, user_id)
  VALUES (NEW.id, 'PERSON', NEW.id);
  RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();

-- 0_lib/040_profile/5_profile-api-types.sql


CREATE TYPE public."ProfileV1" AS (
  id uuid_notnull,
  "createdAt" timestamptz_notnull,
  "updatedAt" timestamptz_notnull,
  username text,
  "fullName" text,
  "avatarUrl" text,
  gender public.gender_type,
  "givenName" text, -- use also for "firstName"
  "familyName" text, -- use also for "lastName"
  "birthDate" date
);

CREATE TYPE public."ProfileWithEmailV1" AS (
  profile public."ProfileV1",
  email public.email
);

CREATE TYPE public."ProfileUpdateV1" AS (
  "updatedAt" timestamptz,
  username text,
  "fullName" text,
  "avatarUrl" text,
  gender public.gender_type,
  "givenName" text,
  "familyName" text,
  "birthDate" date
);

-- 0_lib/040_profile/7_profile-api-funcs.sql



CREATE OR REPLACE FUNCTION public."app:profile:user:read"()
RETURNS public."ProfileV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE sql
AS $$
SELECT p.*
FROM private.profile p
-- Can only read your own
WHERE p.id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public."app:profile:user:read" TO authenticated;

CREATE OR REPLACE FUNCTION public."app:profile:user:readWithEmail"()
RETURNS public."ProfileWithEmailV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  ROW(p.*)::public."ProfileV1",
  u.email
)::public."ProfileWithEmailV1"
FROM private.profile p
INNER JOIN auth.users u ON u.id = p.id
-- Can only read your own
WHERE p.id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public."app:profile:user:readWithEmail" TO authenticated;


CREATE OR REPLACE FUNCTION public."app:profile:user:update"(
  "avatarUrl" text DEFAULT '___UNSET___',
  username TEXT DEFAULT '___UNSET___',
  "fullName" TEXT DEFAULT '___UNSET___',
  "givenName" TEXT DEFAULT '___UNSET___',
  "familyName" TEXT DEFAULT '___UNSET___',
  "birthDate" DATE DEFAULT '1900-01-01'::DATE,
  gender public.gender_type DEFAULT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT '1900-01-01 00:00:00+00'::TIMESTAMPTZ
)
RETURNS public."ProfileV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE sql
AS $$
UPDATE private.profile p SET
  updated_at = CASE WHEN "updatedAt" != '1900-01-01 00:00:00+00'::TIMESTAMPTZ THEN "updatedAt" ELSE CURRENT_TIMESTAMP END,
  username = CASE WHEN username IS DISTINCT FROM '___UNSET___' THEN username ELSE p.username END,
  full_name = CASE WHEN "fullName" IS DISTINCT FROM '___UNSET___' THEN "fullName" ELSE p.full_name END,
  avatar_url = CASE WHEN "avatarUrl" IS DISTINCT FROM '___UNSET___' THEN "avatarUrl" ELSE p.avatar_url END,
  gender = CASE WHEN gender IS NOT NULL THEN gender ELSE p.gender END,
  given_name = CASE WHEN "givenName" IS DISTINCT FROM '___UNSET___' THEN "givenName" ELSE p.given_name END,
  family_name = CASE WHEN "familyName" IS DISTINCT FROM '___UNSET___' THEN "familyName" ELSE p.family_name END,
  birth_date = CASE WHEN "birthDate" != '1900-01-01'::DATE THEN "birthDate" ELSE p.birth_date END
-- Can only update your own
WHERE p.id = auth.uid()
RETURNING *;
$$;

GRANT EXECUTE ON FUNCTION public."app:profile:user:update" TO authenticated;

-- 0_lib/040_profile/8_profile-buckets.sql

INSERT INTO storage.buckets (id, name)
  VALUES ('avatars', 'avatars');

INSERT INTO storage.buckets (id, name)
  VALUES ('app-assets', 'app-assets');


-- Set up access controls for storage.
-- See https://supabase.com/docs/guides/storage/security/access-control#policy-examples for more details.
-- https://www.postgresql.org/docs/current/sql-createpolicy.html
-- Note: these policies don't restrict to specific roles such as 
-- https://supabase.com/docs/guides/database/postgres/roles#supabase-roles
-- TODO: restrict these more to logged-in users by using `TO authenticated`? 
-- https://supabase.com/docs/guides/storage/security/access-control#policy-examples
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload an avatar." ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- The USING expression determines which records the UPDATE command will see to operate against, 
-- while the WITH CHECK expression defines which modified rows are allowed to be stored back into the relation.
CREATE POLICY "Anyone can update their own avatar." ON storage.objects
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = owner_id::uuid) WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "service role has full access to app-assets bucket" ON storage.objects
FOR ALL 
TO service_role
USING (bucket_id = 'app-assets')
WITH CHECK (bucket_id = 'app-assets');

-- 0_lib/060_conversation/3_conv-tables.sql

-- Conversation

CREATE TABLE IF NOT EXISTS private.conversation (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  owner_entity_id UUID NOT NULL REFERENCES private.entity(id) ON DELETE CASCADE,
  subject TEXT
);

-- Conversation Participant

CREATE TABLE IF NOT EXISTS private.conversation_participant (
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  conversation_id uuid NOT NULL REFERENCES private.conversation(id) ON DELETE CASCADE,
  entity_id uuid NOT NULL REFERENCES private.entity(id) ON DELETE CASCADE,
  deactivated_at TIMESTAMPTZ DEFAULT NULL, -- Useful for soft-deleting participants/leaving the conversation, if set to null, user is active

  PRIMARY KEY(conversation_id, entity_id)
);

-- only create index for the entity since we already have one for conversation,entity due to the primary key
CREATE INDEX IF NOT EXISTS conversation_participant_idx_entity_id ON private.conversation_participant(entity_id);

-- Conversation Message

CREATE TABLE IF NOT EXISTS private.conversation_message (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  conversation_id UUID NOT NULL REFERENCES private.conversation(id) ON DELETE CASCADE,
  prev_message_id UUID REFERENCES private.conversation_message(id) ON DELETE CASCADE,
  author_entity_id UUID NOT NULL REFERENCES private.entity(id) ON DELETE CASCADE,
  content_text TEXT,
  context JSONB
);

CREATE INDEX IF NOT EXISTS conversation_message_idx_conversation_id ON private.conversation_message(conversation_id);
CREATE INDEX IF NOT EXISTS conversation_message_idx_prev_message_id ON private.conversation_message(prev_message_id) WHERE prev_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS conversation_message_idx_author_entity_id ON private.conversation_message(author_entity_id);


-- Conversation Message Asset

CREATE TABLE IF NOT EXISTS private.conversation_message_asset (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  conversation_message_id UUID NOT NULL REFERENCES private.conversation_message(id) ON DELETE CASCADE,
  object_id UUID NOT NULL REFERENCES storage.objects(id) ON DELETE CASCADE,
  order_index SMALLINT NOT NULL,

  UNIQUE(conversation_message_id, object_id) -- Ensure only one message per object
);

CREATE INDEX IF NOT EXISTS conversation_message_asset_idx_conversation_message_id ON private.conversation_message_asset(conversation_message_id);
CREATE INDEX IF NOT EXISTS conversation_message_asset_idx_object_id ON private.conversation_message_asset(object_id);

-- 0_lib/060_conversation/5_conv-api-types.sql

CREATE TYPE public."ConversationV1" AS (
  id uuid_notnull,
  "createdAt" timestamptz_notnull,
  "updatedAt" timestamptz_notnull,
  "ownerEntityId" uuid_notnull,
  subject TEXT
);

CREATE TYPE public."ConversationParticipantV1" AS (
  "createdAt" timestamptz_notnull,
  "updatedAt" timestamptz_notnull,
  "conversationId" uuid_notnull,
  "entityId" uuid_notnull,
  "deactivatedAt" TIMESTAMPTZ
);

CREATE TYPE public."ConversationMessageV1" AS (
  id uuid_notnull,
  "createdAt" timestamptz_notnull,
  "updatedAt" timestamptz_notnull,
  "conversationId" uuid_notnull,
  "prevMessageId" uuid,
  "authorEntityId" uuid_notnull,
  "contentText" text,
  context JSONB
);

CREATE TYPE public."ConversationMessageAssetV1" AS (
  id uuid_notnull,
  "createdAt" timestamptz_notnull,
  "updatedAt" timestamptz_notnull,
  "conversationMessageId" uuid_notnull,
  "objectId" uuid_notnull,
  "orderIndex" smallint_notnull
);

CREATE TYPE public."ConversationMessageWithEntityTypeV1" AS (
  message public."ConversationMessageV1",
  "entityType" public.entity_type
);

CREATE TYPE public."ConversationWithMessagesAndEntityTypeV1" AS (
  conversation public."ConversationV1",
  messages public."ConversationMessageWithEntityTypeV1"[]
);

CREATE TYPE public."ConversationMessageAssetWithDetailsV1" AS (
  "objectId" uuid_notnull,
  "orderIndex" smallint_notnull,
  "bucketId" text,
  name text,
  "mimeType" text
);

CREATE TYPE public."ConversationMessageWithDetailsV1" AS (
  message public."ConversationMessageV1",
  "entityType" public.entity_type,
  assets public."ConversationMessageAssetWithDetailsV1"[]
);

CREATE TYPE public."ConversationParticipantWithDetailsV1" AS (
  participant public."ConversationParticipantV1",
  "entityType" public.entity_type,
  profile public."ProfileV1"
);

CREATE TYPE public."ConversationWithContentV1" AS (
  conversation public."ConversationV1",
  messages public."ConversationMessageWithDetailsV1"[],
  participants public."ConversationParticipantWithDetailsV1"[]
);

CREATE TYPE public."ConversationMessageAssetWithObjectV1" AS (
  "objectId" uuid_notnull,
  "orderIndex" smallint_notnull,
  "bucketId" text,
  name text,
  "mimeType" text
);

-- 0_lib/060_conversation/7_conv-api-funcs.sql


-- This function creates a conversation and a list of conversation participants provided.
CREATE OR REPLACE FUNCTION public."admin:conversation:user:create"(
  "authorEntityId" UUID,
  "otherEntityIds" uuid[]
)
RETURNS UUID -- Returns the conversation id
-- No SECURITY DEFINER, admin uses service_role
SET search_path = ''
LANGUAGE plpgsql
AS $$
  DECLARE
    _conversation_id UUID;
  BEGIN

    -- Ensure authorEntityId is provided
    IF "authorEntityId" IS NULL THEN
      RAISE EXCEPTION 'authorEntityId cannot be null';
    END IF;

    -- Ensure authorEntityId exists
    IF NOT EXISTS (
      SELECT 1
      FROM private.entity e
      WHERE e.id = "authorEntityId"
    ) THEN
      RAISE EXCEPTION 'authorEntityId does not exist';
    END IF;

    -- Ensure authorEntityId is not in otherEntityIds
    IF "otherEntityIds" IS NOT NULL AND "otherEntityIds" @> ARRAY["authorEntityId"] THEN
      RAISE EXCEPTION 'authorEntityId cannot be in otherEntityIds';
    END IF;

    -- Ensure otherEntityIds are unique
    IF "otherEntityIds" IS NOT NULL AND array_length("otherEntityIds", 1) <> array_length(ARRAY(SELECT DISTINCT unnest("otherEntityIds")), 1) THEN
      RAISE EXCEPTION 'otherEntityIds must be unique';
    END IF;

    -- Ensure all other entity IDs exist if provided
    -- Ensure all entity IDs exist
    IF "otherEntityIds" IS NOT NULL
       AND array_length("otherEntityIds", 1) > 0
       AND EXISTS (
      SELECT 1
      FROM unnest("otherEntityIds") AS _entity_id
      LEFT JOIN private.entity e ON e.id = _entity_id
      WHERE e.id IS NULL
    ) THEN
      RAISE EXCEPTION 'One or more entity IDs in otherEntityIds do not exist';
    END IF;

    -- Create the conversation (user will be the owner)
    INSERT INTO private.conversation (owner_entity_id)
    VALUES ("authorEntityId")
    RETURNING id INTO _conversation_id;

    -- Add the owner as the first participant (only owner can insert participants)
    INSERT INTO private.conversation_participant (conversation_id, entity_id)
    SELECT _conversation_id, "authorEntityId"
    WHERE EXISTS (
      SELECT 1
      FROM private.conversation c
      WHERE c.id = _conversation_id
        AND c.owner_entity_id = "authorEntityId"
    );

    -- Add the other participants (only owner can insert participants)
    INSERT INTO private.conversation_participant (conversation_id, entity_id)
    SELECT _conversation_id, _other_entity_id
    FROM unnest("otherEntityIds") AS _other_entity_id
    WHERE EXISTS (
      SELECT 1
      FROM private.conversation c
      WHERE c.id = _conversation_id
        AND c.owner_entity_id = "authorEntityId"
    );

    -- Return conversationId
    RETURN _conversation_id;
  END;
$$;

GRANT EXECUTE ON FUNCTION public."admin:conversation:user:create" TO service_role;

-- This function creates a conversation and a list of conversation participants provided.
CREATE OR REPLACE FUNCTION public."app:conversation:user:create"(
  "otherEntityIds" uuid[]
)
RETURNS UUID -- Returns the conversation id
SECURITY DEFINER
SET search_path = ''
LANGUAGE sql
AS $$
  SELECT public."admin:conversation:user:create"(auth.uid(), "otherEntityIds")::UUID;
$$;

GRANT EXECUTE ON FUNCTION public."app:conversation:user:create" TO authenticated;



CREATE OR REPLACE FUNCTION public."app:conversation:message:upsertAllWithAssets"(
  messages public."ConversationMessageV1"[],
  assets public."ConversationMessageAssetV1"[]
)
RETURNS TABLE("messageCount" int, "assetCount" int) ROWS 1
SECURITY DEFINER
SET search_path = ''
LANGUAGE SQL
BEGIN ATOMIC
  INSERT INTO private.conversation_message(
    id,
    created_at,
    updated_at,
    conversation_id,
    prev_message_id,
    author_entity_id,
    content_text,
    context)
  SELECT
    s.id, 
    s."createdAt",
    s."updatedAt",
    s."conversationId",
    s."prevMessageId",
    s."authorEntityId",
    s."contentText",
    s."context"
  FROM unnest(messages) s
  -- Only insert messages where user is an active participant
  WHERE EXISTS (
    SELECT 1
    FROM private.conversation_participant cp
    WHERE cp.conversation_id = s."conversationId"
      AND cp.entity_id = auth.uid()
      AND cp.deactivated_at IS NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at,
    conversation_id = EXCLUDED.conversation_id,
    prev_message_id = EXCLUDED.prev_message_id,
    author_entity_id = EXCLUDED.author_entity_id,
    content_text = EXCLUDED.content_text,
    context = EXCLUDED.context
  -- Only update if user is the original author
  WHERE private.conversation_message.author_entity_id = auth.uid();

  INSERT INTO private.conversation_message_asset(
    id,
    created_at,
    updated_at,
    conversation_message_id,
    object_id,
    order_index)
  SELECT 
    s.id, s."createdAt", s."updatedAt", s."conversationMessageId", s."objectId", s."orderIndex"
  FROM unnest(assets) s
  -- Only insert assets where user is the message author and active participant
  WHERE EXISTS (
    SELECT 1
    FROM private.conversation_message cm
    JOIN private.conversation_participant cp 
      ON cp.conversation_id = cm.conversation_id
    WHERE cm.id = s."conversationMessageId"
      AND cm.author_entity_id = auth.uid()
      AND cp.entity_id = auth.uid()
      AND cp.deactivated_at IS NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at,
    conversation_message_id = EXCLUDED.conversation_message_id,
    object_id = EXCLUDED.object_id,
    order_index = EXCLUDED.order_index
  -- Only update if user is the author of the message
  WHERE EXISTS (
    SELECT 1
    FROM private.conversation_message cm
    WHERE cm.id = private.conversation_message_asset.conversation_message_id
      AND cm.author_entity_id = auth.uid()
  );

  RETURN (array_length(messages, 1), array_length(assets, 1));
END;

GRANT EXECUTE ON FUNCTION public."app:conversation:message:upsertAllWithAssets" TO authenticated;

-- Returns true if the given user is the owner of a given conversation
CREATE OR REPLACE FUNCTION private.check_user_is_conversation_owner(
  "conversationId" uuid, -- The conversation to check
  "userId" uuid          -- The user to check for ownership
)
RETURNS boolean
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE SQL
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM private.conversation c
    WHERE c.id = "conversationId"
      AND c.owner_entity_id = "userId"
  );
$$;

-- Is called by auth user when checking bucket storage RLS 
GRANT EXECUTE ON FUNCTION private.check_user_is_conversation_owner TO authenticated;


-- Returns true if the given user is part of the conversation
CREATE OR REPLACE FUNCTION private.check_user_is_active_conversation_participant(
  "conversationId" uuid, -- The conversation to check
  "userId" uuid          -- The user to check for participation
)
RETURNS boolean
SECURITY DEFINER
SET search_path = ''
LANGUAGE SQL
AS $$
SELECT EXISTS (
  SELECT 1
  FROM private.conversation_participant cp
  WHERE cp.conversation_id = "conversationId"
    AND cp.entity_id = "userId"
    AND cp.deactivated_at IS NULL -- Only active participants
);
$$;

-- Is called by auth user when checking bucket storage RLS 
GRANT EXECUTE ON FUNCTION private.check_user_is_active_conversation_participant TO authenticated;


-- Returns true if the given user is the author of a given message.
CREATE OR REPLACE FUNCTION private.check_is_active_message_author(
  "messageId" uuid,
  "userId" uuid
)
RETURNS boolean
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE SQL
AS $$
SELECT EXISTS (
  SELECT 1
  FROM private.conversation_message cm
  JOIN private.conversation_participant cp ON cm.conversation_id = cp.conversation_id
  WHERE cm.id = "messageId"
    AND cm.author_entity_id = "userId"
    AND cp.entity_id = "userId"
    AND cp.deactivated_at IS NULL -- Only active participants
)
$$;

-- Is called by auth user when checking bucket storage RLS 
GRANT EXECUTE ON FUNCTION private.check_is_active_message_author TO authenticated;


-- we need this function with security definer for the bucket RLS rules - a regular user has no access to private tables
CREATE OR REPLACE FUNCTION private.check_message_not_exists(
  "messageId" uuid
)
RETURNS boolean
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE SQL
AS $$
SELECT NOT EXISTS (
  SELECT 1
  FROM private.conversation_message
  WHERE id = "messageId"
)
$$;

-- Is called by auth user when checking bucket storage RLS 
GRANT EXECUTE ON FUNCTION private.check_message_not_exists TO authenticated;


CREATE OR REPLACE FUNCTION public."app:conversation:message:create"(
  "conversationId" uuid,
  "contentText" text,
  "botEntityId" uuid,
  "prevMessageId" uuid DEFAULT NULL
)
RETURNS public."ConversationMessageV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE sql
AS $$
WITH message_insert AS (
  INSERT INTO private.conversation_message (
    conversation_id,
    author_entity_id,
    content_text,
    prev_message_id,
    created_at,
    updated_at
  )
  SELECT 
    "conversationId",
    "botEntityId",
    "contentText",
    "prevMessageId",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  WHERE EXISTS (
    -- User is the conversation owner
    SELECT 1 
    FROM private.conversation c
    WHERE c.id = "conversationId"
    AND c.owner_entity_id = auth.uid()
  )
  OR EXISTS (
    -- User is an active participant
    SELECT 1
    FROM private.conversation_participant cp
    WHERE cp.conversation_id = "conversationId"
    AND cp.entity_id = auth.uid()
    AND cp.deactivated_at IS NULL
  )
  RETURNING *
)
SELECT ROW(mi.*)::public."ConversationMessageV1"
FROM message_insert mi;
$$;

GRANT EXECUTE ON FUNCTION public."app:conversation:message:create" TO authenticated;


CREATE OR REPLACE FUNCTION public."app:conversation:user:readAll"()
RETURNS SETOF public."ConversationV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT
  c.id,
  c.created_at,
  c.updated_at, 
  c.owner_entity_id,
  c.subject
FROM private.conversation c
WHERE
  -- User owns the conversation
  c.owner_entity_id = auth.uid()
  OR
  -- User is an active participant
  EXISTS (
    SELECT 1 
    FROM private.conversation_participant cp
    WHERE 
      cp.conversation_id = c.id 
      AND cp.entity_id = auth.uid()
      AND cp.deactivated_at IS NULL -- Only active participants
  );
$$;

GRANT EXECUTE ON FUNCTION public."app:conversation:user:readAll" TO authenticated;


-- Exact match: participants must be EXACTLY (auth user + otherEntityIds)
CREATE OR REPLACE FUNCTION public."app:conversation:user:readWithOtherParticipantsExact"(
"otherParticipantEntityIds" uuid[]
)
RETURNS SETOF public."ConversationV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
WITH active_participants AS (
  SELECT 
    cp.conversation_id,
    ARRAY_AGG(DISTINCT cp.entity_id ORDER BY cp.entity_id) AS participant_ids
  FROM private.conversation_participant cp
  WHERE cp.deactivated_at IS NULL
  GROUP BY cp.conversation_id
)
SELECT c.*
FROM private.conversation c
JOIN active_participants ap
  ON ap.conversation_id = c.id
  AND ap.participant_ids = ARRAY(
    SELECT DISTINCT x 
    FROM unnest(ARRAY_APPEND(COALESCE("otherParticipantEntityIds", '{}'::uuid[]), auth.uid())) AS t(x) 
    ORDER BY x
  )
WHERE auth.uid() = ANY(ap.participant_ids);
$$;

GRANT EXECUTE ON FUNCTION public."app:conversation:user:readWithOtherParticipantsExact" TO authenticated;


-- Admin function to read conversation with messages and entity types
CREATE OR REPLACE FUNCTION public."admin:conversation:readWithMessagesAndEntityTypes"("conversationId" uuid)
RETURNS public."ConversationWithMessagesAndEntityTypeV1"
-- No SECURITY DEFINER, caller is admin
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  -- conversation field (wrap existing conversation in composite type)
  ROW(c.*)::public."ConversationV1",
  COALESCE(
    ARRAY(
      SELECT ROW(
        ROW(cm.*)::public."ConversationMessageV1",
        e.entity_type
      )::public."ConversationMessageWithEntityTypeV1"
      FROM private.conversation_message cm
      JOIN private.entity e ON e.id = cm.author_entity_id
      WHERE cm.conversation_id = c.id
      ORDER BY cm.created_at ASC
    ),
    '{}'::public."ConversationMessageWithEntityTypeV1"[]
  )
)::public."ConversationWithMessagesAndEntityTypeV1"
FROM private.conversation c
WHERE c.id = "conversationId"
$$;

GRANT EXECUTE ON FUNCTION public."admin:conversation:readWithMessagesAndEntityTypes" TO service_role;

-- Function to read conversation with messages and entity types
CREATE OR REPLACE FUNCTION public."app:conversation:user:readWithMessagesAndEntityTypes"("conversationId" uuid)
RETURNS public."ConversationWithMessagesAndEntityTypeV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM private.conversation c
      WHERE c.id = "conversationId"
      AND (
        -- User owns the conversation
        c.owner_entity_id = auth.uid()
        OR
        -- User is an active participant
        EXISTS (
          SELECT 1 
          FROM private.conversation_participant cp
          WHERE 
            cp.conversation_id = c.id 
            AND cp.entity_id = auth.uid()
            AND cp.deactivated_at IS NULL -- Only active participants
        )
      )
    ) THEN public."admin:conversation:readWithMessagesAndEntityTypes"("conversationId")
    ELSE NULL
  END;
$$;

GRANT EXECUTE ON FUNCTION public."app:conversation:user:readWithMessagesAndEntityTypes" TO authenticated;


CREATE OR REPLACE FUNCTION public."app:conversation:user:readWithContent"("conversationId" uuid)
RETURNS public."ConversationWithContentV1"
STABLE
SECURITY DEFINER
SET search_path = ''
LANGUAGE sql
AS $$ 
SELECT ROW(
  -- conversation field (wrap existing conversation in composite type)
  ROW(c.*)::public."ConversationV1",
  -- messages array
  COALESCE(
    ARRAY(
      SELECT ROW(
        ROW(cm.*)::public."ConversationMessageV1",
        e.entity_type,
        COALESCE(
          ARRAY(
            SELECT ROW(
              cma.object_id,
              cma.order_index, 
              a.bucket_id,
              a.name,
              a.metadata->>'mimetype'
            )::public."ConversationMessageAssetWithDetailsV1"
            FROM private.conversation_message_asset cma
            JOIN "storage".objects a ON cma.object_id = a.id
            WHERE cma.conversation_message_id = cm.id
            ORDER BY cma.order_index ASC
          ),
          '{}'::public."ConversationMessageAssetWithDetailsV1"[]
        )
      )::public."ConversationMessageWithDetailsV1"
      FROM private.conversation_message cm
      JOIN private.entity e ON cm.author_entity_id = e.id
      WHERE cm.conversation_id = c.id
      ORDER BY cm.created_at ASC
    ),
    '{}'::public."ConversationMessageWithDetailsV1"[]
  ),
  -- participants array
  COALESCE(
    ARRAY(
      SELECT ROW(
        ROW(cp.*)::public."ConversationParticipantV1",
        e.entity_type,
        CASE WHEN p.id IS NOT NULL THEN ROW(p.*)::public."ProfileV1" ELSE NULL END
      )::public."ConversationParticipantWithDetailsV1"
      FROM private.conversation_participant cp
      JOIN private.entity e ON cp.entity_id = e.id
      LEFT JOIN auth.users u ON e.user_id = u.id
      LEFT JOIN private.profile p ON u.id = p.id
      WHERE cp.conversation_id = c.id
    ),
    '{}'::public."ConversationParticipantWithDetailsV1"[]
  )
)::public."ConversationWithContentV1"
FROM private.conversation c
WHERE c.id = "conversationId"
-- Only return conversation if user is owner or active participant
AND (
  -- User owns the conversation
  c.owner_entity_id = auth.uid()
  OR
  -- User is an active participant
  EXISTS (
    SELECT 1 
    FROM private.conversation_participant cp
    WHERE 
      cp.conversation_id = c.id 
      AND cp.entity_id = auth.uid()
      AND cp.deactivated_at IS NULL -- Only active participants
  )
);
$$;

GRANT EXECUTE ON FUNCTION public."app:conversation:user:readWithContent" TO authenticated;

CREATE OR REPLACE FUNCTION public."app:conversation:message:asset:user:readAllWithObject"("conversationMessageId" uuid)
RETURNS SETOF public."ConversationMessageAssetWithObjectV1" 
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT
  cma.object_id,
  cma.order_index,
  a.bucket_id,
  a.name,
  a.metadata->>'mimetype'
FROM private.conversation_message_asset cma
JOIN storage.objects a ON cma.object_id = a.id
JOIN private.conversation_message cm ON cm.id = cma.conversation_message_id
JOIN private.conversation c ON c.id = cm.conversation_id
WHERE cma.conversation_message_id = "conversationMessageId"
-- Only return assets if user is active participant in the conversation
AND (
  -- User owns the conversation
  c.owner_entity_id = auth.uid()
  OR
  -- User is an active participant
  EXISTS (
    SELECT 1 
    FROM private.conversation_participant cp
    WHERE 
      cp.conversation_id = cm.conversation_id 
      AND cp.entity_id = auth.uid()
      AND cp.deactivated_at IS NULL -- Only active participants
  )
)
ORDER BY cma.order_index ASC;
$$;

GRANT EXECUTE ON FUNCTION public."app:conversation:message:asset:user:readAllWithObject" TO authenticated;

-- 0_lib/060_conversation/8_conv-buckets.sql


-- Create objects bucket for conversation assets
INSERT INTO storage.buckets (id, name)
VALUES ('conversations', 'conversations');

-- Storage Access Control Policies (RLS)

-- Only participants can read the conversation message assets
CREATE POLICY "Active Participants can READ all conversation message assets"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'conversations'
    AND
    private.check_user_is_active_conversation_participant(
      ((storage.foldername(name))[1])::uuid, -- conversation id
      (SELECT auth.uid())
    )
  );

-- Only active participants can INSERT assets to non-existing messages they will create the message-id for in the client.
CREATE POLICY "Active Participants can INSERT assets to non-existing messages that they will create soon"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'conversations'
    AND
    -- Make sure the author is still active in the conversation
    private.check_user_is_active_conversation_participant(
      ((storage.foldername(name))[1])::uuid, -- conversation id
      (SELECT auth.uid())
    )
    AND
    (
      -- Make sure the message-id generated by the client does not exist yet
      private.check_message_not_exists(((storage.foldername(name))[2])::uuid)
      OR
      -- Or, if the message-id exists, make sure user is message author and still active
      private.check_is_active_message_author(
        ((storage.foldername(name))[2])::uuid, -- client generated message id
        (SELECT auth.uid())
      )
    )
  );

-- Only message authors can UPDATE the conversation message assets
CREATE POLICY "Active Message Authors can UPDATE assets (not their ownership)"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'conversations'
    AND
    private.check_is_active_message_author(
      ((storage.foldername(name))[2])::uuid, -- message id
      (SELECT auth.uid())
    )
  )
  -- Make sure the author can't change ownership of the asset
  WITH CHECK (
    bucket_id = 'conversations'
    AND
    private.check_is_active_message_author(
      ((storage.foldername(name))[2])::uuid, -- message id
      (SELECT auth.uid())
    )
  );

-- Only active message authors can DELETE the conversation message assets
CREATE POLICY "Active Message authors can DELETE their assets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'conversations'
    AND
    private.check_is_active_message_author(
      ((storage.foldername(name))[2])::uuid, -- message id
      (SELECT auth.uid())
    )
  );

-- Conversation owners can delete all conversation message assets
CREATE POLICY "Conversation Owners can DELETE all conversation message assets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'conversations'
    AND
    private.check_user_is_conversation_owner(
      ((storage.foldername(name))[1])::uuid, -- conversation id
      (SELECT auth.uid())
    )
  );

-- 0_lib/080_social_feed/8_feed-buckets.sql

INSERT INTO storage.buckets (id, name)
  VALUES ('social-feed', 'social-feed');

CREATE POLICY "Social Feed Images are publicly accessible" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'social-feed');

CREATE POLICY "Anyone can upload a photo to the social feed bucket" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'social-feed');

-- The USING expression determines which records the UPDATE command will see to operate against, 
-- while the WITH CHECK expression defines which modified rows are allowed to be stored back into the relation.
CREATE POLICY "Anyone can update their own images in the social feed" ON storage.objects
  FOR UPDATE 
  TO authenticated
  USING ((SELECT auth.uid()) = owner_id::uuid)
  WITH CHECK (bucket_id = 'social-feed');

-- 1_app/100_lumina/1_lumina-types.sql

-- Grade levels for middle school students (ages 11-15)
CREATE TYPE public.grade_level AS ENUM (
  'GRADE_6',
  'GRADE_7',
  'GRADE_8',
  'GRADE_9'
);

COMMENT ON TYPE public.grade_level IS '
description: Grade levels for middle school students
values:
  GRADE_6: Grade 6 (age 11-12)
  GRADE_7: Grade 7 (age 12-13)
  GRADE_8: Grade 8 (age 13-14)
  GRADE_9: Grade 9 (age 14-15)
';

-- Math topics that students can struggle with or master
CREATE TYPE public.math_topic AS ENUM (
  'FRACTIONS',
  'DECIMALS',
  'PERCENTAGES',
  'BASIC_ALGEBRA',
  'WORD_PROBLEMS'
);

COMMENT ON TYPE public.math_topic IS '
description: Math topics for tutoring
values:
  FRACTIONS: Working with fractions and mixed numbers
  DECIMALS: Decimal operations and conversions
  PERCENTAGES: Percentage calculations and applications
  BASIC_ALGEBRA: Variables, expressions, and simple equations
  WORD_PROBLEMS: Translating word problems into math
';

-- Achievement types that students can earn
CREATE TYPE public.achievement_type AS ENUM (
  'FIRST_PROBLEM_SOLVED',
  'FIVE_DAY_STREAK',
  'TEN_DAY_STREAK',
  'THIRTY_DAY_STREAK',
  'FRACTION_MASTER',
  'DECIMAL_MASTER',
  'PERCENTAGE_MASTER',
  'ALGEBRA_MASTER',
  'WORD_PROBLEM_MASTER',
  'TEN_PROBLEMS_SOLVED',
  'FIFTY_PROBLEMS_SOLVED',
  'HUNDRED_PROBLEMS_SOLVED'
);

COMMENT ON TYPE public.achievement_type IS '
description: Achievement badges that students can earn
values:
  FIRST_PROBLEM_SOLVED: Solved your first math problem
  FIVE_DAY_STREAK: Maintained a 5-day learning streak
  TEN_DAY_STREAK: Maintained a 10-day learning streak
  THIRTY_DAY_STREAK: Maintained a 30-day learning streak
  FRACTION_MASTER: Demonstrated mastery in fractions
  DECIMAL_MASTER: Demonstrated mastery in decimals
  PERCENTAGE_MASTER: Demonstrated mastery in percentages
  ALGEBRA_MASTER: Demonstrated mastery in basic algebra
  WORD_PROBLEM_MASTER: Demonstrated mastery in word problems
  TEN_PROBLEMS_SOLVED: Solved 10 problems total
  FIFTY_PROBLEMS_SOLVED: Solved 50 problems total
  HUNDRED_PROBLEMS_SOLVED: Solved 100 problems total
';

-- Problem solving status
CREATE TYPE public.problem_status AS ENUM (
  'SOLVED',
  'IN_PROGRESS',
  'NEEDS_REVIEW'
);

COMMENT ON TYPE public.problem_status IS '
description: Status of a math problem in a conversation
values:
  SOLVED: Problem solved successfully
  IN_PROGRESS: Problem attempted but not completed
  NEEDS_REVIEW: Problem solved but marked for review
';

-- 1_app/100_lumina/3_lumina-tables.sql

-- Lumina-specific profile extension
-- Extends the base profile table with Lumina app specific fields
CREATE TABLE IF NOT EXISTS private.lumina_profile (
  id uuid NOT NULL PRIMARY KEY REFERENCES private.profile(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  grade_level public.grade_level NOT NULL,
  onboarding_completed boolean NOT NULL DEFAULT false
);

-- User learning preferences
CREATE TABLE IF NOT EXISTS private.user_preferences (
  id uuid NOT NULL PRIMARY KEY REFERENCES private.profile(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  struggle_topics public.math_topic[] NOT NULL DEFAULT '{}',
  learning_concerns text,
  notifications_enabled boolean NOT NULL DEFAULT true,
  
  CONSTRAINT struggle_topics_not_empty CHECK (array_length(struggle_topics, 1) >= 1 OR array_length(struggle_topics, 1) IS NULL),
  CONSTRAINT learning_concerns_max_length CHECK (char_length(learning_concerns) <= 100)
);

-- User progress tracking
CREATE TABLE IF NOT EXISTS private.user_progress (
  id uuid NOT NULL PRIMARY KEY REFERENCES private.profile(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  current_streak int NOT NULL DEFAULT 0,
  longest_streak int NOT NULL DEFAULT 0,
  problems_solved_today int NOT NULL DEFAULT 0,
  total_problems_solved int NOT NULL DEFAULT 0,
  last_active_date date,
  
  CONSTRAINT current_streak_non_negative CHECK (current_streak >= 0),
  CONSTRAINT longest_streak_non_negative CHECK (longest_streak >= 0),
  CONSTRAINT problems_solved_today_non_negative CHECK (problems_solved_today >= 0),
  CONSTRAINT total_problems_solved_non_negative CHECK (total_problems_solved >= 0)
);

-- Topic mastery tracking per user per topic
CREATE TABLE IF NOT EXISTS private.topic_mastery (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id uuid NOT NULL REFERENCES private.profile(id) ON DELETE CASCADE,
  topic public.math_topic NOT NULL,
  mastery_percentage real NOT NULL DEFAULT 0,
  problems_attempted int NOT NULL DEFAULT 0,
  problems_correct int NOT NULL DEFAULT 0,
  
  CONSTRAINT mastery_percentage_range CHECK (mastery_percentage >= 0 AND mastery_percentage <= 100),
  CONSTRAINT problems_attempted_non_negative CHECK (problems_attempted >= 0),
  CONSTRAINT problems_correct_non_negative CHECK (problems_correct >= 0),
  UNIQUE(user_id, topic)
);

CREATE INDEX IF NOT EXISTS topic_mastery_idx_user_id ON private.topic_mastery(user_id);

-- User achievements
CREATE TABLE IF NOT EXISTS private.achievement (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id uuid NOT NULL REFERENCES private.profile(id) ON DELETE CASCADE,
  achievement_type public.achievement_type NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_new boolean NOT NULL DEFAULT true,
  
  UNIQUE(user_id, achievement_type)
);

CREATE INDEX IF NOT EXISTS achievement_idx_user_id ON private.achievement(user_id);

-- Lumina-specific conversation extension
-- Extends the base conversation table with Lumina app specific fields
CREATE TABLE IF NOT EXISTS private.lumina_conversation (
  id uuid NOT NULL PRIMARY KEY REFERENCES private.conversation(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  title text,
  topic public.math_topic,
  problem_image_url text,
  status public.problem_status NOT NULL DEFAULT 'IN_PROGRESS',
  
  CONSTRAINT title_max_length CHECK (char_length(title) <= 100)
);

-- Problem attempt tracking
CREATE TABLE IF NOT EXISTS private.problem_attempt (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id uuid NOT NULL REFERENCES private.profile(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES private.conversation(id) ON DELETE SET NULL,
  problem_image_url text NOT NULL,
  extracted_problem text,
  topic public.math_topic,
  was_correct_first_try boolean NOT NULL DEFAULT false,
  processed_locally boolean NOT NULL DEFAULT true,
  processing_time_in_ms int,
  attempted_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT extracted_problem_max_length CHECK (char_length(extracted_problem) <= 500),
  CONSTRAINT processing_time_range CHECK (processing_time_in_ms IS NULL OR (processing_time_in_ms >= 0 AND processing_time_in_ms <= 30000))
);

CREATE INDEX IF NOT EXISTS problem_attempt_idx_user_id ON private.problem_attempt(user_id);
CREATE INDEX IF NOT EXISTS problem_attempt_idx_conversation_id ON private.problem_attempt(conversation_id) WHERE conversation_id IS NOT NULL;

-- Streak history for calendar heatmap
CREATE TABLE IF NOT EXISTS private.streak_history (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id uuid NOT NULL REFERENCES private.profile(id) ON DELETE CASCADE,
  date date NOT NULL,
  problems_solved int NOT NULL DEFAULT 0,
  was_active boolean NOT NULL DEFAULT false,
  
  CONSTRAINT problems_solved_non_negative CHECK (problems_solved >= 0),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS streak_history_idx_user_id ON private.streak_history(user_id);
CREATE INDEX IF NOT EXISTS streak_history_idx_user_date ON private.streak_history(user_id, date);

-- 1_app/100_lumina/5_lumina-api-types.sql

-- Lumina Profile API Type
CREATE TYPE public."LuminaProfileV1" AS (
  id uuid_notnull,
  "createdAt" timestamptz_notnull,
  "updatedAt" timestamptz_notnull,
  "gradeLevel" public.grade_level,
  "onboardingCompleted" bool_notnull
);

-- User Preferences API Type
CREATE TYPE public."UserPreferencesV1" AS (
  id uuid_notnull,
  "createdAt" timestamptz_notnull,
  "updatedAt" timestamptz_notnull,
  "struggleTopics" public.math_topic[],
  "learningConcerns" text,
  "notificationsEnabled" bool_notnull
);

-- User Progress API Type
CREATE TYPE public."UserProgressV1" AS (
  id uuid_notnull,
  "createdAt" timestamptz_notnull,
  "updatedAt" timestamptz_notnull,
  "currentStreak" int_notnull,
  "longestStreak" int_notnull,
  "problemsSolvedToday" int_notnull,
  "totalProblemsSolved" int_notnull,
  "lastActiveDate" date
);

-- Topic Mastery API Type
CREATE TYPE public."TopicMasteryV1" AS (
  id uuid_notnull,
  "createdAt" timestamptz_notnull,
  "updatedAt" timestamptz_notnull,
  "userId" uuid_notnull,
  topic public.math_topic,
  "masteryPercentage" float4_notnull,
  "problemsAttempted" int_notnull,
  "problemsCorrect" int_notnull
);

-- Achievement API Type
CREATE TYPE public."AchievementV1" AS (
  id uuid_notnull,
  "createdAt" timestamptz_notnull,
  "updatedAt" timestamptz_notnull,
  "userId" uuid_notnull,
  "achievementType" public.achievement_type,
  "earnedAt" timestamptz_notnull,
  "isNew" bool_notnull
);

-- Lumina Conversation API Type
CREATE TYPE public."LuminaConversationV1" AS (
  id uuid_notnull,
  "createdAt" timestamptz_notnull,
  "updatedAt" timestamptz_notnull,
  title text,
  topic public.math_topic,
  "problemImageUrl" text,
  status public.problem_status
);

-- Problem Attempt API Type
CREATE TYPE public."ProblemAttemptV1" AS (
  id uuid_notnull,
  "createdAt" timestamptz_notnull,
  "updatedAt" timestamptz_notnull,
  "userId" uuid_notnull,
  "conversationId" uuid,
  "problemImageUrl" text,
  "extractedProblem" text,
  topic public.math_topic,
  "wasCorrectFirstTry" bool_notnull,
  "processedLocally" bool_notnull,
  "processingTimeInMs" int,
  "attemptedAt" timestamptz_notnull
);

-- Streak History API Type
CREATE TYPE public."StreakHistoryV1" AS (
  id uuid_notnull,
  "createdAt" timestamptz_notnull,
  "updatedAt" timestamptz_notnull,
  "userId" uuid_notnull,
  date date_notnull,
  "problemsSolved" int_notnull,
  "wasActive" bool_notnull
);

-- Combined profile with Lumina data
CREATE TYPE public."ProfileWithLuminaV1" AS (
  profile public."ProfileV1",
  "luminaProfile" public."LuminaProfileV1",
  preferences public."UserPreferencesV1",
  progress public."UserProgressV1"
);

-- Conversation with Lumina extension
CREATE TYPE public."ConversationWithLuminaV1" AS (
  conversation public."ConversationV1",
  "luminaData" public."LuminaConversationV1"
);

-- Home screen data bundle
CREATE TYPE public."LuminaHomeDataV1" AS (
  "givenName" text,
  "currentStreak" int_notnull,
  "problemsSolvedToday" int_notnull,
  "recentConversations" public."ConversationWithLuminaV1"[]
);

-- Progress screen data bundle
CREATE TYPE public."LuminaProgressDataV1" AS (
  progress public."UserProgressV1",
  achievements public."AchievementV1"[],
  "topicMasteries" public."TopicMasteryV1"[],
  "streakHistory" public."StreakHistoryV1"[]
);

-- Conversation history item for chat list screen
CREATE TYPE public."ConversationHistoryItemV1" AS (
  id uuid_notnull,
  "createdAt" timestamptz_notnull,
  "updatedAt" timestamptz_notnull,
  topic public.math_topic,
  "problemImageUrl" text,
  status public.problem_status,
  "previewText" text
);

-- 1_app/100_lumina/7_lumina-api-funcs.sql

-- =====================
-- LUMINA PROFILE FUNCTIONS
-- =====================

-- Read Lumina profile for current user
CREATE OR REPLACE FUNCTION public."app:lumina:profile:read"()
RETURNS public."LuminaProfileV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  lp.id,
  lp.created_at,
  lp.updated_at,
  lp.grade_level,
  lp.onboarding_completed
)::public."LuminaProfileV1"
FROM private.lumina_profile lp
WHERE lp.id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:profile:read" TO authenticated;

-- Create or update Lumina profile
CREATE OR REPLACE FUNCTION public."app:lumina:profile:upsert"(
  "gradeLevel" public.grade_level,
  "onboardingCompleted" boolean DEFAULT false
)
RETURNS public."LuminaProfileV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  _result public."LuminaProfileV1";
BEGIN
  IF "gradeLevel" IS NULL THEN
    RAISE EXCEPTION 'gradeLevel cannot be null';
  END IF;
  
  INSERT INTO private.lumina_profile (id, grade_level, onboarding_completed)
  VALUES (auth.uid(), "gradeLevel", COALESCE("onboardingCompleted", false))
  ON CONFLICT (id) DO UPDATE SET
    grade_level = EXCLUDED.grade_level,
    onboarding_completed = EXCLUDED.onboarding_completed,
    updated_at = CURRENT_TIMESTAMP
  RETURNING ROW(
    id,
    created_at,
    updated_at,
    grade_level,
    onboarding_completed
  )::public."LuminaProfileV1"
  INTO _result;
  
  RETURN _result;
END;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:profile:upsert" TO authenticated;

-- Update onboarding completed status
CREATE OR REPLACE FUNCTION public."app:lumina:profile:completeOnboarding"()
RETURNS public."LuminaProfileV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE sql
AS $$
UPDATE private.lumina_profile
SET onboarding_completed = true, updated_at = CURRENT_TIMESTAMP
WHERE id = auth.uid()
RETURNING ROW(
  id,
  created_at,
  updated_at,
  grade_level,
  onboarding_completed
)::public."LuminaProfileV1";
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:profile:completeOnboarding" TO authenticated;

-- =====================
-- USER PREFERENCES FUNCTIONS
-- =====================

-- Read user preferences
CREATE OR REPLACE FUNCTION public."app:lumina:preferences:read"()
RETURNS public."UserPreferencesV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  up.id,
  up.created_at,
  up.updated_at,
  up.struggle_topics,
  up.learning_concerns,
  up.notifications_enabled
)::public."UserPreferencesV1"
FROM private.user_preferences up
WHERE up.id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:preferences:read" TO authenticated;

-- Create or update user preferences
CREATE OR REPLACE FUNCTION public."app:lumina:preferences:upsert"(
  "struggleTopics" public.math_topic[],
  "learningConcerns" text DEFAULT NULL,
  "notificationsEnabled" boolean DEFAULT true
)
RETURNS public."UserPreferencesV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE sql
AS $$
INSERT INTO private.user_preferences (id, struggle_topics, learning_concerns, notifications_enabled)
VALUES (auth.uid(), COALESCE("struggleTopics", '{}'::public.math_topic[]), "learningConcerns", COALESCE("notificationsEnabled", true))
ON CONFLICT (id) DO UPDATE SET
  struggle_topics = EXCLUDED.struggle_topics,
  learning_concerns = EXCLUDED.learning_concerns,
  notifications_enabled = EXCLUDED.notifications_enabled,
  updated_at = CURRENT_TIMESTAMP
RETURNING ROW(
  id,
  created_at,
  updated_at,
  struggle_topics,
  learning_concerns,
  notifications_enabled
)::public."UserPreferencesV1";
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:preferences:upsert" TO authenticated;

-- =====================
-- USER PROGRESS FUNCTIONS
-- =====================

-- Read user progress
CREATE OR REPLACE FUNCTION public."app:lumina:progress:read"()
RETURNS public."UserProgressV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  up.id,
  up.created_at,
  up.updated_at,
  up.current_streak,
  up.longest_streak,
  up.problems_solved_today,
  up.total_problems_solved,
  up.last_active_date
)::public."UserProgressV1"
FROM private.user_progress up
WHERE up.id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:progress:read" TO authenticated;

-- Initialize user progress (called during onboarding)
CREATE OR REPLACE FUNCTION public."app:lumina:progress:init"()
RETURNS public."UserProgressV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE sql
AS $$
INSERT INTO private.user_progress (id)
VALUES (auth.uid())
ON CONFLICT (id) DO NOTHING
RETURNING ROW(
  id,
  created_at,
  updated_at,
  current_streak,
  longest_streak,
  problems_solved_today,
  total_problems_solved,
  last_active_date
)::public."UserProgressV1";
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:progress:init" TO authenticated;

-- Record a problem solved (updates progress and streak)
CREATE OR REPLACE FUNCTION public."app:lumina:progress:recordProblemSolved"()
RETURNS public."UserProgressV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  _today date NOT NULL := CURRENT_DATE;
  _result public."UserProgressV1";
  _last_active date;
  _new_streak int;
BEGIN
  -- Get current last active date
  SELECT last_active_date INTO _last_active
  FROM private.user_progress
  WHERE id = auth.uid();

  -- Calculate new streak
  IF _last_active IS NULL OR _last_active < _today - 1 THEN
    _new_streak := 1;
  ELSIF _last_active = _today - 1 THEN
    SELECT current_streak + 1 INTO _new_streak
    FROM private.user_progress
    WHERE id = auth.uid();
  ELSE
    SELECT current_streak INTO _new_streak
    FROM private.user_progress
    WHERE id = auth.uid();
  END IF;

  -- Update progress
  UPDATE private.user_progress
  SET
    current_streak = _new_streak,
    longest_streak = GREATEST(longest_streak, _new_streak),
    problems_solved_today = CASE 
      WHEN last_active_date = _today THEN problems_solved_today + 1
      ELSE 1
    END,
    total_problems_solved = total_problems_solved + 1,
    last_active_date = _today,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = auth.uid()
  RETURNING ROW(
    id,
    created_at,
    updated_at,
    current_streak,
    longest_streak,
    problems_solved_today,
    total_problems_solved,
    last_active_date
  )::public."UserProgressV1" INTO _result;

  -- Update or insert streak history
  INSERT INTO private.streak_history (user_id, date, problems_solved, was_active)
  VALUES (auth.uid(), _today, 1, true)
  ON CONFLICT (user_id, date) DO UPDATE SET
    problems_solved = private.streak_history.problems_solved + 1,
    was_active = true,
    updated_at = CURRENT_TIMESTAMP;

  RETURN _result;
END;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:progress:recordProblemSolved" TO authenticated;

-- =====================
-- TOPIC MASTERY FUNCTIONS
-- =====================

-- Read all topic masteries for current user
CREATE OR REPLACE FUNCTION public."app:lumina:topicMastery:readAll"()
RETURNS SETOF public."TopicMasteryV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  tm.id,
  tm.created_at,
  tm.updated_at,
  tm.user_id,
  tm.topic,
  tm.mastery_percentage,
  tm.problems_attempted,
  tm.problems_correct
)::public."TopicMasteryV1"
FROM private.topic_mastery tm
WHERE tm.user_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:topicMastery:readAll" TO authenticated;

-- Update topic mastery after problem attempt
CREATE OR REPLACE FUNCTION public."app:lumina:topicMastery:recordAttempt"(
  "topic" public.math_topic,
  "wasCorrect" boolean
)
RETURNS public."TopicMasteryV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  _result public."TopicMasteryV1";
BEGIN
  IF "topic" IS NULL THEN
    RAISE EXCEPTION 'topic cannot be null';
  END IF;
  
  INSERT INTO private.topic_mastery (user_id, topic, problems_attempted, problems_correct, mastery_percentage)
  VALUES (
    auth.uid(),
    "topic",
    1,
    CASE WHEN "wasCorrect" THEN 1 ELSE 0 END,
    CASE WHEN "wasCorrect" THEN 100.0 ELSE 0.0 END
  )
  ON CONFLICT (user_id, topic) DO UPDATE SET
    problems_attempted = private.topic_mastery.problems_attempted + 1,
    problems_correct = private.topic_mastery.problems_correct + CASE WHEN "wasCorrect" THEN 1 ELSE 0 END,
    mastery_percentage = (
      (private.topic_mastery.problems_correct + CASE WHEN "wasCorrect" THEN 1 ELSE 0 END)::real /
      (private.topic_mastery.problems_attempted + 1)::real
    ) * 100.0,
    updated_at = CURRENT_TIMESTAMP
  RETURNING ROW(
    id,
    created_at,
    updated_at,
    user_id,
    topic,
    mastery_percentage,
    problems_attempted,
    problems_correct
  )::public."TopicMasteryV1"
  INTO _result;
  
  RETURN _result;
END;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:topicMastery:recordAttempt" TO authenticated;

-- =====================
-- ACHIEVEMENT FUNCTIONS
-- =====================

-- Read all achievements for current user
CREATE OR REPLACE FUNCTION public."app:lumina:achievement:readAll"()
RETURNS SETOF public."AchievementV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  a.id,
  a.created_at,
  a.updated_at,
  a.user_id,
  a.achievement_type,
  a.earned_at,
  a.is_new
)::public."AchievementV1"
FROM private.achievement a
WHERE a.user_id = auth.uid()
ORDER BY a.earned_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:achievement:readAll" TO authenticated;

-- Award an achievement
CREATE OR REPLACE FUNCTION public."app:lumina:achievement:award"(
  "achievementType" public.achievement_type
)
RETURNS public."AchievementV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  _result public."AchievementV1";
BEGIN
  IF "achievementType" IS NULL THEN
    RETURN NULL;
  END IF;
  
  INSERT INTO private.achievement (user_id, achievement_type)
  VALUES (auth.uid(), "achievementType")
  ON CONFLICT (user_id, achievement_type) DO NOTHING
  RETURNING ROW(
    id,
    created_at,
    updated_at,
    user_id,
    achievement_type,
    earned_at,
    is_new
  )::public."AchievementV1"
  INTO _result;
  
  RETURN _result;
END;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:achievement:award" TO authenticated;

-- Mark achievement as viewed
CREATE OR REPLACE FUNCTION public."app:lumina:achievement:markViewed"(
  "achievementId" uuid
)
RETURNS public."AchievementV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE sql
AS $$
UPDATE private.achievement
SET is_new = false, updated_at = CURRENT_TIMESTAMP
WHERE id = "achievementId" AND user_id = auth.uid()
RETURNING ROW(
  id,
  created_at,
  updated_at,
  user_id,
  achievement_type,
  earned_at,
  is_new
)::public."AchievementV1";
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:achievement:markViewed" TO authenticated;

-- =====================
-- LUMINA CONVERSATION FUNCTIONS
-- =====================

-- Read Lumina conversation data
CREATE OR REPLACE FUNCTION public."app:lumina:conversation:read"(
  "conversationId" uuid
)
RETURNS public."LuminaConversationV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  lc.id,
  lc.created_at,
  lc.updated_at,
  lc.title,
  lc.topic,
  lc.problem_image_url,
  lc.status
)::public."LuminaConversationV1"
FROM private.lumina_conversation lc
JOIN private.conversation c ON c.id = lc.id
WHERE lc.id = "conversationId"
AND (
  c.owner_entity_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM private.conversation_participant cp
    WHERE cp.conversation_id = c.id
    AND cp.entity_id = auth.uid()
    AND cp.deactivated_at IS NULL
  )
);
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:conversation:read" TO authenticated;

-- Create or update Lumina conversation data
CREATE OR REPLACE FUNCTION public."app:lumina:conversation:upsert"(
  "conversationId" uuid,
  "title" text DEFAULT NULL,
  "topic" public.math_topic DEFAULT NULL,
  "problemImageUrl" text DEFAULT NULL,
  "status" public.problem_status DEFAULT 'IN_PROGRESS'
)
RETURNS public."LuminaConversationV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  _result public."LuminaConversationV1";
BEGIN
  IF "conversationId" IS NULL THEN
    RETURN NULL;
  END IF;
  
  INSERT INTO private.lumina_conversation (id, title, topic, problem_image_url, status)
  SELECT "conversationId", "title", "topic", "problemImageUrl", COALESCE("status", 'IN_PROGRESS'::public.problem_status)
  WHERE EXISTS (
    SELECT 1 FROM private.conversation c
    WHERE c.id = "conversationId"
    AND (
      c.owner_entity_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM private.conversation_participant cp
        WHERE cp.conversation_id = c.id
        AND cp.entity_id = auth.uid()
        AND cp.deactivated_at IS NULL
      )
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    title = COALESCE(EXCLUDED.title, private.lumina_conversation.title),
    topic = COALESCE(EXCLUDED.topic, private.lumina_conversation.topic),
    problem_image_url = COALESCE(EXCLUDED.problem_image_url, private.lumina_conversation.problem_image_url),
    status = COALESCE(EXCLUDED.status, private.lumina_conversation.status),
    updated_at = CURRENT_TIMESTAMP
  RETURNING ROW(
    id,
    created_at,
    updated_at,
    title,
    topic,
    problem_image_url,
    status
  )::public."LuminaConversationV1"
  INTO _result;
  
  RETURN _result;
END;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:conversation:upsert" TO authenticated;

-- Read all conversations with Lumina data for current user
CREATE OR REPLACE FUNCTION public."app:lumina:conversation:readAll"()
RETURNS SETOF public."ConversationWithLuminaV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  ROW(c.*)::public."ConversationV1",
  CASE WHEN lc.id IS NOT NULL THEN
    (SELECT ROW(
      ilc.id,
      ilc.created_at,
      ilc.updated_at,
      ilc.title,
      ilc.topic,
      ilc.problem_image_url,
      ilc.status
    )::public."LuminaConversationV1"
    FROM private.lumina_conversation ilc
    WHERE ilc.id = c.id)
  ELSE NULL
  END
)::public."ConversationWithLuminaV1"
FROM private.conversation c
LEFT JOIN private.lumina_conversation lc ON lc.id = c.id
WHERE c.owner_entity_id = auth.uid()
OR EXISTS (
  SELECT 1 FROM private.conversation_participant cp
  WHERE cp.conversation_id = c.id
  AND cp.entity_id = auth.uid()
  AND cp.deactivated_at IS NULL
)
ORDER BY c.updated_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:conversation:readAll" TO authenticated;

-- =====================
-- PROBLEM ATTEMPT FUNCTIONS
-- =====================

-- Create a problem attempt
CREATE OR REPLACE FUNCTION public."app:lumina:problemAttempt:create"(
  "problemImageUrl" text,
  "conversationId" uuid DEFAULT NULL,
  "extractedProblem" text DEFAULT NULL,
  "topic" public.math_topic DEFAULT NULL,
  "wasCorrectFirstTry" boolean DEFAULT false,
  "processedLocally" boolean DEFAULT true,
  "processingTimeInMs" int DEFAULT NULL
)
RETURNS public."ProblemAttemptV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  _result public."ProblemAttemptV1";
BEGIN
  IF "problemImageUrl" IS NULL THEN
    RAISE EXCEPTION 'problemImageUrl cannot be null';
  END IF;
  
  INSERT INTO private.problem_attempt (
    user_id,
    conversation_id,
    problem_image_url,
    extracted_problem,
    topic,
    was_correct_first_try,
    processed_locally,
    processing_time_in_ms
  )
  VALUES (
    auth.uid(),
    "conversationId",
    "problemImageUrl",
    "extractedProblem",
    "topic",
    COALESCE("wasCorrectFirstTry", false),
    COALESCE("processedLocally", true),
    "processingTimeInMs"
  )
  RETURNING ROW(
    id,
    created_at,
    updated_at,
    user_id,
    conversation_id,
    problem_image_url,
    extracted_problem,
    topic,
    was_correct_first_try,
    processed_locally,
    processing_time_in_ms,
    attempted_at
  )::public."ProblemAttemptV1"
  INTO _result;
  
  RETURN _result;
END;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:problemAttempt:create" TO authenticated;

-- Read recent problem attempts
CREATE OR REPLACE FUNCTION public."app:lumina:problemAttempt:readRecent"(
  "limit" int DEFAULT 10
)
RETURNS SETOF public."ProblemAttemptV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  pa.id,
  pa.created_at,
  pa.updated_at,
  pa.user_id,
  pa.conversation_id,
  pa.problem_image_url,
  pa.extracted_problem,
  pa.topic,
  pa.was_correct_first_try,
  pa.processed_locally,
  pa.processing_time_in_ms,
  pa.attempted_at
)::public."ProblemAttemptV1"
FROM private.problem_attempt pa
WHERE pa.user_id = auth.uid()
ORDER BY pa.attempted_at DESC
LIMIT "limit";
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:problemAttempt:readRecent" TO authenticated;

-- =====================
-- STREAK HISTORY FUNCTIONS
-- =====================

-- Read streak history for date range
CREATE OR REPLACE FUNCTION public."app:lumina:streakHistory:read"(
  "startDate" date DEFAULT CURRENT_DATE - 30,
  "endDate" date DEFAULT CURRENT_DATE
)
RETURNS SETOF public."StreakHistoryV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  sh.id,
  sh.created_at,
  sh.updated_at,
  sh.user_id,
  sh.date,
  sh.problems_solved,
  sh.was_active
)::public."StreakHistoryV1"
FROM private.streak_history sh
WHERE sh.user_id = auth.uid()
AND sh.date >= "startDate"
AND sh.date <= "endDate"
ORDER BY sh.date ASC;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:streakHistory:read" TO authenticated;

-- =====================
-- COMBINED DATA FUNCTIONS
-- =====================

-- Get home screen data bundle
CREATE OR REPLACE FUNCTION public."app:lumina:home:read"()
RETURNS public."LuminaHomeDataV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  (SELECT p.given_name FROM private.profile p WHERE p.id = auth.uid()),
  COALESCE((SELECT up.current_streak FROM private.user_progress up WHERE up.id = auth.uid()), 0),
  COALESCE((SELECT up.problems_solved_today FROM private.user_progress up WHERE up.id = auth.uid()), 0),
  COALESCE(
    ARRAY(
      SELECT ROW(
        ROW(c.*)::public."ConversationV1",
        CASE WHEN lc.id IS NOT NULL THEN
          (SELECT ROW(
            ilc.id,
            ilc.created_at,
            ilc.updated_at,
            ilc.title,
            ilc.topic,
            ilc.problem_image_url,
            ilc.status
          )::public."LuminaConversationV1"
          FROM private.lumina_conversation ilc
          WHERE ilc.id = c.id)
        ELSE NULL
        END
      )::public."ConversationWithLuminaV1"
      FROM private.conversation c
      LEFT JOIN private.lumina_conversation lc ON lc.id = c.id
      WHERE c.owner_entity_id = auth.uid()
      ORDER BY c.updated_at DESC
      LIMIT 3
    ),
    '{}'::public."ConversationWithLuminaV1"[]
  )
)::public."LuminaHomeDataV1";
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:home:read" TO authenticated;

-- Get progress screen data bundle
CREATE OR REPLACE FUNCTION public."app:lumina:progressData:read"()
RETURNS public."LuminaProgressDataV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  (SELECT ROW(up.*)::public."UserProgressV1" FROM private.user_progress up WHERE up.id = auth.uid()),
  COALESCE(
    ARRAY(
      SELECT ROW(
        a.id,
        a.created_at,
        a.updated_at,
        a.user_id,
        a.achievement_type,
        a.earned_at,
        a.is_new
      )::public."AchievementV1"
      FROM private.achievement a
      WHERE a.user_id = auth.uid()
      ORDER BY a.earned_at DESC
    ),
    '{}'::public."AchievementV1"[]
  ),
  COALESCE(
    ARRAY(
      SELECT ROW(
        tm.id,
        tm.created_at,
        tm.updated_at,
        tm.user_id,
        tm.topic,
        tm.mastery_percentage,
        tm.problems_attempted,
        tm.problems_correct
      )::public."TopicMasteryV1"
      FROM private.topic_mastery tm
      WHERE tm.user_id = auth.uid()
    ),
    '{}'::public."TopicMasteryV1"[]
  ),
  COALESCE(
    ARRAY(
      SELECT ROW(
        sh.id,
        sh.created_at,
        sh.updated_at,
        sh.user_id,
        sh.date,
        sh.problems_solved,
        sh.was_active
      )::public."StreakHistoryV1"
      FROM private.streak_history sh
      WHERE sh.user_id = auth.uid()
      AND sh.date >= CURRENT_DATE - 30
      ORDER BY sh.date ASC
    ),
    '{}'::public."StreakHistoryV1"[]
  )
)::public."LuminaProgressDataV1";
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:progressData:read" TO authenticated;

-- Complete onboarding (creates all necessary records)
CREATE OR REPLACE FUNCTION public."app:lumina:onboarding:complete"(
  "givenName" text,
  "gradeLevel" public.grade_level,
  "struggleTopics" public.math_topic[],
  "learningConcerns" text DEFAULT NULL
)
RETURNS public."ProfileWithLuminaV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  _profile public."ProfileV1";
  _lumina_profile public."LuminaProfileV1";
  _preferences public."UserPreferencesV1";
  _progress public."UserProgressV1";
BEGIN
  -- Update base profile with given name
  UPDATE private.profile
  SET given_name = "givenName", updated_at = CURRENT_TIMESTAMP
  WHERE id = auth.uid()
  RETURNING ROW(id, created_at, updated_at, username, full_name, avatar_url, gender, given_name, family_name, birth_date)::public."ProfileV1"
  INTO _profile;

  -- Create/update Lumina profile
  INSERT INTO private.lumina_profile (id, grade_level, onboarding_completed)
  VALUES (auth.uid(), "gradeLevel", true)
  ON CONFLICT (id) DO UPDATE SET
    grade_level = EXCLUDED.grade_level,
    onboarding_completed = true,
    updated_at = CURRENT_TIMESTAMP
  RETURNING ROW(id, created_at, updated_at, grade_level, onboarding_completed)::public."LuminaProfileV1"
  INTO _lumina_profile;

  -- Create/update preferences
  INSERT INTO private.user_preferences (id, struggle_topics, learning_concerns, notifications_enabled)
  VALUES (auth.uid(), "struggleTopics", "learningConcerns", true)
  ON CONFLICT (id) DO UPDATE SET
    struggle_topics = EXCLUDED.struggle_topics,
    learning_concerns = EXCLUDED.learning_concerns,
    updated_at = CURRENT_TIMESTAMP
  RETURNING ROW(id, created_at, updated_at, struggle_topics, learning_concerns, notifications_enabled)::public."UserPreferencesV1"
  INTO _preferences;

  -- Initialize progress
  INSERT INTO private.user_progress (id)
  VALUES (auth.uid())
  ON CONFLICT (id) DO NOTHING;

  SELECT ROW(id, created_at, updated_at, current_streak, longest_streak, problems_solved_today, total_problems_solved, last_active_date)::public."UserProgressV1"
  INTO _progress
  FROM private.user_progress
  WHERE id = auth.uid();

  RETURN ROW(_profile, _lumina_profile, _preferences, _progress)::public."ProfileWithLuminaV1";
END;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:onboarding:complete" TO authenticated;

-- Check if onboarding is completed
CREATE OR REPLACE FUNCTION public."app:lumina:onboarding:isCompleted"()
RETURNS boolean
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT COALESCE(
  (SELECT onboarding_completed FROM private.lumina_profile WHERE id = auth.uid()),
  false
);
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:onboarding:isCompleted" TO authenticated;

-- Read all conversations with preview text for chat history screen
CREATE OR REPLACE FUNCTION public."app:lumina:conversation:readAllWithPreview"()
RETURNS SETOF public."ConversationHistoryItemV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  c.id,
  c.created_at,
  c.updated_at,
  lc.topic,
  lc.problem_image_url,
  COALESCE(lc.status, 'IN_PROGRESS'::public.problem_status),
  (
    SELECT cm.content_text
    FROM private.conversation_message cm
    WHERE cm.conversation_id = c.id
    ORDER BY cm.created_at ASC
    LIMIT 1
  )
)::public."ConversationHistoryItemV1"
FROM private.conversation c
LEFT JOIN private.lumina_conversation lc ON lc.id = c.id
WHERE c.owner_entity_id = auth.uid()
OR EXISTS (
  SELECT 1 FROM private.conversation_participant cp
  WHERE cp.conversation_id = c.id
  AND cp.entity_id = auth.uid()
  AND cp.deactivated_at IS NULL
)
ORDER BY c.updated_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:conversation:readAllWithPreview" TO authenticated;

-- Delete a conversation (only owner can delete)
CREATE OR REPLACE FUNCTION public."app:lumina:conversation:delete"(
  "conversationId" uuid
)
RETURNS boolean
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  _deleted boolean;
BEGIN
  IF "conversationId" IS NULL THEN
    RETURN false;
  END IF;

  -- Only allow owner to delete
  DELETE FROM private.conversation
  WHERE id = "conversationId"
  AND owner_entity_id = auth.uid();

  GET DIAGNOSTICS _deleted = ROW_COUNT;
  RETURN _deleted > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public."app:lumina:conversation:delete" TO authenticated;
