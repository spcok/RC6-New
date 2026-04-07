export function toCamelCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
    .replace(/^[A-Z]/, (char) => char.toLowerCase());
}

export function mapToCamelCase<T>(obj: Record<string, unknown> | Record<string, unknown>[]): T | T[] {
  if (Array.isArray(obj)) {
    return obj.map(item => mapToCamelCase<T>(item) as T);
  }
  const newObj: Record<string, unknown> = {};
  for (const key in obj) {
    const camelKey = toCamelCase(key);
    newObj[camelKey] = obj[key];
  }
  return newObj as T;
}
