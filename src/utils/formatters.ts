export function formatDistance(meters: number): string {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1)} км`
    : `${meters} м`
}
export function formatPhone(phone: string): string {
  return phone.replace(/(\+38)(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 ($2) $3-$4-$5')
}
