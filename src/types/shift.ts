export interface Shift {
  id: string
  courierId: string
  startedAt: string
  endedAt?: string
  ordersCompleted: number
  totalDistance: number
}
