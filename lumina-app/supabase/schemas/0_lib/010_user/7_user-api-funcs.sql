-- Method to be called by the client to delete user related data
CREATE OR REPLACE FUNCTION public."admin:user:deleteRelatedData"(
  "userId" UUID
)
RETURNS void
-- No SECURITY DEFINER, caller is admin
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete organization
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'private' 
      AND table_name = 'organization'
  ) THEN
    DELETE FROM private.organization
    WHERE owner_entity_id = "userId";

    DELETE FROM private.organization_membership
    WHERE entity_id = "userId";
  END IF;

  -- Delete entity
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'private'
      AND table_name = 'entity'
  ) THEN
    DELETE FROM private.entity
    WHERE user_id = "userId";
  END IF;

  -- Delete profile
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'private'
      AND table_name = 'profile'
  ) THEN
    DELETE FROM private.profile
    WHERE id = "userId";
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public."admin:user:deleteRelatedData" TO service_role;
