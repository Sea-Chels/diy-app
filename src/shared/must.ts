/** `value`, unless it's null or undefined: then an error naming `what`, so a missing piece says which one. */
export function must<T>(value: T | null | undefined, what: string): T {
  if (value == null) throw new Error(`Missing ${what}`);
  return value;
}
