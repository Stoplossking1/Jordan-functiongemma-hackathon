export function getRandomInt(min: number, maxInclusive: number): number {
  return Math.floor(Math.random() * (maxInclusive - min + 1)) + min;
}

export function parseIntOrDefault(value: string | undefined, defaultValue: number): number {
  if (value == null || value?.trim() === '') {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    console.error('Error parsing value to int:', value);
    return defaultValue;
  }
  return parsed;
}
