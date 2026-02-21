export function findAndRemoveBoolParam(
  params: string[],
  flagTrue: string,
  flagFalse?: string,
  caseSensitive = false,
): boolean | undefined {
  if (flagFalse) {
    const index = params.findIndex((param) =>
      caseSensitive ? param === flagFalse : param.toLowerCase() === flagFalse?.toLowerCase(),
    );
    if (index !== -1) {
      params.splice(index, 1);
      return false;
    }
  }
  const index = params.findIndex((param) =>
    caseSensitive ? param === flagTrue : param.toLowerCase() === flagTrue.toLowerCase(),
  );
  if (index !== -1) {
    params.splice(index, 1);
    return true;
  }
  return undefined;
}

// find options that look like this --name=<number> and return numeric value
export function findAndRemoveNumberParam(params: string[], flagNumber: string): number | undefined {
  const index = params.findIndex((param) => param.startsWith(flagNumber));
  if (index !== -1) {
    // remove "--name="
    const numberString = params[index].substring(flagNumber.length);
    const numberValue = parseInt(numberString, 10);
    params.splice(index, 1);
    return Number.isNaN(numberValue) ? undefined : numberValue;
  }
  return undefined;
}

// find options that look like this --name=<string> and return numeric value
export function findAndRemoveStringParam(params: string[], flagString: string): string | undefined {
  const index = params.findIndex((param) => param.startsWith(flagString));
  if (index !== -1) {
    // remove "--name="
    const stringValue = params[index].substring(flagString.length);
    params.splice(index, 1);
    // turn empty strings into undefined
    return stringValue ? stringValue : undefined;
  }
  return undefined;
}
