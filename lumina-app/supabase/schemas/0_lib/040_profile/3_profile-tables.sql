-- Based on https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native
-- Create a table for user profiles
CREATE TABLE IF NOT EXISTS private.profile (
  id uuid NOT NULL primary key REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  username text unique,
  full_name text,
  avatar_url text,
  -- gender_type_id int2 REFERENCES private.gender_type(id),
  gender public.gender_type,
  given_name text, -- use also for "first_name"
  family_name text, -- use also for "last_name"
  birth_date date,

  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Add structured comment with metadata
COMMENT ON COLUMN private.profile.avatar_url IS '
description: URL to user''s profile picture
type: imageUrl
';

