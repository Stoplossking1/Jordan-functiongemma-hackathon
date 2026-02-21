import { createClient, SupabaseClient } from '@supabase/supabase-js';

import type { bigintnum, Database, timestamptzstr, uuidstr } from '@shared/generated-db-types';
import { testingAnonKey, testingUrl } from '../test-utils';

// Create a Supabase client using environment variables
const supabaseClient: SupabaseClient<Database> = createClient(testingUrl, testingAnonKey);

describe('Database uuid functions', () => {
  // prettier-ignore
  it('uuid_from_millis', async () => {
    expect(
      (
        await supabaseClient.rpc('uuid_from_millis', {
          millis_since_1970: 0 as bigintnum,
          uuid1: '00123456-1234-123a-857f-91e5360c927c' as uuidstr,
        })
      ).data,
    ).toBe('00000000-0000-123a-857f-91e5360c927c');
    expect(
      (
        await supabaseClient.rpc('uuid_from_millis', {
          millis_since_1970: 543035363746 as bigintnum,
          uuid1: '00123456-1234-123a-857f-91e5360c927c' as uuidstr,
        })
      ).data,
    ).toBe('007e6f6e-11a2-123a-857f-91e5360c927c');
    expect(
      (
        await supabaseClient.rpc('uuid_from_millis', {
          millis_since_1970: -1 as bigintnum,
          uuid1: '00123456-1234-123a-857f-91e5360c927c' as uuidstr,
        })
      ).data,
    ).toBe('ffffffff-ffff-123a-857f-91e5360c927c');
    // expect((await supabaseClient.rpc('uuid_from_millis', {millis_since_1970: 0, uuid1: null})).data).toBe(null);
    // expect((await supabaseClient.rpc('uuid_from_millis', {millis_since_1970: null, uuid1: null})).data).toBe(null);
  });

  // prettier-ignore
  it('uuid_to_millis', async () => {
    expect((await supabaseClient.rpc('uuid_to_millis', {uuid1: '00000000-0000-123a-857f-91e5360c927c' as uuidstr})).data).toBe(0);
    expect(
      (await supabaseClient.rpc('uuid_to_millis', { uuid1: '007e6f6e-11a2-123a-857f-91e5360c927c' as uuidstr })).data,
    ).toBe(543035363746);
    expect(
      (await supabaseClient.rpc('uuid_to_millis', { uuid1: 'ffffffff-ffff-123a-857f-91e5360c927c' as uuidstr })).data,
    ).toBe(-1);
  });

  // prettier-ignore
  it('uuid_from_longs', async () => {
    // expect((await supabaseClient.rpc('uuid_from_longs', {msb: null, lsb: null})).data).toBe(null);
    expect((await supabaseClient.rpc('uuid_from_longs', { msb: 0 as bigintnum, lsb: 0 as bigintnum })).data).toBe(
      '00000000-0000-0000-0000-000000000000',
    );
    expect((await supabaseClient.rpc('uuid_from_longs', { msb: 1 as bigintnum, lsb: 2 as bigintnum })).data).toBe(
      '00000000-0000-0001-0000-000000000002',
    );
    expect((await supabaseClient.rpc('uuid_from_longs', { msb: -1 as bigintnum, lsb: -1 as bigintnum })).data).toBe(
      'ffffffff-ffff-ffff-ffff-ffffffffffff',
    );
    
    // NOTE: the tests below are not working since the numbers are exceeding 52 bits and JS is rounding them
    // see https://github.com/supabase/postgrest-js/issues/319
    //expect((await supabaseClient.rpc('uuid_from_longs', {msb: -4822678189205112, lsb: 8603657889541918976})).data).toBe('ffeeddcc-bbaa-9988-7766-554433221100');
    //expect((await supabaseClient.rpc('uuid_from_longs', {msb: -9223372036854775808, lsb: 9223372036854775807})).data).toBe('80000000-0000-0000-7fff-ffffffffffff');
    //expect((await supabaseClient.rpc('uuid_from_longs', {msb: 9223372036854775807, lsb: -9223372036854775808})).data).toBe('7fffffff-ffff-ffff-8000-000000000000');
  });

  // prettier-ignore
  it('uuid_from_timestamp', async () => {
    // 'we should produce a non-null uuid'
    expect((await supabaseClient.rpc('uuid_from_timestamp', {})).data).not.toBe(null);
    expect(
      (
        await supabaseClient.rpc('uuid_from_timestamp', {
          ts: '2024-11-30 15:00:00.000 -0500' as timestamptzstr,
          uuid1: '00000000-0000-0000-0000-000000000000' as uuidstr,
        })
      ).data,
    ).toBe('01937ea8-9e00-0000-0000-000000000000');
  });

  // prettier-ignore
  it('uuid_at', async () => {
    expect((await supabaseClient.rpc('uuid_at', { time_id: 0 as bigintnum})).data).toBe('00000000-0000-0000-0000-000000000000');
    expect((await supabaseClient.rpc('uuid_at', { time_id: 1 as bigintnum })).data).toBe(
      '00000000-0001-0000-0000-000000000000',
    );
    expect((await supabaseClient.rpc('uuid_at', { time_id: 1 as bigintnum, space_id: 2 as bigintnum })).data).toBe(
      '00000000-0001-0000-0000-000000000002',
    );
    expect((await supabaseClient.rpc('uuid_at', { time_id: 0 as bigintnum, space_id: 10 as bigintnum })).data).toBe(
      '00000000-0000-0000-0000-00000000000a',
    );
    expect((await supabaseClient.rpc('uuid_at', { time_id: -1 as bigintnum })).data).toBe(
      'ffffffff-ffff-0000-0000-000000000000',
    );
    expect((await supabaseClient.rpc('uuid_at', { time_id: 0 as bigintnum, space_id: -1 as bigintnum })).data).toBe(
      '00000000-0000-0000-ffff-ffffffffffff',
    );
    expect((await supabaseClient.rpc('uuid_at', { time_id: -1 as bigintnum, space_id: -1 as bigintnum })).data).toBe(
      'ffffffff-ffff-0000-ffff-ffffffffffff',
    );
    expect((await supabaseClient.rpc('uuid_at', { time_id: 507 as bigintnum, space_id: 1 as bigintnum })).data).toBe(
      '00000000-01fb-0000-0000-000000000001',
    );
  });

  // prettier-ignore
  it('uuid_add_millis_and_id', async () => {
    expect(
      (await supabaseClient.rpc('uuid_add_millis_and_id', { uuid1: '00000000-0000-0000-0000-000000000000' as uuidstr }))
        .data,
    ).toBe('00000000-0000-0000-0000-000000000000');
    expect(
      (await supabaseClient.rpc('uuid_add_millis_and_id', { uuid1: '12345678-90AB-CDEF-FEDC-BA0987654321' as uuidstr }))
        .data,
    ).toBe('12345678-90ab-cdef-fedc-ba0987654321');
    expect(
      (
        await supabaseClient.rpc('uuid_add_millis_and_id', {
          uuid1: '00000000-0000-0000-0000-000000000000' as uuidstr,
          millis_since1970: 0 as bigintnum,
        })
      ).data,
    ).toBe('00000000-0000-0000-0000-000000000000');
    expect(
      (
        await supabaseClient.rpc('uuid_add_millis_and_id', {
          uuid1: '00000000-0000-0000-0000-000000000000' as uuidstr,
          millis_since1970: 1 as bigintnum,
        })
      ).data,
    ).toBe('00000000-0001-0001-0000-000000000001');
    expect(
      (
        await supabaseClient.rpc('uuid_add_millis_and_id', {
          uuid1: '00000000-0000-0000-0000-000000000000' as uuidstr,
          millis_since1970: 1521342563746 as bigintnum,
        })
      ).data,
    ).toBe('01623715-45a2-45a2-0000-0162371545a2');
    expect(
      (
        await supabaseClient.rpc('uuid_add_millis_and_id', {
          uuid1: '00000000-0000-0000-0000-000000000000' as uuidstr,
          millis_since1970: 1521342563746 as bigintnum,
          uuid2: '00000000-0000-0000-0000-000000000000' as uuidstr,
        })
      ).data,
    ).toBe('01623715-45a2-45a2-0000-0162371545a2');
    expect(
      (
        await supabaseClient.rpc('uuid_add_millis_and_id', {
          uuid1: '00777777-524c-4a81-69bb-ea0bd7d5791d' as uuidstr,
          millis_since1970: 1521342563746 as bigintnum,
        })
      ).data,
    ).toBe('01623715-45a2-0f23-69bb-eb69e0c03cbf');
    expect(
      (await supabaseClient.rpc('uuid_add_millis_and_id', { uuid1: '00123456-1234-123a-857f-91e5360c927c' as uuidstr }))
        .data,
    ).toBe('00123456-1234-123a-857f-91e5360c927c');
    expect(
      (
        await supabaseClient.rpc('uuid_add_millis_and_id', {
          uuid1: '00777777-524c-4a81-69bb-ea0bd7d5791d' as uuidstr,
          uuid2: '00123456-1234-123a-857f-91e5360c927c' as uuidstr,
        })
      ).data,
    ).toBe('00777777-524c-58bb-ecc4-7beee1d9eb61');
    expect(
      (
        await supabaseClient.rpc('uuid_add_millis_and_id', {
          uuid1: '00123456-1234-123a-857f-91e5360c927c' as uuidstr,
          millis_since1970: 1521342563746 as bigintnum,
        })
      ).data,
    ).toBe('01623715-45a2-5798-857f-90870119d7de');
    expect(
      (
        await supabaseClient.rpc('uuid_add_millis_and_id', {
          uuid1: '00123456-1234-123a-857f-91e5360c927c' as uuidstr,
          millis_since1970: 1521342563746 as bigintnum,
          uuid2: '00777777-524c-4a81-69bb-ea0bd7d5791d' as uuidstr,
        })
      ).data,
    ).toBe('01623715-45a2-1d19-ecc4-7a8cd6ccaec3');
  });

  // prettier-ignore
  it('uuid_add_timestamp_and_id', async () => {
    expect(
      (
        await supabaseClient.rpc('uuid_add_timestamp_and_id', {
          uuid1: '00000000-0000-0000-0000-000000000000' as uuidstr,
        })
      ).data,
    ).toBe('00000000-0000-0000-0000-000000000000');
    expect(
      (
        await supabaseClient.rpc('uuid_add_timestamp_and_id', {
          uuid1: '00000000-0000-0000-0000-000000000000' as uuidstr,
          ts: 'Sun Mar 18 2018 03:09:23.746' as timestamptzstr,
        })
      ).data,
    ).toBe('01623715-45a2-45a2-0000-0162371545a2');
  });

  // prettier-ignore
  it('uuid_to_base64', async () => {
    expect(
      (await supabaseClient.rpc('uuid_to_base64', { uuid1: '00123456-1234-123a-857f-91e5360c927c' as uuidstr })).data,
    ).toBe('ABI0VhI0EjqFf5HlNgySfA');
    expect(
      (await supabaseClient.rpc('uuid_to_base64', { uuid1: '00777777-524c-4a81-69bb-ea0bd7d5791d' as uuidstr })).data,
    ).toBe('AHd3d1JMSoFpu-oL19V5HQ');
    expect(
      (await supabaseClient.rpc('uuid_to_base64', { uuid1: '007e6f6e-11a2-4a81-69bb-ea0bd7f5791d' as uuidstr })).data,
    ).toBe('AH5vbhGiSoFpu-oL1_V5HQ');
    expect(
      (await supabaseClient.rpc('uuid_to_base64', { uuid1: '007e6f6e-11a2-4a81-69bb-ea0bd7d5791d' as uuidstr })).data,
    ).toBe('AH5vbhGiSoFpu-oL19V5HQ');
  });

  // prettier-ignore
  it('uuid_from_base64', async () => {
    expect((await supabaseClient.rpc('uuid_from_base64', { uuid_base64: 'AG6-CVxXnd9QQpGvRwLblQ' })).data).toBe('006ebe09-5c57-9ddf-5042-91af4702db95');
    expect((await supabaseClient.rpc('uuid_from_base64', { uuid_base64: 'AH5vbhGiSoFpu-oL1_V5HQ' })).data).toBe('007e6f6e-11a2-4a81-69bb-ea0bd7f5791d');
    expect((await supabaseClient.rpc('uuid_from_base64', { uuid_base64: 'AH5vbhGiSoFpu-oL1_V5HQ==' })).data).toBe('007e6f6e-11a2-4a81-69bb-ea0bd7f5791d');
  });

  // prettier-ignore
  it('int_id_from_millis', async () => {
    expect((await supabaseClient.rpc('int_id_from_millis', { millis_since_1970: 1735689600000 as bigintnum})).data).toBe(0);
    expect((await supabaseClient.rpc('int_id_from_millis', { millis_since_1970: 1735689601000 as bigintnum})).data).toBe(1);
  });

  // prettier-ignore
  it('int_id_from_timestamp', async () => {
    expect((await supabaseClient.rpc('int_id_from_timestamp', { ts: '2025-01-01 00:00:00 UTC' as timestamptzstr})).data).toBe(0);
    expect(
      (await supabaseClient.rpc('int_id_from_timestamp', { ts: '2025-01-01 00:00:10 UTC' as timestamptzstr })).data,
    ).toBe(10);
  });
});
