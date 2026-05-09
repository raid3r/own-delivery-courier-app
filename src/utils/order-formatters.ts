import type { AddressDto, OrderResponse } from '@/types/api'
import { API_ORDER_STATUS } from '@/constants/order-status-codes'

export type RouteUiStatus = 'transit' | 'priority' | 'pending'
export type HistoryUiStatus = 'delivered' | 'cancelled' | 'returned'

export interface RouteStatusMeta {
  status: RouteUiStatus
  statusLabel: string
  urgent?: boolean
}

export interface OrderProgressAction {
  label: string
  nextStatus: OrderResponse['status']
}

export function formatAddressLine(address: AddressDto): string {
  const parts = [address.street, address.buildingNumber].filter(Boolean)
  return parts.length ? parts.join(' ') : 'Unknown address'
}

export function formatAddressDetails(address: AddressDto): string | undefined {
  const details = [address.city, address.apartmentNumber].filter(Boolean)
  return details.length ? details.join(', ') : undefined
}

export function formatFullAddress(address: AddressDto): string {
  const parts = [
    address.city,
    address.street,
    address.buildingNumber,
    address.apartmentNumber,
  ].filter(Boolean)

  return parts.length ? parts.join(', ') : 'Unknown address'
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

export function getOrderStatusLabel(status: OrderResponse['status']): string {
  if (status === API_ORDER_STATUS.PENDING) return 'New'
  if (status === API_ORDER_STATUS.ASSIGNED) return 'Assigned'
  if (status === API_ORDER_STATUS.PICKED_UP) return 'Picked Up'
  if (status === API_ORDER_STATUS.IN_TRANSIT) return 'In Transit'
  if (status === API_ORDER_STATUS.DELIVERED) return 'Delivered'
  if (status === API_ORDER_STATUS.CANCELLED) return 'Cancelled'
  return 'Failed'
}

export function getOrderProgressAction(status: OrderResponse['status']): OrderProgressAction | null {
  if (status === API_ORDER_STATUS.ASSIGNED) {
    return {
      label: 'Confirm Pickup',
      nextStatus: API_ORDER_STATUS.PICKED_UP,
    }
  }

  if (status === API_ORDER_STATUS.PICKED_UP) {
    return {
      label: 'Start Delivery',
      nextStatus: API_ORDER_STATUS.IN_TRANSIT,
    }
  }

  if (status === API_ORDER_STATUS.IN_TRANSIT) {
    return {
      label: 'Confirm Delivery',
      nextStatus: API_ORDER_STATUS.DELIVERED,
    }
  }

  return null
}

export function mapHistoryStatus(status: OrderResponse['status']): HistoryUiStatus {
  if (status === API_ORDER_STATUS.DELIVERED) return 'delivered'
  if (status === API_ORDER_STATUS.CANCELLED) return 'cancelled'
  return 'returned'
}

