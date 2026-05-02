export const API_ORDER_STATUS = {
  PENDING: 0,
  ASSIGNED: 1,
  PICKED_UP: 2,
  IN_TRANSIT: 3,
  DELIVERED: 4,
  CANCELLED: 5,
  FAILED: 6,
} as const

export type ApiOrderStatus = (typeof API_ORDER_STATUS)[keyof typeof API_ORDER_STATUS]


export function isActiveRouteOrderStatus(status: ApiOrderStatus): boolean {
  return status === API_ORDER_STATUS.ASSIGNED
    || status === API_ORDER_STATUS.PICKED_UP
    || status === API_ORDER_STATUS.IN_TRANSIT
}

export function isCompletedOrderStatus(status: ApiOrderStatus): boolean {
  return status === API_ORDER_STATUS.DELIVERED
    || status === API_ORDER_STATUS.CANCELLED
    || status === API_ORDER_STATUS.FAILED
}

