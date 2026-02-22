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

