
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
