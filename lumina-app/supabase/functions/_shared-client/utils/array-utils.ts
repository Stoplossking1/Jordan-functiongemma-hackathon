export function mapNotNull<I, O>(elements: Array<I>, callbackfn: (element: I) => O | null | undefined): Array<O> {
  const objArray: Array<O> = [];
  for (const element of elements) {
    const obj = callbackfn(element);
    if (obj) {
      objArray.push(obj);
    }
  }
  return objArray;
}

export function mapNotNullAvoidEmpty<I, O>(
  elements: I[] | undefined,
  callbackfn: (element: I) => O | null | undefined,
): Array<O> | undefined {
  let objArray: Array<O> | undefined;
  if (elements?.length) {
    for (const element of elements) {
      const obj = callbackfn(element);
      if (obj) {
        (objArray ??= []).push(obj);
      }
    }
  }
  return objArray;
}

export function addIfNotNull<T>(list: Array<T>, element?: T | null): Array<T> {
  if (element != null) {
    list.push(element);
  }
  return list;
}

export function addOrCreateIfNotNull<T>(list?: Array<T>, element?: T | null): Array<T> | undefined {
  if (element != null) {
    list ??= [];
    list.push(element);
  }
  return list;
}

export function makeUndefinedIfEmpty<T>(list?: Array<T>): Array<T> | undefined {
  return list?.length ? list : undefined;
}

export function firstElement<T>(list?: Array<T> | null): T | undefined {
  if (list != null && list.length > 0) {
    return list[0];
  }
  return undefined;
}

export function lastElement<T>(list?: Array<T> | null): T | undefined {
  if (list != null && list.length > 0) {
    return list[list.length - 1];
  }
  return undefined;
}
