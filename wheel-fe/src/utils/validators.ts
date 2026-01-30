export function required(value: string): string | null {
  return value.trim().length === 0 ? 'This field is required' : null;
}
