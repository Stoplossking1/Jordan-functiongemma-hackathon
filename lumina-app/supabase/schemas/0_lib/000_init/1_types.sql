-- NOT NULL types to be used in composite types which otherwise don't support it: https://dba.stackexchange.com/a/342852/118434
CREATE DOMAIN public.bool_notnull AS bool NOT NULL;
CREATE DOMAIN public.smallint_notnull AS smallint NOT NULL;
CREATE DOMAIN public.int2_notnull AS int2 NOT NULL; 
CREATE DOMAIN public.int_notnull AS int NOT NULL;
CREATE DOMAIN public.int4_notnull AS int4 NOT NULL;
CREATE DOMAIN public.bigint_notnull AS bigint NOT NULL;
CREATE DOMAIN public.int8_notnull AS int8 NOT NULL; 
CREATE DOMAIN public.real_notnull AS real NOT NULL;
CREATE DOMAIN public.float4_notnull AS float4 NOT NULL;
CREATE DOMAIN public.double_notnull AS double precision NOT NULL;
CREATE DOMAIN public.float8_notnull AS float8 NOT NULL;
CREATE DOMAIN public.decimal_notnull AS decimal NOT NULL;
CREATE DOMAIN public.numeric_notnull AS numeric NOT NULL;
CREATE DOMAIN public.money_notnull AS money NOT NULL;

CREATE DOMAIN public.interval_notnull AS interval NOT NULL;
CREATE DOMAIN public.date_notnull AS date NOT NULL;
CREATE DOMAIN public.timetz_notnull AS timetz NOT NULL;
CREATE DOMAIN public.time_notnull AS time NOT NULL;
CREATE DOMAIN public.timestamptz_notnull AS timestamptz NOT NULL;
CREATE DOMAIN public.timestamp_notnull AS timestamp NOT NULL;
CREATE DOMAIN public.uuid_notnull AS uuid NOT NULL;

CREATE DOMAIN public.text_notnull AS text NOT NULL;
CREATE DOMAIN public.bytea_notnull AS bytea NOT NULL;
CREATE DOMAIN public.varchar_notnull AS varchar NOT NULL;
CREATE DOMAIN public.jsonb_notnull AS jsonb NOT NULL;

-- First, create the email domain for testing
CREATE DOMAIN public.email AS TEXT
CHECK (
    VALUE ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND LENGTH(VALUE) <= 254
    AND VALUE NOT LIKE '%..%'  -- No consecutive dots
    AND VALUE NOT LIKE '.%'    -- No leading dot
    AND VALUE NOT LIKE '%.'    -- No trailing dot
);

CREATE DOMAIN public.url AS TEXT;
-- CHECK (
    -- VALUE ~* '^(https?|ftp|ftps|file)://[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*(:(\d{1,5}))?(/.*)?(\?.*)?(\#.*)?$'
    -- OR VALUE ~* '^file:///[a-zA-Z0-9/._\-~%]+$'  -- Special handling for file:// URLs
    -- AND LENGTH(VALUE) <= 2048
-- )

