import { API_ORDER_STATUS } from '@/constants/order-status-codes'
import { formatRelativeDateLabel, formatTime24, getSafeTimestamp } from '@/utils/date'
import { splitAmount } from '@/utils/money'
import {
  formatAddressDetails,
  formatAddressLine,
  formatOrderDeliveryAddress,
  mapHistoryStatus,
  mapRouteStatus,
} from '@/utils/order-formatters'
import type { OrderResponse } from '@/types/api'

export interface RouteOrderViewModel {
  id: string
  status: 'transit' | 'priority' | 'pending'
  statusLabel: string
  trackingId: string
  eta?: string
  urgent?: boolean
  address: {
    street: string
    details?: string
  }
}

export interface HistoryItemViewModel {
  id: string
  date: string
  time: string
  address: string
  payout: number
  payoutCents?: number
  status: 'delivered' | 'cancelled' | 'returned'
  durationMinutes?: number
}

function mapDurationMinutes(order: OrderResponse): number | undefined {
  if (!order.actualDeliveryTime) return undefined

  const start = getSafeTimestamp(order.createdAt)
  const end = getSafeTimestamp(order.actualDeliveryTime)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return undefined

  return Math.round((end - start) / 60000)
}

export function mapOrderToRouteOrder(order: OrderResponse): RouteOrderViewModel {
  const routeStatus = mapRouteStatus(order.status)
  const address = order.status === API_ORDER_STATUS.ASSIGNED ? order.pickupAddress : order.deliveryAddress

  return {
    id: order.id,
    status: routeStatus?.status ?? 'pending',
    statusLabel: routeStatus?.statusLabel ?? 'In Progress',
    trackingId: order.orderNumber ?? order.id.slice(0, 8).toUpperCase(),
    urgent: routeStatus?.urgent,
    eta: formatTime24(order.actualDeliveryTime ?? order.createdAt),
    address: {
      street: formatAddressLine(address),
      details: formatAddressDetails(address),
    },
  }
}

export function mapOrderToHistoryItem(order: OrderResponse): HistoryItemViewModel {
  const payout = splitAmount(Number(order.cost || 0))

  return {
    id: order.id,
    date: formatRelativeDateLabel(order.createdAt),
    time: formatTime24(order.createdAt) ?? '00:00',
    address: formatOrderDeliveryAddress(order),
    payout: payout.amount,
    payoutCents: payout.cents > 0 ? payout.cents : undefined,
    status: mapHistoryStatus(order.status),
    durationMinutes: mapDurationMinutes(order),
  }
}

