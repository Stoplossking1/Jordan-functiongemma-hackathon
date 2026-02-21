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
