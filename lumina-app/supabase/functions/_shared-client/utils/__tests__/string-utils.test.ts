import { describe, expect, it } from '@jest/globals';
import { asString, format } from '../string-utils.ts';
import { encodeBase64, decodeBase64 } from '../base64-utils.ts';

describe('string-utils', () => {
  // it('lastSentenceStartIndex', () => {
  //     expect(lastSentenceStartIndex("If you're planning a tropical vacation, there are several beautiful")).toEqual(-1);
  //     expect(lastSentenceStartIndex("Hi, this is a sentence. And another")).toEqual(24);

  //     // TODO: end of sentence detection is wrong here, need a better algorithm
  //     expect(lastSentenceStartIndex("Dear Mrs. Smith, this sentenice is incomplete")).toEqual(10);
  // });

  it('asString', () => {
    expect(asString('hi')).toEqual('hi');
    expect(asString(null)).toBeNull();
    expect(asString(undefined)).toBeUndefined();
    expect(asString(123)).toBeNull();
    expect(asString({})).toBeNull();
    expect(asString([])).toBeNull();
  });

  it('format', () => {
    const data = {
      hash: '123',
      message: 'Initial commit',
      'fence[0]': 'complex',
    };

    // simple case
    expect(format('{hash}', data)).toEqual('123');
    expect(format('Test: {hash}{message}', data)).toEqual('Test: 123Initial commit');

    // missing content
    expect(format('Test: {missing}{more}', data)).toEqual('Test: ');
    expect(format('Test: {missing}{more}', data, true)).toEqual('Test: {missing}{more}');

    // Test nested opening brackets
    expect(format('Test: {abc{hash}}', data)).toEqual('Test: {abc123}');

    expect(format('Test: {abc{def{hash}', data)).toEqual('Test: {abc{def123');

    expect(format('Test: {abc{hash}def}', data)).toEqual('Test: {abc123def}');

    // Mixed valid and invalid cases
    expect(format('Test: {abc{hash}, {message}', data)).toEqual('Test: {abc123, Initial commit');

    // Multiple nested cases
    expect(format('Test: {a{b{missing}}} {hash}', data)).toEqual('Test: {a{b}} 123');

    // Invalid then valid
    expect(format('Test: {invalid{hash}', data)).toEqual('Test: {invalid123');

    // Invalid then valid
    expect(format('Test: {fence[0]}', data)).toEqual('Test: complex');
  });

  // it('removePrefixCaseInsensitiveIgnorePunctuation', () => {
  //     expect(removePrefixCaseInsensitiveIgnorePunctuation("", "Prefix")).toEqual("");
  //     expect(removePrefixCaseInsensitiveIgnorePunctuation("Hi", "Prefix")).toEqual("Hi");
  //     expect(removePrefixCaseInsensitiveIgnorePunctuation("Prefix Hi", "Prefix")).toEqual("Hi");
  //     expect(removePrefixCaseInsensitiveIgnorePunctuation("Pre-fix!", "Prefix")).toEqual("");
  //     expect(removePrefixCaseInsensitiveIgnorePunctuation("Pre-fix!Hi", "Prefix")).toEqual("Hi");
  //     expect(removePrefixCaseInsensitiveIgnorePunctuation("Pre-fix! Hi", "Prefix")).toEqual("Hi");
  //     expect(removePrefixCaseInsensitiveIgnorePunctuation("pre-fix, Hi", "Prefix")).toEqual("Hi");
  //     expect(removePrefixCaseInsensitiveIgnorePunctuation("pre-fi", "Prefix")).toEqual("pre-fi");
  // });

  it('base64', () => {
    const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello" in UTF-8
    const base64String = encodeBase64(data); // Will output "SGVsbG8="
    expect(base64String).toEqual('SGVsbG8=');
    const data2 = decodeBase64(base64String);
    expect(data2).toEqual(data);
  });
});
