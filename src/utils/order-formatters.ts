import type { AddressDto, OrderResponse } from '@/types/api'
import { API_ORDER_STATUS } from '@/constants/order-status-codes'

export type RouteUiStatus = 'transit' | 'priority' | 'pending'
export type HistoryUiStatus = 'delivered' | 'cancelled' | 'returned'

export interface RouteStatusMeta {
  status: RouteUiStatus
  statusLabel: string
  urgent?: boolean
}

export function formatAddressLine(address: AddressDto): string {
  const parts = [address.street, address.buildingNumber].filter(Boolean)
  return parts.length ? parts.join(' ') : 'Unknown address'
}

export function formatAddressDetails(address: AddressDto): string | undefined {
  const details = [address.city, address.apartmentNumber].filter(Boolean)
  return details.length ? details.join(', ') : undefined
}

export function formatOrderDeliveryAddress(order: OrderResponse): string {
  const address = order.deliveryAddress
  const parts = [address.city, address.street, address.buildingNumber].filter(Boolean)
  return parts.length ? parts.join(', ') : 'Unknown address'
}

export function mapRouteStatus(status: OrderResponse['status']): RouteStatusMeta | null {
  if (status === API_ORDER_STATUS.ASSIGNED) return { status: 'priority', statusLabel: 'Priority Pickup', urgent: true }
  if (status === API_ORDER_STATUS.PICKED_UP) return { status: 'pending', statusLabel: 'Picked Up' }
  if (status === API_ORDER_STATUS.IN_TRANSIT) return { status: 'transit', statusLabel: 'In Transit' }
  return null
}

export function mapHistoryStatus(status: OrderResponse['status']): HistoryUiStatus {
  if (status === API_ORDER_STATUS.DELIVERED) return 'delivered'
  if (status === API_ORDER_STATUS.CANCELLED) return 'cancelled'
  return 'returned'
}

