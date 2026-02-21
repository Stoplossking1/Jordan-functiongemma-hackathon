import { describe, expect, test } from '@jest/globals';
import {
  parseCodeBlocks,
  CodeBlockParserCallback,
  chooseFence,
  CODE_FENCE_DEFAULT,
  CODE_FENCE_4_TICKS,
  CODE_FENCES_XML,
} from './CodeBlockParser.ts';

type CodeBlock = {
  content: string;
  lang?: string;
  properlyTerminated: boolean;
};

describe('parseCodeBlocks', () => {
  // Helper to collect results from parser
  function collectCodeBlocks(text: string): [CodeBlock[], string[]] {
    const codeBlocks: CodeBlock[] = [];
    const nonCodeBlocks: string[] = [];

    const callback: CodeBlockParserCallback = (content, isCode, lang, properlyTerminated) => {
      if (isCode) {
        codeBlocks.push({ content, lang, properlyTerminated });
      } else {
        nonCodeBlocks.push(content);
      }
    };

    parseCodeBlocks(text, callback);
    return [codeBlocks, nonCodeBlocks];
  }

  test('parses simple backtick code block with language', () => {
    const text = 'Some text\n```javascript\nconst x = 1;\nconsole.log(x);\n```\nMore text';
    const [codeBlocks, textBlocks] = collectCodeBlocks(text);

    expect(codeBlocks).toHaveLength(1);
    expect(codeBlocks[0]).toEqual({
      content: 'const x = 1;\nconsole.log(x);\n',
      lang: 'javascript',
      properlyTerminated: true,
    });
    expect(textBlocks).toEqual(['Some text\n', 'More text']);
  });

  test('parses code block without language specification', () => {
    const text = 'Some text\n```\nconst x = 1;\nconsole.log(x);\n```\nMore text';
    const [codeBlocks, textBlocks] = collectCodeBlocks(text);

    expect(codeBlocks).toHaveLength(1);
    expect(codeBlocks[0]).toEqual({
      content: 'const x = 1;\nconsole.log(x);\n',
      lang: undefined,
      properlyTerminated: true,
    });
    expect(textBlocks).toEqual(['Some text\n', 'More text']);
  });

  test('handles HTML-style code codeBlocks', () => {
    const text = 'Some text\n<code>const x = 1;\nconsole.log(x);</code>\nMore text';
    const [codeBlocks, textBlocks] = collectCodeBlocks(text);

    expect(codeBlocks).toHaveLength(1);
    expect(codeBlocks[0]).toEqual({
      content: 'const x = 1;\nconsole.log(x);',
      lang: undefined, // HTML style doesn't have language info
      properlyTerminated: true,
    });
    expect(textBlocks).toEqual(['Some text\n', 'More text']);
  });

  test('handles unclosed code block', () => {
    const text = 'Some text\n```javascript\nconst x = 1;\nconsole.log(x);';
    const [codeBlocks, textBlocks] = collectCodeBlocks(text);

    expect(codeBlocks).toHaveLength(1);
    expect(codeBlocks[0]).toEqual({
      content: 'const x = 1;\nconsole.log(x);',
      lang: 'javascript',
      properlyTerminated: false,
    });
    expect(textBlocks).toEqual(['Some text\n']);
  });

  test('handles multiple code codeBlocks', () => {
    const text = '```javascript\nconst x = 1;\n```\nSome text\n<pre>let y = 2;</pre>';
    const [codeBlocks, textBlocks] = collectCodeBlocks(text);

    expect(codeBlocks).toHaveLength(2);
    expect(codeBlocks[0]).toEqual({
      content: 'const x = 1;\n',
      lang: 'javascript',
      properlyTerminated: true,
    });
    expect(codeBlocks[1]).toEqual({
      content: 'let y = 2;',
      lang: undefined,
      properlyTerminated: true,
    });
    expect(textBlocks).toEqual(['Some text\n']);
  });

  test('handles nested fence characters in code block', () => {
    const text = '```javascript\nfunction() {\n  console.log("```");\n}\n```';
    const [codeBlocks, textBlocks] = collectCodeBlocks(text);

    expect(codeBlocks).toHaveLength(1);
    expect(codeBlocks[0]).toEqual({
      content: 'function() {\n  console.log("```");\n}\n',
      lang: 'javascript',
      properlyTerminated: true,
    });
    expect(textBlocks).toEqual([]);
  });

  test('handles code codeBlocks with fence indendation', () => {
    const text = 'Some text\n  ```typescript\n  const x = 1;\n  ```\nMore text';
    const [codeBlocks, textBlocks] = collectCodeBlocks(text);

    expect(codeBlocks).toHaveLength(1);
    expect(codeBlocks[0]).toEqual({
      content: '  const x = 1;\n',
      lang: 'typescript',
      properlyTerminated: true,
    });
    expect(textBlocks).toEqual(['Some text\n  ', 'More text']);
  });

  test('handles closing fence with leading whitespace', () => {
    const text = '```\nsome code\n  ```\n';
    const [codeBlocks, textBlocks] = collectCodeBlocks(text);

    expect(codeBlocks).toHaveLength(1);
    expect(codeBlocks[0]).toEqual({
      content: 'some code\n',
      lang: undefined,
      properlyTerminated: true,
    });
    expect(textBlocks).toEqual([]);
  });

  test('handles four-backtick code codeBlocks', () => {
    const text = 'Text\n````sql\nSELECT * FROM users;\n````\nMore text';
    const [codeBlocks, textBlocks] = collectCodeBlocks(text);

    expect(codeBlocks).toHaveLength(1);
    expect(codeBlocks[0]).toEqual({
      content: 'SELECT * FROM users;\n',
      lang: 'sql',
      properlyTerminated: true,
    });
    expect(textBlocks).toEqual(['Text\n', 'More text']);
  });

  test('handles sourcecode HTML tag in the middle of text', () => {
    const text = 'text<sourcecode>\nfunction test() { return true; }</sourcecode>';
    const [codeBlocks, textBlocks] = collectCodeBlocks(text);

    expect(codeBlocks).toHaveLength(1);
    expect(codeBlocks[0]).toEqual({
      content: '\nfunction test() { return true; }',
      lang: undefined,
      properlyTerminated: true,
    });
    expect(textBlocks).toEqual(['text']);
  });

  test('handles sourcecode HTML tag', () => {
    const text = '<sourcecode>\nfunction test() { return true; }\n</sourcecode>';
    const [codeBlocks, textBlocks] = collectCodeBlocks(text);

    expect(codeBlocks).toHaveLength(1);
    expect(codeBlocks[0]).toEqual({
      content: '\nfunction test() { return true; }\n',
      lang: undefined,
      properlyTerminated: true,
    });
    expect(textBlocks).toEqual([]);
  });

  test('handles code codeBlocks with indentation and other code-block embedded', () => {
    const text = 'Some text\n  ```typescript\n  const x = 1;\n  <pre>let y = 2;</pre>\n```';
    const [codeBlocks, textBlocks] = collectCodeBlocks(text);

    expect(codeBlocks).toHaveLength(1);
    expect(codeBlocks[0]).toEqual({
      content: '  const x = 1;\n  <pre>let y = 2;</pre>\n',
      lang: 'typescript',
      properlyTerminated: true,
    });
    expect(textBlocks).toEqual(['Some text\n  ']);
  });

  test('handles HTML code codeBlocks with indentation and other code-block embedded', () => {
    const text = 'Some text\n  <pre>const x = 1;\n```typescript\n let y = 2;\n```</pre>';
    const [codeBlocks, textBlocks] = collectCodeBlocks(text);

    expect(codeBlocks).toHaveLength(1);
    expect(codeBlocks[0]).toEqual({
      content: 'const x = 1;\n```typescript\n let y = 2;\n```',
      lang: undefined,
      properlyTerminated: true,
    });
    expect(textBlocks).toEqual(['Some text\n  ']);
  });

  test('handles code codeBlocks with indentation and other code-block embedded without closing it', () => {
    const text = 'Some text\n  ```typescript\n  const x = 1;\n  <pre>let y = 2;</pre>';
    const [codeBlocks, textBlocks] = collectCodeBlocks(text);

    expect(codeBlocks).toHaveLength(1);
    expect(codeBlocks[0]).toEqual({
      content: '  const x = 1;\n  <pre>let y = 2;</pre>',
      lang: 'typescript',
      properlyTerminated: false,
    });
    expect(textBlocks).toEqual(['Some text\n  ']);
  });

  test('handles a new HTML code block starting without properly closing the previous one', () => {
    const text = '<code>   \nlet x = 1;\n<code>\nlet y = 2;\n</code>';
    const [codeBlocks, textBlocks] = collectCodeBlocks(text);

    // The JavaScript block wasn't properly closed
    expect(codeBlocks).toHaveLength(1);
    expect(codeBlocks[0]).toEqual({
      content: '   \nlet x = 1;\n<code>\nlet y = 2;\n',
      lang: undefined,
      properlyTerminated: true,
    });
    expect(textBlocks).toEqual([]);
  });

  test('handles empty code blocks', () => {
    const text = 'Text\n```\n```\nMore text';
    const [codeBlocks, textBlocks] = collectCodeBlocks(text);

    expect(codeBlocks).toHaveLength(1);
    expect(codeBlocks[0]).toEqual({
      content: '',
      lang: undefined,
      properlyTerminated: true,
    });
    expect(textBlocks).toEqual(['Text\n', 'More text']);
  });

  test('ignores code blocks in the middle of a line', () => {
    const text = 'This is not a ```code block``` because it does not start on its own line';
    const [codeBlocks, textBlocks] = collectCodeBlocks(text);

    expect(codeBlocks).toHaveLength(0);
    expect(textBlocks).toEqual(['This is not a ```code block``` because it does not start on its own line']);
  });

  test('handles code blocks at the very start of text', () => {
    const text = '```python\nimport os\n```\nSome text';
    const [codeBlocks, textBlocks] = collectCodeBlocks(text);

    expect(codeBlocks).toHaveLength(1);
    expect(codeBlocks[0]).toEqual({
      content: 'import os\n',
      lang: 'python',
      properlyTerminated: true,
    });
    expect(textBlocks).toEqual(['Some text']);
  });

  test('handles code blocks at the very end of text', () => {
    const text = 'Some text\n```python\nimport os';
    const [codeBlocks, textBlocks] = collectCodeBlocks(text);

    expect(codeBlocks).toHaveLength(1);
    expect(codeBlocks[0]).toEqual({
      content: 'import os',
      lang: 'python',
      properlyTerminated: false,
    });
    expect(textBlocks).toEqual(['Some text\n']);
  });

  test('handles code blocks with white-space', () => {
    const text = 'Text\n  ``` sql \nSELECT * FROM users;\n  ```\nMore text';
    const [codeBlocks, textBlocks] = collectCodeBlocks(text);

    expect(codeBlocks).toHaveLength(1);
    expect(codeBlocks[0]).toEqual({
      content: 'SELECT * FROM users;\n',
      lang: 'sql',
      properlyTerminated: true,
    });
    expect(textBlocks).toEqual(['Text\n  ', 'More text']);
  });
});

describe('chooseFence', () => {
  test('parse default fence', () => {
    // fence not in the content
    expect(chooseFence(['abc', '123'])).toEqual(CODE_FENCE_DEFAULT);
    expect(chooseFence(['abc\ncde\n', '123\n456\n'])).toEqual(CODE_FENCE_DEFAULT);

    // fence not at the line beginning
    expect(chooseFence([`abc${CODE_FENCE_DEFAULT[0]}\ncde\n`, '123\n456\n789'])).toEqual(CODE_FENCE_DEFAULT);
    expect(chooseFence([` ${CODE_FENCE_DEFAULT[0]}abc\ncde\n`, '123\n456\n789'])).toEqual(CODE_FENCE_DEFAULT);
    expect(chooseFence([`abc\ncde\n`, `123\n456${CODE_FENCE_DEFAULT[0]}\n789`])).toEqual(CODE_FENCE_DEFAULT);
    expect(chooseFence([`abc\ncde\n`, `123\n456\n ${CODE_FENCE_DEFAULT[0]}789`])).toEqual(CODE_FENCE_DEFAULT);

    // fence at the line beginning
    expect(chooseFence([`${CODE_FENCE_DEFAULT[0]}abc\ncde\n`, '123\n456\n789'])).toEqual(CODE_FENCE_4_TICKS);
    expect(chooseFence([`abc\ncde\n`, `123\n456\n${CODE_FENCE_DEFAULT[0]}789`])).toEqual(CODE_FENCE_4_TICKS);
    expect(chooseFence([`abc\ncde\n`, `123\n456\n789\n${CODE_FENCE_DEFAULT[0]}`])).toEqual(CODE_FENCE_4_TICKS);

    // 4 back ticks not at beginning of line
    expect(chooseFence([`abc${CODE_FENCE_4_TICKS[0]}\ncde\n`, '123\n456\n789'])).toEqual(CODE_FENCE_DEFAULT);
    expect(chooseFence([`abc\ncde\n`, `123\n456${CODE_FENCE_4_TICKS[0]}\n789`])).toEqual(CODE_FENCE_DEFAULT);

    // 4 back ticks at beginning of line
    expect(chooseFence([`${CODE_FENCE_4_TICKS[0]}abc\ncde\n`, '123\n456\n789'])).toEqual(CODE_FENCES_XML[0]);
    expect(chooseFence([`abc\ncde\n`, `123\n456\n${CODE_FENCE_4_TICKS[0]}789`])).toEqual(CODE_FENCES_XML[0]);

    // 4 back ticks and xml 1 at beginning of line
    expect(chooseFence([`${CODE_FENCE_4_TICKS[0]}abc\ncde\n`, `123\n${CODE_FENCES_XML[0]}456\n789`])).toEqual(
      CODE_FENCES_XML[1],
    );

    // 3 & 4 back ticks and xml 1 at beginning of line
    expect(
      chooseFence([`${CODE_FENCE_4_TICKS[0]}abc\n${CODE_FENCE_DEFAULT[0]}cde\n`, `123\n${CODE_FENCES_XML[0]}456\n789`]),
    ).toEqual(CODE_FENCES_XML[1]);
  });
});
