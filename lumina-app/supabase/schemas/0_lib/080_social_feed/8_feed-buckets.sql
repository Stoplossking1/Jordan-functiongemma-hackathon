INSERT INTO storage.buckets (id, name)
  VALUES ('social-feed', 'social-feed');

CREATE POLICY "Social Feed Images are publicly accessible" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'social-feed');

CREATE POLICY "Anyone can upload a photo to the social feed bucket" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'social-feed');

-- The USING expression determines which records the UPDATE command will see to operate against, 
-- while the WITH CHECK expression defines which modified rows are allowed to be stored back into the relation.
CREATE POLICY "Anyone can update their own images in the social feed" ON storage.objects
  FOR UPDATE 
  TO authenticated
  USING ((SELECT auth.uid()) = owner_id::uuid)
  WITH CHECK (bucket_id = 'social-feed');
