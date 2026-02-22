import { enumValueFromStringValue } from './enum-utils.ts';
import { mapNotNull } from './array-utils.ts';

/**
 * Parses a string to an integer. Returns undefined if the input is empty or not a valid integer.
 * @param text The string to parse
 * @param radix Optional. An integer between 2 and 36 that represents the radix (default is 10)
 * @returns A number if parsing was successful, otherwise undefined
 */
export function parseStringToInt(text: string | null | undefined, radix = 10): number | undefined {
  if (!text) return undefined;

  const numValue = parseInt(text, radix);
  return isNaN(numValue) ? undefined : numValue;
}

export function fromJsonArray<T>(
  jsonArray: unknown,
  callbackfn: (jsonElement: unknown) => T | null | undefined,
): T[] | null | undefined {
  if (jsonArray != null) {
    if (Array.isArray(jsonArray)) {
      const objArray = mapNotNull(jsonArray, callbackfn);
      return objArray;
    } else {
      // for every other type
      return null;
    }
  }
  // keep value as null or undefined, useful when parsing json
  return jsonArray;
}

export function toJsonArray<T>(
  objArray: T[] | null | undefined,
  callbackfn: (obj: T) => any | null | undefined,
): any[] | null | undefined {
  if (objArray != null) {
    const jsonArray = mapNotNull(objArray, callbackfn);
    return jsonArray;
  }
  return undefined; // use "undefined" so field is excluded from final json text string
}

export function toBoolean(json: unknown): boolean | null | undefined {
  if (typeof json === 'boolean') {
    return json;
  } else if (json === undefined) {
    // keep value as undefined, useful when parsing json
    return json;
  }
  // for every other type
  return null;
}

export function toInt(json: unknown): number | null | undefined {
  if (typeof json === 'number') {
    // convert float to int if in wrong format
    return Number.isInteger(json) ? json : Math.trunc(json);
  } else if (json === undefined) {
    // keep value as undefined, useful when parsing json
    return json;
  }
  // for every other type
  return null;
}

export function toFloat(json: unknown): number | null | undefined {
  if (typeof json === 'number') {
    return json;
  } else if (json === undefined) {
    // keep value as undefined, useful when parsing json
    return json;
  }
  // for every other type
  return null;
}

export function toString(json: unknown): string | null | undefined {
  if (typeof json === 'string') {
    return json;
  } else if (json === undefined) {
    // keep value as undefined, useful when parsing json
    return json;
  }
  // for every other type
  return null;
}

export function toTimestamp(json: unknown): Date | null | undefined {
  const string = toString(json);
  return string != null ? new Date(string) : string;
}

// UUID format: either 32 hex digits straight or 8-4-4-4-12 format
const uuidPattern = /^[0-9a-f]{32}$|^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(uuidString: string): boolean {
  return uuidPattern.test(uuidString);
}

export function toUuid(json: unknown): string | null | undefined {
  const string = toString(json);
  if (string != null) {
    return isUuid(string) ? string : null;
  }
  return string;
}

export function toEnumValue<T>(enumEntries: Record<string, T>, json: unknown): T | null | undefined {
  const string = toString(json);
  return string != null ? enumValueFromStringValue(enumEntries, string) : string;
}
