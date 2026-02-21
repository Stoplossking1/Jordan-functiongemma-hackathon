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
