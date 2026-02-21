import { toString } from './conversion-utils.ts';

// const SENTENCE_END_MARKERS: Array<string> = ["! ", ". ", "? ", ": ", "; ", "  "]; // ,-
// const punctuation = ',.?!';
// const whiteSpace = ' \t\n';
// const punctuationAndWhitespace = punctuation + whiteSpace;

export function countOccurences(text: string, searchString: string): number {
  if (!searchString) return 0; // avoid infinite loop
  let i = text.indexOf(searchString);
  let count = 0;
  while (i >= 0) {
    count++;
    i = text.indexOf(searchString, i + 1);
  }

  // let count = 0, i = 0;
  // for (i = 0; i < text.length; i++) {
  //     if (text[i] == toFind) {
  //         count++;
  //     }
  // }
  return count;
}

export function removeAllTrailingOccurances(str: string, character: string): string {
  let i = str.length;
  while (str[--i] === character);
  return str.slice(0, i + 1);
}

// export function removePrefixCaseInsensitiveIgnorePunctuation(text: string | null | undefined, prefix: string): string | null | undefined {
//   if (text == null) {
//     return text;
//   }

//   const prefixLower = prefix.toLowerCase();
//   // let skipped = 0;
//   let currentPrefixIndex = 0;
//   let i = 0;
//   for (i = 0; i < text.length && currentPrefixIndex < prefixLower.length; i++) {
//     const c = text[i];
//     if (c.toLocaleLowerCase() === prefixLower[currentPrefixIndex]) {
//       currentPrefixIndex++;
//     } else if (punctuationAndWhitespace.includes(c)) {
//       // found character to ignore, just skip
//       // skipped++;
//     } else {
//       // found non-matching character, keep the entire text
//       return text.trim();
//     }
//   }

//   if (currentPrefixIndex >= prefixLower.length) {
//     // we found the complerte prefix, no we also remove any remaining leading punctuation behind it
//     for (i; i < text.length; i++) {
//       const c = text[i];
//       if (!punctuationAndWhitespace.includes(c)) {
//         break;
//       }
//     }
//     const textNoPrefix = text.slice(i);
//     return textNoPrefix.trim();
//   }
//   return text.trim();
// }

export function removePrefixCaseInsensitive(
  text: string | null | undefined,
  prefix: string,
): string | null | undefined {
  if (text?.toLowerCase().startsWith(prefix)) {
    return text.slice(prefix.length);
  }
  return text;
}

export function removePrefix(text: string | null | undefined, prefix: string): string | null | undefined {
  if (text?.startsWith(prefix)) {
    return text.slice(prefix.length);
  }
  return text;
}

export function removeSuffix(text: string | null | undefined, suffix: string): string | null | undefined {
  if (text?.endsWith(suffix)) {
    return text.slice(0, text?.length - suffix.length);
  }
  return text;
}

export function startsWithAnyCaseInsensitive(
  text: string | null | undefined,
  prefixes: Array<string>,
): string | null | undefined {
  if (!text) {
    return text;
  }
  const textLowercase = text.toLowerCase();
  for (const prefix of prefixes) {
    if (textLowercase.startsWith(prefix)) {
      return prefix;
    }
  }
  return null;
}

// export function lastSentenceStartIndex(text: string): number {
//   let index = -1;
//   // replace all whitespace characters
//   const textCleaned = text.replace(/\s/g, " ");
//   for (const marker of SENTENCE_END_MARKERS) {
//     let i = textCleaned.lastIndexOf(marker);
//     if (i >= 0) {
//       // we want to get the position at the beginning of the next sentence
//       i += marker.length;
//     }
//     if (index < i) {
//       index = i;
//     }
//   }
//   return index;
// }

// export function splitTextAtSentenceBoundary(text: string, lastIndexOfSentenceEnd: number): [string, string] {
//   if (lastIndexOfSentenceEnd >= 0) {
//     return [text.substring(0, lastIndexOfSentenceEnd), lastIndexOfSentenceEnd < text.length ? text.substring(lastIndexOfSentenceEnd) : ""];
//   }
//   return [text, ""];
// }

export function isWhitespace(c: string): boolean {
  return c === ' ' || c === '\n' || c === '\r' || c === '\t';
}

export function first(v: string | undefined | Array<string>): string | null | undefined {
  if (v == null) {
    return null;
  } else if (v instanceof Array) {
    const va = v; // as Array<string>;
    return va.length > 0 ? va[0] : undefined;
  } else {
    return v;
  }
}

// typesafe conversion to string
export function asString(text: unknown): string | null | undefined {
  return toString(text);
}

// efficiently join two strings with extra trim checks
export function joinStrings(
  firstText: string | undefined,
  secondText: string | undefined,
  joinText: string,
  useTrim = false,
): string | undefined {
  const a = useTrim ? firstText?.trim() : firstText;
  const b = useTrim ? secondText?.trim() : secondText;
  if (a) {
    return b ? firstText + joinText + secondText : firstText;
  } else if (b) {
    return secondText;
  }
  // if both have empty content
  return undefined;
}

/**
 * Format a template string, replacing variables in curly brackets "{var1}" with values from a dictionary
 * Template variables that are not present in the dictionary are set to an empty string or kept,
 * @param template
 * @param data
 * @returns
 */
export function format(template: string, data: Record<string, string> = {}, keepMissingVariables = false): string {
  let result = '';
  let currentKey = '';
  let bracketStart = -1;

  for (let i = 0; i < template.length; i++) {
    const c = template[i];

    if (bracketStart < 0) {
      if (c === '{') {
        bracketStart = i;
        currentKey = '';
      } else {
        result += c;
      }
    } else {
      // Inside bracket handling
      switch (c) {
        case ' ':
        case '\t':
        case '\n':
          result += template.slice(bracketStart, i + 1);
          bracketStart = -1;
          break;

        case '{':
          result += template.slice(bracketStart, i);
          bracketStart = i;
          currentKey = '';
          break;

        case '}':
          if (data[currentKey] !== undefined) {
            result += data[currentKey];
          } else if (keepMissingVariables) {
            result += template.slice(bracketStart, i + 1);
          }
          bracketStart = -1;
          break;

        default:
          currentKey += c;
      }
    }
  }

  // Handle unclosed brackets
  if (bracketStart >= 0) {
    result += template.slice(bracketStart);
  }

  return result;
}

/**
 * Generates a random URL-safe string of the specified length.
 * @param length The length of the generated string.
 * @returns A random URL-safe string.
 */
export function generateRandomUrlSafeString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars.charAt(array[i] % chars.length);
  }
  return result;
}
