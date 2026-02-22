-- Implements a UUID "similar" to type v7 (without the version tag) to generate sortable UUIDs using a timestamp and random number:
-- https://www.ietf.org/archive/id/draft-peabody-dispatch-new-uuid-format-04.html#name-uuid-version-7
-- https://uuid7.com/
-- http://www.codeproject.com/Articles/388157/GUIDs-as-fast-primary-keys-under-multiple-database
--
-- We use 6 bytes (signed) for milliseconds since 1970 = 1628906 days = 4462 years
-- The remaining 10 bytes are random numbers

CREATE OR REPLACE FUNCTION public.uuid_from_millis(millis_since_1970 bigint, uuid1 uuid)
RETURNS uuid
RETURNS NULL ON NULL INPUT
IMMUTABLE
SET search_path = ''
LANGUAGE SQL
AS $$ SELECT (lpad(to_hex(millis_since_1970), 12, '0') || substring(uuid1::text from 14))::UUID; $$;
-- SELECT text('007bdc9c-'||substr(md5(random()::text), 9))::uuid

GRANT EXECUTE ON FUNCTION public.uuid_from_millis TO PUBLIC;

CREATE OR REPLACE FUNCTION public.uuid_from_timestamp(ts timestamptz = now(), uuid1 uuid = gen_random_uuid())
RETURNS uuid
RETURNS NULL ON NULL INPUT
IMMUTABLE
SET search_path = ''
LANGUAGE SQL
AS $$ SELECT public.uuid_from_millis((EXTRACT(EPOCH FROM ts)*1000)::bigint, uuid1);$$;

GRANT EXECUTE ON FUNCTION public.uuid_from_timestamp TO PUBLIC;


CREATE OR REPLACE FUNCTION public.uuid_from_longs(msb bigint, lsb bigint)
RETURNS uuid
RETURNS NULL ON NULL INPUT
IMMUTABLE
SET search_path = ''
LANGUAGE SQL
AS $$ SELECT (lpad(to_hex(msb), 16, '0') || lpad(to_hex(lsb), 16, '0'))::UUID; $$;

GRANT EXECUTE ON FUNCTION public.uuid_from_longs TO PUBLIC;

-- set the time and space component of the uuid to fixed values
CREATE OR REPLACE FUNCTION public.uuid_at(time_id bigint, space_id bigint = 0)
RETURNS uuid
RETURNS NULL ON NULL INPUT
IMMUTABLE
SET search_path = ''
LANGUAGE SQL
AS $$ SELECT (lpad(to_hex(time_id), 12, '0') || lpad(to_hex(space_id), 20, '0'))::UUID; $$;

GRANT EXECUTE ON FUNCTION public.uuid_at TO PUBLIC;


CREATE OR REPLACE FUNCTION public.int_id_from_millis(millis_since_1970 bigint) 
RETURNS integer
RETURNS NULL ON NULL INPUT
IMMUTABLE
SET search_path = ''
LANGUAGE SQL
-- use seconds since epoch, which is 2025-01-01 00:00:00 UTC
AS $$ SELECT (millis_since_1970 - 1735689600000)/1000; $$;

GRANT EXECUTE ON FUNCTION public.int_id_from_millis TO PUBLIC;


CREATE OR REPLACE FUNCTION public.int_id_from_timestamp(ts timestamptz = now()) 
RETURNS integer
RETURNS NULL ON NULL INPUT
IMMUTABLE
SET search_path = ''
LANGUAGE SQL 
-- epoch is 2025-01-01 00:00:00 UTC
AS $$ SELECT public.int_id_from_millis((EXTRACT(EPOCH FROM ts)*1000)::bigint); $$;

GRANT EXECUTE ON FUNCTION public.int_id_from_timestamp TO PUBLIC;


CREATE OR REPLACE FUNCTION private.bytea_to_int8(ba BYTEA, start_pos INT, num_bytes INT)
RETURNS int8
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  result int8 := 0;
  msb_bit int;
BEGIN
  IF num_bytes < 1 OR num_bytes > 8 THEN RETURN NULL; END IF;

  -- Get the most significant bit of the first byte
  msb_bit := (get_byte(ba, start_pos) >> 7) & 1;

  -- If MSB is 1 and we're reading less than 8 bytes, start with all 1s in upper bits
  IF msb_bit = 1 AND num_bytes < 8 THEN
    result := -1 << (num_bytes * 8);
  END IF;

  FOR i IN 0..num_bytes-1 LOOP
    result := result | (get_byte(ba, start_pos + i)::int8 << (8 * (num_bytes - 1 - i)));
  END LOOP;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.uuid_to_millis(uuid1 uuid)
RETURNS bigint
RETURNS NULL ON NULL INPUT
IMMUTABLE
SET search_path = ''
LANGUAGE SQL
AS $$ SELECT private.bytea_to_int8(uuid_send(uuid1), 0, 6); $$;
-- AS $$ SELECT ('x' || translate(uuid1::text, '-', ''))::bit(46)::bigint; $$;
-- AS $$ SELECT ('x' || translate(uuid1::text, '-', ''))::bit(64)::bigint; $$;

GRANT EXECUTE ON FUNCTION public.uuid_to_millis TO PUBLIC;


-- Combine an existing uuid and given millis into a new uuid. The millis will define the time part of
-- the uuid. The random part inside the uuid will be combined using XOR. We also include the millis into
-- XOR to make sure that a uuid with a timestamp part equal to the given millis will not just return the given uuid.
CREATE OR REPLACE FUNCTION public.uuid_add_millis_and_id(uuid1 uuid, millis_since1970 bigint = NULL, uuid2 uuid = NULL) 
RETURNS uuid
IMMUTABLE
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  v_bytea1 bytea;
  v_bytea2 bytea;
  v_millis_shifted bigint;
  v_tmp int;
BEGIN
    -- swap in case only one is null
  IF uuid1 IS NULL THEN
    uuid1 := uuid2;
    uuid2 := NULL;
  END IF;
  -- v_bytea1 := decode(replace(uuid1::text, '-', ''), 'hex');
  -- v_bytea2 := decode(replace(uuid2::text, '-', ''), 'hex');
  v_bytea1 := uuid_send(uuid1);
  v_bytea2 := uuid_send(uuid2);

  -- RAISE NOTICE '%', octet_length(v_bytea1);
  IF millis_since1970 IS NOT NULL THEN
    v_millis_shifted := (millis_since1970) << 16;
    FOR i IN 0..5 LOOP
      -- Write milliseconds to first 6 bytes
      v_tmp := (v_millis_shifted >> ((7 - (i % 8)) * 8) & 255)::int;
      v_bytea1 := set_byte(v_bytea1, i, v_tmp);
    END LOOP;
  END IF;

  FOR i IN 6..15 LOOP
    v_tmp := get_byte(v_bytea1, i);
    -- Apply milliseconds XOR if provided
    IF millis_since1970 IS NOT NULL THEN
      v_tmp := v_tmp # (millis_since1970 >> ((7 - (i % 8)) * 8) & 255)::int;
    END IF;

    -- Apply milliseconds XOR if provided
    IF v_bytea2 IS NOT NULL THEN
      v_tmp := v_tmp # get_byte(v_bytea2, i);
    END IF;
    v_bytea1 := set_byte(v_bytea1, i, v_tmp);
  END LOOP;

  RETURN encode(v_bytea1, 'hex')::uuid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.uuid_add_millis_and_id TO PUBLIC;


CREATE OR REPLACE FUNCTION public.uuid_add_timestamp_and_id(uuid1 uuid, ts timestamptz = NULL, uuid2 uuid = NULL)
RETURNS uuid
IMMUTABLE
SET search_path = ''
LANGUAGE SQL
AS $$ SELECT public.uuid_add_millis_and_id(uuid1, (EXTRACT(EPOCH FROM ts)*1000)::bigint, uuid2); $$;

GRANT EXECUTE ON FUNCTION public.uuid_add_timestamp_and_id TO PUBLIC;


-- Convert UUID into url safe base64 ID
CREATE OR REPLACE FUNCTION public.uuid_to_base64(uuid1 uuid)
RETURNS text
IMMUTABLE
SET search_path = ''
LANGUAGE SQL
AS $$ SELECT substring(translate(encode(decode(replace(uuid1::text, '-', ''), 'hex'), 'base64'), '+/', '-_') for 22); $$;

GRANT EXECUTE ON FUNCTION public.uuid_to_base64 TO PUBLIC;

-- Convert url safe base64 ID into UUID
CREATE OR REPLACE FUNCTION public.uuid_from_base64(uuid_base64 text)
RETURNS uuid
IMMUTABLE
SET search_path = ''
LANGUAGE SQL 
-- add the trailing '==' characters to base64 string if missing
AS $$ SELECT encode(decode(translate(CASE WHEN right(uuid_base64, 2) != '==' THEN uuid_base64 || '==' ELSE uuid_base64 END, '-_', '+/'), 'base64'), 'hex')::UUID; $$;

GRANT EXECUTE ON FUNCTION public.uuid_from_base64 TO PUBLIC;
