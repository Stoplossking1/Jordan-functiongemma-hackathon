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
