export function isPhone(value: string): boolean {
  return /^\+380\d{9}$/.test(value)
}
export function isRequired(value: unknown): boolean {
  return value !== null && value !== undefined && value !== ''
}
