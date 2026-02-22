import { mergeDeep, mergeDeepInPlace, diffDeep } from '../object-utils.ts';

describe('components-spec', () => {
  it('mergeDeepInPlace', () => {
    expect(mergeDeepInPlace(null, null)).toStrictEqual(null);
    expect(mergeDeepInPlace(null, {})).toStrictEqual({});
    expect(mergeDeepInPlace({}, null)).toStrictEqual({});
    expect(mergeDeepInPlace({}, {})).toStrictEqual({});
    expect(mergeDeepInPlace({}, { a: {} })).toStrictEqual({ a: {} });
    expect(mergeDeepInPlace({ a: {} }, {})).toStrictEqual({ a: {} });

    // allow overwriting with null
    expect(mergeDeepInPlace({ a: 1 }, { a: null })).toStrictEqual({ a: null });
    expect(mergeDeepInPlace({ a: null }, { a: 1 })).toStrictEqual({ a: 1 });
    // don't overwrite with a key that's undefined
    expect(mergeDeepInPlace({ a: 1 }, { a: undefined })).toStrictEqual({ a: 1 });
    expect(mergeDeepInPlace({ a: undefined }, { a: 1 })).toStrictEqual({ a: 1 });

    expect(mergeDeepInPlace({ a: {} }, { b: {} })).toStrictEqual({ a: {}, b: {} });
    expect(mergeDeepInPlace({ a: { a1: {}, text: 'test' } }, { a: { a2: {} } })).toStrictEqual({
      a: { text: 'test', a1: {}, a2: {} },
    });
    expect(
      mergeDeepInPlace({ a: { array: ['1', '2'], text1: 'text1' } }, { a: { array: ['3', '4'], text2: 'text2' } }),
    ).toStrictEqual({
      a: { text1: 'text1', array: ['1', '2', '3', '4'], text2: 'text2' },
    });
    // expect(
    //   mergeDeepInPlace(
    //     { a: { array: ['1', '2'], text1: 'text1' } },
    //     { a: { array: ['3', '4'], text2: 'text2' } },
    //     false,
    //   ),
    // ).toStrictEqual({
    //   a: { text1: 'text1', array: ['3', '4'], text2: 'text2' },
    // });
  });
  it('mergeDeep', () => {
    expect(mergeDeep(null, null)).toStrictEqual(null);
    expect(mergeDeep(null, {})).toStrictEqual({});
    expect(mergeDeep({}, null)).toStrictEqual({});
    expect(mergeDeep({}, {})).toStrictEqual({});
    expect(mergeDeep({}, { a: {} })).toStrictEqual({ a: {} });
    expect(mergeDeep({ a: {} }, {})).toStrictEqual({ a: {} });
    // allow overwriting with null
    expect(mergeDeep({ a: 1 }, { a: null })).toStrictEqual({ a: null });
    expect(mergeDeep({ a: null }, { a: 1 })).toStrictEqual({ a: 1 });
    // don't overwrite with a key that's undefined
    expect(mergeDeep({ a: 1 }, { a: undefined })).toStrictEqual({ a: 1 });
    expect(mergeDeep({ a: undefined }, { a: 1 })).toStrictEqual({ a: 1 });
    expect(mergeDeep({ a: {} }, { b: {} })).toStrictEqual({ a: {}, b: {} });
    expect(mergeDeep({ a: { a1: {}, text: 'test' } }, { a: { a2: {} } })).toStrictEqual({
      a: { text: 'test', a1: {}, a2: {} },
    });
    expect(
      mergeDeep({ a: { array: ['1', '2'], text1: 'text1' } }, { a: { array: ['2', '3'], text2: 'text2' } }),
    ).toStrictEqual({
      a: { text1: 'text1', array: ['1', '2', '2', '3'], text2: 'text2' },
    });
    expect(
      mergeDeep({ a: { array: ['1', '2'], text1: 'text1' } }, { a: { array: ['2', '3'], text2: 'text2' } }, true),
    ).toStrictEqual({
      a: { text1: 'text1', array: ['1', '2', '3'], text2: 'text2' },
    });
    expect(
      mergeDeep(
        { a: { array: [{ b: 1 }, { c: 2 }], text1: 'text1' } },
        { a: { array: [{ b: 3 }, { c: undefined }], text2: 'text2' } },
        true,
      ),
    ).toStrictEqual({
      a: { text1: 'text1', array: [{ b: 3 }, { c: 2 }], text2: 'text2' },
    });

    expect(mergeDeep([1, 1], [1, 1, undefined])).toStrictEqual([1, 1, 1, 1, undefined]);
    expect(mergeDeep([1, 2], [2, 2, undefined], true)).toStrictEqual([1, 2, undefined]);
    expect(mergeDeep([1, 2], [3, 3, undefined], true)).toStrictEqual([1, 2, 3, 3, undefined]);
    expect(mergeDeep([{ b: 1 }, { c: 2 }], [{ b: 3 }, { c: undefined }], true)).toStrictEqual([{ b: 3 }, { c: 2 }]);
  });

  it('diffDeep', () => {
    expect(diffDeep(null, null)).toStrictEqual(undefined);
    expect(diffDeep(undefined, undefined)).toStrictEqual(undefined);
    expect(diffDeep(null, {})).toStrictEqual(undefined);
    expect(diffDeep(undefined, {})).toStrictEqual(undefined);
    expect(diffDeep({}, null)).toStrictEqual({});
    expect(diffDeep({}, undefined)).toStrictEqual({});
    expect(diffDeep({}, {})).toStrictEqual(undefined);
    expect(diffDeep({ a: {} }, { a: {} })).toStrictEqual(undefined);
    expect(diffDeep({ a: {}, b: {} }, { b: {} })).toStrictEqual({ a: {} });
    expect(
      diffDeep(
        {
          a: { text: 'test', a1: {}, a2: {} },
        },
        { a: { a2: {} } },
      ),
    ).toStrictEqual({ a: { a1: {}, text: 'test' } });
    expect(
      diffDeep(
        {
          a: { text1: 'text1', array: ['1', '2', '3', '4'], text2: 'text2' },
        },
        { a: { array: ['3', '4'], text2: 'text2' } },
        true,
      ),
    ).toStrictEqual({ a: { array: ['1', '2'], text1: 'text1' } });
    expect(
      diffDeep(
        {
          name: 'Tester',
          age: 30,
          address: {
            street: '123 Main St',
            city: 'City',
          },
          hobbies: ['reading', 'gaming', 'coding'],
        },
        {
          name: 'Tester',
          age: 31,
          address: {
            street: '124 Main St',
            city: 'City',
          },
          hobbies: ['coding', 'reading'],
        },
        true,
      ),
    ).toStrictEqual({
      age: 30,
      address: { street: '123 Main St' },
      hobbies: ['gaming'],
    });

    expect(diffDeep(['reading', 'gaming', 'coding'], ['coding', 'reading'], true)).toStrictEqual(['gaming']);
    expect(diffDeep([{ a: 1 }, { b: 2 }, { c: 3 }], [])).toStrictEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
    expect(diffDeep([{ a: 1 }, { b: 2 }, { c: 3 }], [{ c: 3 }, { a: 1 }], true)).toStrictEqual([{ b: 2 }]);
    expect(diffDeep([{ a: 1 }, { b: 2 }, { c: 3 }], [{ c: 3 }, { a: 1 }])).toStrictEqual([
      { a: 1 },
      { b: 2 },
      { c: 3 },
    ]);
    expect(diffDeep([{ a: 1 }, { b: 2 }, { c: 3 }], [{ a: 1 }, { b: 2 }], true)).toStrictEqual([{ c: 3 }]);
  });
});
