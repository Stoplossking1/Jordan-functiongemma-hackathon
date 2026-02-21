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