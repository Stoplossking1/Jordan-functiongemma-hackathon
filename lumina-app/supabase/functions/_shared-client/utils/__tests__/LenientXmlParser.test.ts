import { describe, expect, it } from '@jest/globals';
import { LenientXmlParser, TagCallbackType } from '../LenientXmlParser.ts';
import { joinStrings } from '../string-utils.ts';

describe('LenientXmlParser tests', () => {
  it('empty with whitespace only', () => {
    const textActual: Array<[string | undefined, string]> = [];
    const tagsActual: Array<[TagCallbackType, string]> = [];
    new LenientXmlParser().parse(
      ' ',
      (tag, embeddedText) => textActual.push([tag, embeddedText]),
      (type, tagText) => tagsActual.push([type, tagText]),
    );

    expect(tagsActual).toEqual([[TagCallbackType.END, '']]);
    expect(textActual).toEqual([]);
  });

  it('text only', () => {
    const textActual: Array<[string | undefined, string]> = [];
    const tagsActual: Array<[TagCallbackType, string]> = [];
    new LenientXmlParser().parse(
      'Outer1',
      (tag, embeddedText) => textActual.push([tag, embeddedText]),
      (type, tagText) => tagsActual.push([type, tagText]),
    );

    expect(tagsActual).toEqual([
      [TagCallbackType.TEXT, 'Outer1'],
      [TagCallbackType.END, ''],
    ]);
    expect(textActual).toEqual([[undefined, 'Outer1']]);
  });

  it('tag only', () => {
    const textActual: Array<[string | undefined, string]> = [];
    const tagsActual: Array<[TagCallbackType, string]> = [];
    new LenientXmlParser().parse(
      '<Tag1>',
      (tag, embeddedText) => textActual.push([tag, embeddedText]),
      (type, tagText) => tagsActual.push([type, tagText]),
    );

    expect(tagsActual).toEqual([
      [TagCallbackType.OPEN_TAG_START, 'tag1'],
      [TagCallbackType.OPEN_TAG, 'tag1'],
      [TagCallbackType.END, ''],
    ]);
    expect(textActual).toEqual([]);
  });

  it('text before and after tag', () => {
    const textActual: Array<[string | undefined, string]> = [];
    const tagsActual: Array<[TagCallbackType, string]> = [];
    new LenientXmlParser().parse(
      'Outer1<Tag1>Inner not closed',
      (tag, embeddedText) => textActual.push([tag, embeddedText]),
      (type, tagText) => tagsActual.push([type, tagText]),
    );

    expect(tagsActual).toEqual([
      [TagCallbackType.TEXT, 'Outer1'],
      [TagCallbackType.OPEN_TAG_START, 'tag1'],
      [TagCallbackType.OPEN_TAG, 'tag1'],
      [TagCallbackType.TEXT, 'Inner not closed'],
      [TagCallbackType.END, ''],
    ]);
    expect(textActual).toEqual([
      [undefined, 'Outer1'],
      ['tag1', 'Inner not closed'],
    ]);
  });

  it('multiple layers', () => {
    const textActual: Array<[string | undefined, string]> = [];
    const tagsActual: Array<[TagCallbackType, string]> = [];
    new LenientXmlParser().parse(
      'Outer1<Tag1>Inner1<Tag11>Inner11</Tag11>Inner1</Tag1>Outer2<Tag2>Inner not closed',
      (tag, embeddedText) => textActual.push([tag, embeddedText]),
      (type, tagText) => tagsActual.push([type, tagText]),
    );

    expect(tagsActual).toEqual([
      [TagCallbackType.TEXT, 'Outer1'],
      [TagCallbackType.OPEN_TAG_START, 'tag1'],
      [TagCallbackType.OPEN_TAG, 'tag1'],
      [TagCallbackType.TEXT, 'Inner1'],
      [TagCallbackType.OPEN_TAG_START, 'tag11'],
      [TagCallbackType.OPEN_TAG, 'tag11'],
      [TagCallbackType.TEXT, 'Inner11'],
      [TagCallbackType.CLOSE_TAG, 'tag11'],
      [TagCallbackType.TEXT, 'Inner1'],
      [TagCallbackType.CLOSE_TAG, 'tag1'],
      [TagCallbackType.TEXT, 'Outer2'],
      [TagCallbackType.OPEN_TAG_START, 'tag2'],
      [TagCallbackType.OPEN_TAG, 'tag2'],
      [TagCallbackType.TEXT, 'Inner not closed'],
      [TagCallbackType.END, ''],
    ]);

    expect(textActual).toEqual([
      [undefined, 'Outer1'],
      ['tag1', 'Inner1'],
      ['tag11', 'Inner11'],
      ['tag1', 'Inner1'],
      [undefined, 'Outer2'],
      ['tag2', 'Inner not closed'],
    ]);
  });

  it('with linebreaks', () => {
    const textActual: Array<[string | undefined, string]> = [];
    const tagsActual: Array<[TagCallbackType, string]> = [];
    new LenientXmlParser().parse(
      'Outer1\n\n<Tag1>\nInner1\n </Tag1>\n\n<Tag2>\nInner not closed',
      (tag, embeddedText) => textActual.push([tag, embeddedText]),
      (type, tagText) => tagsActual.push([type, tagText]),
    );

    expect(tagsActual).toEqual([
      [TagCallbackType.TEXT, 'Outer1\n\n'],
      [TagCallbackType.OPEN_TAG_START, 'tag1'],
      [TagCallbackType.OPEN_TAG, 'tag1'],
      [TagCallbackType.TEXT, '\nInner1\n '],
      [TagCallbackType.CLOSE_TAG, 'tag1'],
      [TagCallbackType.TEXT, '\n\n'],
      [TagCallbackType.OPEN_TAG_START, 'tag2'],
      [TagCallbackType.OPEN_TAG, 'tag2'],
      [TagCallbackType.TEXT, '\nInner not closed'],
      [TagCallbackType.END, ''],
    ]);

    expect(textActual).toEqual([
      [undefined, 'Outer1\n\n'],
      ['tag1', '\nInner1\n '],
      [undefined, '\n\n'],
      ['tag2', '\nInner not closed'],
    ]);
  });

  it('not closing brackets at same level', () => {
    const textActual: Array<[string | undefined, string]> = [];
    const tagsActual: Array<[TagCallbackType, string]> = [];
    new LenientXmlParser().parse(
      'Outer1<Tag1>Inner1<Tag2>Inner2<Tag3>Inner3<Tag4>Inner4</Tag1>Outer2',
      (tag, embeddedText) => textActual.push([tag, embeddedText]),
      (type, tagText) => tagsActual.push([type, tagText]),
    );

    expect(tagsActual).toEqual([
      [TagCallbackType.TEXT, 'Outer1'],
      [TagCallbackType.OPEN_TAG_START, 'tag1'],
      [TagCallbackType.OPEN_TAG, 'tag1'],
      [TagCallbackType.TEXT, 'Inner1'],
      [TagCallbackType.OPEN_TAG_START, 'tag2'],
      [TagCallbackType.OPEN_TAG, 'tag2'],
      [TagCallbackType.TEXT, 'Inner2'],
      [TagCallbackType.OPEN_TAG_START, 'tag3'],
      [TagCallbackType.OPEN_TAG, 'tag3'],
      [TagCallbackType.TEXT, 'Inner3'],
      [TagCallbackType.OPEN_TAG_START, 'tag4'],
      [TagCallbackType.OPEN_TAG, 'tag4'],
      [TagCallbackType.TEXT, 'Inner4'],
      [TagCallbackType.CLOSE_TAG, 'tag4'],
      [TagCallbackType.CLOSE_TAG, 'tag3'],
      [TagCallbackType.CLOSE_TAG, 'tag2'],
      [TagCallbackType.CLOSE_TAG, 'tag1'],
      [TagCallbackType.TEXT, 'Outer2'],
      [TagCallbackType.END, ''],
    ]);

    expect(textActual).toEqual([
      [undefined, 'Outer1'],
      ['tag1', 'Inner1'],
      ['tag2', 'Inner2'],
      ['tag3', 'Inner3'],
      ['tag4', 'Inner4'],
      [undefined, 'Outer2'],
    ]);
  });

  it('get text', () => {
    function splitTextAtTag(text: string): [string, string] {
      let outsideTagText: string | undefined = '';
      let insideTagText: string | undefined = '';
      new LenientXmlParser(true).parse(text, (tag, embeddedText) => {
        if (tag != null) {
          insideTagText = joinStrings(insideTagText, embeddedText, ' ');
        } else {
          outsideTagText = joinStrings(outsideTagText, embeddedText, ' ');
        }
      });
      return [outsideTagText, insideTagText];
    }

    expect(splitTextAtTag('')).toEqual(['', '']);
    expect(splitTextAtTag('1')).toEqual(['1', '']);
    expect(splitTextAtTag('<t>2</t>')).toEqual(['', '2']);
    expect(splitTextAtTag('1<t>2')).toEqual(['1', '2']);
    expect(splitTextAtTag('1</t>')).toEqual(['1', '']);
    expect(splitTextAtTag('1</t>2')).toEqual(['1 2', '']);
    expect(splitTextAtTag('1<t>2</t>')).toEqual(['1', '2']);
    expect(splitTextAtTag('<t>2</t> 1')).toEqual(['1', '2']);
    expect(splitTextAtTag('1<t>2</t> 3')).toEqual(['1 3', '2']);
  });
});
