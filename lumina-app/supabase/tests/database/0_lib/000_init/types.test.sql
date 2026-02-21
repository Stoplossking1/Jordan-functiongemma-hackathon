-- pgTAP tests for custom email domain

BEGIN;

-- Load pgTAP extension
SELECT plan(15);

-- Test valid emails that should pass
SELECT lives_ok(
    $$SELECT 'user+tag@example.com'::email$$,
    'Plus addressing should be valid'
);

SELECT lives_ok(
    $$SELECT 'user@sub.domain.co.uk'::email$$,
    'Multiple subdomains should be valid'
);

SELECT lives_ok(
    $$SELECT 'user-name@example-domain.com'::email$$,
    'Hyphens in local and domain parts should be valid'
);

SELECT lives_ok(
    $$SELECT 'user.name+tag@very-long-subdomain.example.com'::email$$,
    'Complex valid email should pass'
);

SELECT lives_ok(
    $$SELECT 'simple@example.com'::email$$,
    'Simple email should be valid'
);

-- Test invalid emails that should fail
SELECT throws_ok(
    $$SELECT '"user name"@example.com'::email$$,
    '23514',  -- check_violation error code
    NULL,
    'Quoted strings with spaces should be rejected'
);

SELECT throws_ok(
    $$SELECT 'user@'::email$$,
    '23514',
    NULL,
    'Email with empty domain should be rejected'
);

SELECT throws_ok(
    $$SELECT 'invalid-email'::email$$,
    '23514',
    NULL,
    'Email without @ should be rejected'
);

SELECT throws_ok(
    $$SELECT 'user@domain'::email$$,
    '23514',
    NULL,
    'Email without dot in domain should be rejected'
);

SELECT throws_ok(
    $$SELECT 'user@@domain.com'::email$$,
    '23514',
    NULL,
    'Email with double @ should be rejected'
);

SELECT throws_ok(
    $$SELECT 'user@domain..com'::email$$,
    '23514',
    NULL,
    'Email with consecutive dots should be rejected'
);

SELECT throws_ok(
    $$SELECT '.user@domain.com'::email$$,
    '23514',
    NULL,
    'Email starting with dot should be rejected'
);

SELECT throws_ok(
    $$SELECT 'user@domain.com.'::email$$,
    '23514',
    NULL,
    'Email ending with dot should be rejected'
);

-- Test length constraint
SELECT throws_ok(
    $$SELECT (REPEAT('a', 250) || '@domain.com')::email$$,
    '23514',
    NULL,
    'Email longer than 254 characters should be rejected'
);

-- Test edge case - exactly 254 characters should pass
SELECT lives_ok(
    format($$SELECT '%s@domain.com'::email$$, 
           REPEAT('a', 243)),  -- 243 + '@domain.com' (11 chars) = 254 chars
    'Email with exactly 254 characters should be valid'
);

-- Clean up
DROP DOMAIN email CASCADE;

SELECT finish();
ROLLBACK;