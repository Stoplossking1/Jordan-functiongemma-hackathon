CREATE TYPE public."AssetV1" AS (
  id uuid_notnull,
  "bucketId" text,
  name text,
  "ownerId" text,
  "mimeType" text
);

