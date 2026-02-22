

CREATE OR REPLACE FUNCTION public."app:profile:user:read"()
RETURNS public."ProfileV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE sql
AS $$
SELECT p.*
FROM private.profile p
-- Can only read your own
WHERE p.id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public."app:profile:user:read" TO authenticated;

CREATE OR REPLACE FUNCTION public."app:profile:user:readWithEmail"()
RETURNS public."ProfileWithEmailV1"
SECURITY DEFINER
SET search_path = ''
STABLE
LANGUAGE sql
AS $$
SELECT ROW(
  ROW(p.*)::public."ProfileV1",
  u.email
)::public."ProfileWithEmailV1"
FROM private.profile p
INNER JOIN auth.users u ON u.id = p.id
-- Can only read your own
WHERE p.id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public."app:profile:user:readWithEmail" TO authenticated;


CREATE OR REPLACE FUNCTION public."app:profile:user:update"(
  "avatarUrl" text DEFAULT '___UNSET___',
  username TEXT DEFAULT '___UNSET___',
  "fullName" TEXT DEFAULT '___UNSET___',
  "givenName" TEXT DEFAULT '___UNSET___',
  "familyName" TEXT DEFAULT '___UNSET___',
  "birthDate" DATE DEFAULT '1900-01-01'::DATE,
  gender public.gender_type DEFAULT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT '1900-01-01 00:00:00+00'::TIMESTAMPTZ
)
RETURNS public."ProfileV1"
SECURITY DEFINER
SET search_path = ''
LANGUAGE sql
AS $$
UPDATE private.profile p SET
  updated_at = CASE WHEN "updatedAt" != '1900-01-01 00:00:00+00'::TIMESTAMPTZ THEN "updatedAt" ELSE CURRENT_TIMESTAMP END,
  username = CASE WHEN username IS DISTINCT FROM '___UNSET___' THEN username ELSE p.username END,
  full_name = CASE WHEN "fullName" IS DISTINCT FROM '___UNSET___' THEN "fullName" ELSE p.full_name END,
  avatar_url = CASE WHEN "avatarUrl" IS DISTINCT FROM '___UNSET___' THEN "avatarUrl" ELSE p.avatar_url END,
  gender = CASE WHEN gender IS NOT NULL THEN gender ELSE p.gender END,
  given_name = CASE WHEN "givenName" IS DISTINCT FROM '___UNSET___' THEN "givenName" ELSE p.given_name END,
  family_name = CASE WHEN "familyName" IS DISTINCT FROM '___UNSET___' THEN "familyName" ELSE p.family_name END,
  birth_date = CASE WHEN "birthDate" != '1900-01-01'::DATE THEN "birthDate" ELSE p.birth_date END
-- Can only update your own
WHERE p.id = auth.uid()
RETURNING *;
$$;

GRANT EXECUTE ON FUNCTION public."app:profile:user:update" TO authenticated;
