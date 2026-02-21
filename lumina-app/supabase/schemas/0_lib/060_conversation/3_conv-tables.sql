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
