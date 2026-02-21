CREATE TYPE public.entity_type AS ENUM (
  'PERSON', -- A user or person not in the system. We can tell if a person is a "user" if the user_id in the entity table is not null. Other use-case specific roles should probably be expressed through additional tables 
  'SYSTEM', -- Any system generated content that doesn't represent a "Bot". For example status messages
  'BOT' -- Has a persona and possibly a name and the user engages with it
);

COMMENT ON TYPE public.entity_type IS '
description: Entities that are used throughout the system
values:
  PERSON: A user or person not in the system. We can tell if a person is a "user" if the user_id in the entity table is not null. Other use-case specific roles should probably be expressed through additional tables 
  SYSTEM: Any system generated content that doesn''t represent a "Bot". For example status messages
  BOT: Has a persona and possibly a name and the user engages with it
';
