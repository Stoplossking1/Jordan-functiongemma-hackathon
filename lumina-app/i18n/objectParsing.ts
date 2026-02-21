import { NestedStringRecord } from './translation-schema';

// Function to recursively build the keys object
export function buildKeysObject(obj: NestedStringRecord, currentPath = ''): NestedStringRecord {
  function buildRecursive(obj: string | NestedStringRecord, path: string): string | NestedStringRecord {
    if (typeof obj !== 'object' || obj == null) {
      return path;
    }

    const result: NestedStringRecord = {};
    for (const key in obj) {
      const newPath = path ? `${path}.${key}` : key;
      result[key] = buildRecursive(obj[key], newPath);
    }
    return result;
  }

  return buildRecursive(obj, currentPath) as NestedStringRecord;
}

/**
 * Extract template variables from a translation string
 * @param str The translation string containing template variables like {{name}}
 * @returns Array of variable names
 */
export function extractTemplateVars(str: string): string[] {
  const matches = str.match(/{{([^{}]+)}}/g);
  if (!matches) return [];

  return matches.map((match) => match.slice(2, -2).trim());
}

/**
 * Recursively finds all template parameters ({{param}}) in JSON values
 * @param obj - The JSON object to inspect
 * @returns Record mapping JSON paths to arrays of parameter names
 *
 * Example:
 * Input: { "auth": { "welcome": "Hello {{name}}, {{count}} items" } }
 * Output: { "auth.welcome": ["name", "count"] }
 */
export function findTemplateParameters(obj: NestedStringRecord): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  /**
   * @param current - Current object/value being inspected
   * @param path - Current path in dot notation (e.g., "auth.welcome")
   */
  function traverse(current: NestedStringRecord | string, path = ''): void {
    // Handle null/undefined
    if (current == null) {
      return;
    }

    // Handle string values - extract parameters
    if (typeof current === 'string') {
      const templateVars = extractTemplateVars(current);

      // Only add to result if we found parameters
      if (templateVars.length > 0) {
        result[path] = templateVars;
      }
      return;
    }

    // Handle objects
    if (typeof current === 'object') {
      for (const key in current) {
        const newPath = path ? `${path}.${key}` : key;
        traverse(current[key], newPath);
      }
      return;
    }

    // Other types (array, number, boolean, etc.) don't contain templates
  }

  traverse(obj);
  return result;
}

/**
 * Helper function to flatten nested keys for generating the union type
 */
export function flattenKeys(obj: NestedStringRecord, prefix = ''): Record<string, string> {
  let result: Record<string, string> = {};

  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      result[newKey] = value;
    } else {
      const nestedKeys = flattenKeys(value, newKey);
      result = { ...result, ...nestedKeys };
    }
  }

  return result;
}
