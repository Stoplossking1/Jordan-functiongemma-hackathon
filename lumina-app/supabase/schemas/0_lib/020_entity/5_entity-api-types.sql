CREATE TYPE public."EntityV1" AS (
  id uuid_notnull,
  "createdAt" timestamptz_notnull,
  "updatedAt" timestamptz_notnull,
  "entityType" public.entity_type,
  "userId" uuid,
  name text
);
