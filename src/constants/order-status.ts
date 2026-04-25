export const ORDER_STATUS = {
  NEW: 'new',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const
export const ORDER_STATUS_LABEL: Record<string, string> = {
  new: 'Нове',
  accepted: 'Прийнято',
  in_progress: 'В дорозі',
  delivered: 'Доставлено',
  cancelled: 'Скасовано',
}
