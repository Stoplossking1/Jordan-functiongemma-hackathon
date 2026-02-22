-- User media bucket for storing images and voice recordings
INSERT INTO storage.buckets (id, name, public)
  VALUES ('user-media', 'user-media', false)
  ON CONFLICT (id) DO NOTHING;

-- Authenticated users can read their own media
CREATE POLICY "Users can read their own media" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'user-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can upload to their own folder
CREATE POLICY "Users can upload their own media" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can update their own media
CREATE POLICY "Users can update their own media" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'user-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can delete their own media
CREATE POLICY "Users can delete their own media" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

