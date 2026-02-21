INSERT INTO storage.buckets (id, name)
  VALUES ('avatars', 'avatars');

INSERT INTO storage.buckets (id, name)
  VALUES ('app-assets', 'app-assets');


-- Set up access controls for storage.
-- See https://supabase.com/docs/guides/storage/security/access-control#policy-examples for more details.
-- https://www.postgresql.org/docs/current/sql-createpolicy.html
-- Note: these policies don't restrict to specific roles such as 
-- https://supabase.com/docs/guides/database/postgres/roles#supabase-roles
-- TODO: restrict these more to logged-in users by using `TO authenticated`? 
-- https://supabase.com/docs/guides/storage/security/access-control#policy-examples
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload an avatar." ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- The USING expression determines which records the UPDATE command will see to operate against, 
-- while the WITH CHECK expression defines which modified rows are allowed to be stored back into the relation.
CREATE POLICY "Anyone can update their own avatar." ON storage.objects
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = owner_id::uuid) WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "service role has full access to app-assets bucket" ON storage.objects
FOR ALL 
TO service_role
USING (bucket_id = 'app-assets')
WITH CHECK (bucket_id = 'app-assets');
