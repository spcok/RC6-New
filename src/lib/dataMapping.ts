// Helper to convert a single string from snake_case to camelCase
export const toCamelCase = (str: string): string => {
  // Preserves leading underscores (e.g., _modified -> _modified) 
  // but converts internal snake_case (animal_id -> animalId)
  if (str.startsWith('_')) return str; 
  
  return str.replace(/([-_][a-z0-9])/gi, (match) => {
    return match.toUpperCase().replace('-', '').replace('_', '');
  });
};

// Deep mapping function
export const mapToCamelCase = <T>(obj: any): T => {
  // 1. Bail out early for null, undefined, or primitives
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // 2. Bail out for Date objects (they are typeof 'object' but shouldn't be mapped)
  if (obj instanceof Date) {
    return obj as any;
  }

  // 3. CORRECT ARRAY HANDLING: Map over arrays and return a new Array
  if (Array.isArray(obj)) {
    return obj.map((item) => mapToCamelCase(item)) as any;
  }

  // 4. Object handling: Create a new object with camelCase keys
  const camelObj: Record<string, any> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = toCamelCase(key);
      camelObj[camelKey] = mapToCamelCase(obj[key]);
    }
  }

  return camelObj as T;
};
