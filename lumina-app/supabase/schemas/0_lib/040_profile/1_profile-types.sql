
CREATE TYPE public.gender_type AS ENUM (
  'MALE',
  'FEMALE',
  'NON_BINARY'
);
COMMENT ON TYPE public.gender_type IS '
description: Available genders
values:
  MALE: Male gender
  FEMALE: Female gender
  NON_BINARY: Non-binary gender
';
