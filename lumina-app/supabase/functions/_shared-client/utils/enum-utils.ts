// support functionality for iterating enums and turning them into arrays
// iterate all keys
// for (const t in SummaryTags) {
//   console.log(t);
// }

// iterate all values
// for (const t of enumKeys(SummaryTags)) {
//   const value = SummaryTags[t];
//   console.log(value);
// }
export function enumKeys<O extends object, K extends keyof O = keyof O>(obj: O): Array<K> {
  return Object.keys(obj).filter((k) => !Number.isNaN(k)) as Array<K>;
}

export function enumValueFromStringValue<T>(enumEntries: Record<string, T>, value?: string | null): T | undefined {
  if (value != null) {
    const values = Object.values(enumEntries) as Array<string>;
    const valueIndex = values.indexOf(value);
    if (valueIndex !== undefined && valueIndex >= 0) {
      return value as T;
    }
  }
  return undefined;
}

/**
 * Formats an enum string value into a human-readable format.
 * Converts strings like "FULL_GYM" to "Full Gym" or "BENCH_AND_BRACKETS" to "Bench And Brackets"
 *
 * @param enumValue The enum value to format
 * @returns A formatted, human-readable string
 */
export function formatEnumString(enumValue: string): string {
  if (!enumValue) return '';

  // Replace underscores with spaces and split into words
  const words = enumValue.split('_').filter((word) => word.length > 0);

  // Capitalize first letter of each word and make the rest lowercase
  const formattedWords = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

  // Join the formatted words with spaces
  return formattedWords.join(' ');
}
