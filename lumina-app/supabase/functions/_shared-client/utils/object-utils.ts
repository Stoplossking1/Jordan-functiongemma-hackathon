export const DEFAULT_DB_KEYS_TO_OMIT = ['id', 'createdAt', 'updatedAt'];

export function hasRecords(obj: Record<string, any>): boolean {
  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      return true;
    }
  }
  return false;
}

export function sortRecords<T>(obj: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(obj).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)));
}

export function sortRecordsCopy<T>(obj: Record<string, T>, copy: Record<string, T>) {
  const sorted = sortRecords(obj);
  // Clear and reassign all properties
  for (const key of Object.keys(copy)) {
    delete obj[key];
  }
  Object.assign(copy, sorted);
}

export function sortRecordsInPlace<T>(obj: Record<string, T>): void {
  const sorted = sortRecords(obj);
  // Clear and reassign all properties
  for (const key of Object.keys(obj)) {
    delete obj[key];
  }
  Object.assign(obj, sorted);
}

export function getOrAddArray<K extends string | number | symbol, V>(obj: Record<K, V[]>, key: K): V[] {
  let array = obj[key];
  if (!array) {
    array = [];
    obj[key] = array;
  }
  return array;
}

export function getOrAdd<K extends string | number | symbol, V>(
  obj: Record<K, V>,
  key: K,
  createEntry: (key: K) => V,
): V {
  let entry = obj[key];
  if (entry === undefined) {
    entry = createEntry(key);
    obj[key] = entry;
  }
  return entry;
}

// // Start iterating over each key of the object.
// for (const key in object2) {
//   // 1). When object1 has the same key as object2.
//   if (object1[key]) {
//     // 1.1). When both values are type of object then again recursively call merge on those inner objects.
//     if (typeof object1[key] === 'object' && typeof object2[key] === 'object') {
//       object1[key] = mergeInPlace(object1[key], object2[key]);
//     } else {
//       // 1.2). When both values are some other type then update the value in object1 from object2.
//       object1[key] = object2[key];
//     }
//   } else {
//     // 2). When object1 doesn't have the same key as object2.
//     if (typeof object2[key] === 'object') {
//       // 2.1). If the value is of type object, then copy the entire value into object1.
//       Object.assign(object1, { [key]: object2[key] });
//     } else {
//       // 2.2). If both objects are totally different then copy all keys from object2 to object1.
//       Object.assign(object1, object2);
//     }
//   }
// }
export function mergeDeepInPlace(object1: any, object2: any, mergeArrays = false, sortObjectKeys = false): any {
  if (object1 == null) return object2;
  if (object2 == null) return object1;

  if (Array.isArray(object1) && Array.isArray(object2)) {
    if (mergeArrays) {
      console.warn('TODO: add support for merging arrays of objects with same key');
    } else {
      object1.push(...object2);
    }
    return object1;
  }

  for (const key in object2) {
    const value1 = object1[key];
    const value2 = object2[key];
    if (typeof value1 === 'object' && typeof value2 === 'object') {
      object1[key] = mergeDeepInPlace(value1, value2, mergeArrays, sortObjectKeys);
    } else if (value2 !== undefined) {
      object1[key] = value2;
    }
  }
  if (sortObjectKeys) {
    sortRecordsInPlace(object1);
  }
  return object1;
}

export function mergeDeep(object1: any, object2: any, mergeArrays = false): any {
  // Handle null/undefined cases
  if (object1 == null) return object2;
  if (object2 == null) return object1;

  if (Array.isArray(object1) && Array.isArray(object2)) {
    const mergedArray: any[] = [...object1];
    if (mergeArrays) {
      const unmergedArray: any[] = [];
      for (const item2 of object2) {
        if (typeof item2 !== 'object' || item2 === null) {
          // For primitives, only add if not already present
          if (!mergedArray.includes(item2)) {
            unmergedArray.push(item2);
          }
        } else {
          let found = false;
          for (const [i, item1] of mergedArray.entries()) {
            if (typeof item1 === 'object' && item1 !== null) {
              if (Object.keys(item1).some((key) => Object.hasOwn(item2, key))) {
                mergedArray[i] = mergeDeep(item1, item2, mergeArrays);
                found = true;
                break;
              }
            }
          }
          if (!found) {
            // don't yet merge so we don't use this entry for merging in the remaining loops
            unmergedArray.push(item2);
          }
        }
      }
      mergedArray.push(...unmergedArray);
    } else {
      // simply concatenate both arrayd
      mergedArray.push(...object2);
    }

    return mergedArray;
  }

  // Create new object from object1
  const result = Array.isArray(object1) ? [...object1] : { ...object1 };

  // Iterate through object2's properties
  for (const key in object2) {
    const value1 = object1[key];
    const value2 = object2[key];

    // Handle nested objects/arrays
    if (typeof value1 === 'object' && typeof value2 === 'object') {
      result[key] = mergeDeep(value1, value2, mergeArrays);
    } else if (value2 !== undefined) {
      result[key] = value2;
    }
  }

  return result;
}

export function diffDeep(objectNew: any, objectOld: any, ignoreArrayOrder = false): any | undefined {
  if (objectNew == null) return undefined;
  if (objectOld == null) return objectNew;

  // Handle arrays
  if (Array.isArray(objectNew)) {
    if (!Array.isArray(objectOld)) return objectNew;

    // const result = objectNew.filter((item, index) => {
    //   return !objectOld.includes(item);
    // });
    let result: any[];
    if (ignoreArrayOrder) {
      result = objectNew.filter((item1) => {
        return !objectOld.some((item2) => isDeepEqual(item1, item2));
      });
    } else {
      result = [];
      let stillMatching = true;
      for (const [i, item1] of objectNew.entries()) {
        if (stillMatching) {
          const item2 = objectOld[i];
          if (item2 == null || !isDeepEqual(item1, item2)) {
            stillMatching = false;
          }
        }
        if (!stillMatching) {
          // add remaining items to the result
          result.push(item1);
        }
      }
    }

    return result.length > 0 ? result : undefined;
  }

  // Handle objects
  if (typeof objectNew === 'object' && typeof objectOld === 'object') {
    const complement: any = {};
    let hasComplement = false;

    for (const key in objectNew) {
      // Key doesn't exist in objectOld
      if (!(key in objectOld)) {
        complement[key] = objectNew[key];
        hasComplement = true;
        continue;
      }

      // Recursive check for nested objects/arrays
      const diff = diffDeep(objectNew[key], objectOld[key], ignoreArrayOrder);
      if (diff !== undefined) {
        complement[key] = diff;
        hasComplement = true;
      }
    }

    return hasComplement ? complement : undefined;
  }

  // Handle primitive values
  return objectNew === objectOld ? undefined : objectNew;
}

export function isDeepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;

  if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!Object.hasOwn(obj2, key)) return false;
    if (!isDeepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
}

/**
 * Creates a new object with specified keys omitted from the original object.
 *
 * @template T - Type of the source object
 * @template K - Type of the keys to omit (must be keys of T)
 *
 * @param {T} obj - The source object to omit properties from
 * @param {K[]} keysToOmit - Array of keys to exclude from the resulting object
 *
 * @returns {Omit<T, K>} A new object containing all properties from the original except those specified in keysToOmit
 *
 * @example
 * const person = { name: "John", age: 30, ssn: "123-45-6789" };
 * const publicInfo = omit(person, ["ssn"]);
 * // Result: { name: "John", age: 30 }
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keysToOmit: K[],
  omitDefaultDbValues: boolean,
): Omit<T, K> {
  const keysToOmitFromObject = omitDefaultDbValues ? keysToOmit.concat(DEFAULT_DB_KEYS_TO_OMIT as K[]) : keysToOmit;
  const result = { ...obj };
  for (const key of keysToOmitFromObject) {
    delete result[key];
  }
  return result satisfies Omit<T, K>;
}
