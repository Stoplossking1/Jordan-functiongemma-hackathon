
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
