
CREATE OR REPLACE FUNCTION public."app:assets:user:read"()
RETURNS SETOF public."AssetV1"
STABLE
SECURITY DEFINER
SET search_path = ''
LANGUAGE sql
AS $$    
SELECT 
  id,
  bucket_id,
  name,
  owner_id,
  metadata->>'mimetype'
FROM "storage".objects
-- Can only read your own
WHERE owner_id = auth.uid()::text;
$$;

GRANT EXECUTE ON FUNCTION public."app:assets:user:read" TO authenticated;

CREATE OR REPLACE FUNCTION public."admin:assets:user:read"("ownerId" uuid)
RETURNS SETOF public."AssetV1"
STABLE
-- No SECURITY DEFINER, caller is admin
SET search_path = ''
LANGUAGE sql
AS $$    
SELECT 
  id,
  bucket_id,
  name,
  owner_id,
  metadata->>'mimetype'
FROM "storage".objects
-- Admin can read all
WHERE owner_id = "ownerId"::text;
$$;

-- Restrict admin access to service role 
GRANT EXECUTE ON FUNCTION public."admin:assets:user:read" TO service_role;
