import type { Location } from './location'
export type OrderStatus = 'new' | 'accepted' | 'in_progress' | 'delivered' | 'cancelled'
export interface Order {
  id: string
  number: string
  status: OrderStatus
  client: { name: string; phone: string }
  pickupAddress: string
  deliveryAddress: string
  pickupLocation: Location
  deliveryLocation: Location
  distance: number
  createdAt: string
}
