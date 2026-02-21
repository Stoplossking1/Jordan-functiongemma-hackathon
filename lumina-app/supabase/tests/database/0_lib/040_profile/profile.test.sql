-- TODO: upgrade this to use the new function API
BEGIN;
SELECT plan(4);
SELECT has_schema('private');

SELECT has_table('private'::name, 'profile'::name);
SELECT has_view('public'::name, 'Profile'::name);

SELECT policies_are(
  'private',
  'profile',
  ARRAY [
    'Users can insert their own profile.',
    'Users can update own profile.',
    'Users can view own profile.',
    'Users can view other profiles'
  ]
);

SELECT * FROM finish();
ROLLBACK;
