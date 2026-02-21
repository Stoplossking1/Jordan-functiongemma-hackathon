
-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.
CREATE OR REPLACE FUNCTION private.handle_new_user() RETURNS trigger
SECURITY DEFINER -- need security definer for RLS
SET "search_path" TO ''
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO private.profile (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');

  INSERT INTO private.entity (id, entity_type, user_id)
  VALUES (NEW.id, 'PERSON', NEW.id);
  RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();
