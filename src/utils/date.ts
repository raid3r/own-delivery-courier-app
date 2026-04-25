export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
}
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('uk-UA')
}
