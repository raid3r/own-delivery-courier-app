export function getSafeTimestamp(dateLike: string | Date | null | undefined): number {
  if (!dateLike) return 0
  const value = new Date(dateLike).getTime()
  return Number.isFinite(value) ? value : 0
}

export function startOfToday(baseDate: Date = new Date()): Date {
  return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate())
}

export function startOfWeek(baseDate: Date = new Date()): Date {
  const start = startOfToday(baseDate)
  const day = start.getDay()
  const diffToMonday = day === 0 ? 6 : day - 1
  start.setDate(start.getDate() - diffToMonday)
  return start
}

export function isTimestampInDay(timestamp: number, dayStart: Date): boolean {
  const nextDayStart = new Date(dayStart)
  nextDayStart.setDate(nextDayStart.getDate() + 1)
  return timestamp >= dayStart.getTime() && timestamp < nextDayStart.getTime()
}

export function formatTime24(iso: string, locale = 'en-US'): string | undefined {
  const date = new Date(iso)
  if (!Number.isFinite(date.getTime())) return undefined
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function formatRelativeDateLabel(dateIso: string, locale = 'en-US'): string {
  const date = new Date(dateIso)
  const today = startOfToday()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const itemDate = startOfToday(date)

  if (itemDate.getTime() === today.getTime()) return 'Today'
  if (itemDate.getTime() === yesterday.getTime()) return 'Yesterday'

  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatTime(iso: string): string {
  return formatTime24(iso, 'uk-UA') ?? '--:--'
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('uk-UA')
}
