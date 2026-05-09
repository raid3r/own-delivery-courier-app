import { ref } from 'vue'

import { ordersApi } from '@/api/endpoints/orders.api'
import { useAsyncResource } from '@/composables/useAsyncResource'
import { useMyOrders } from '@/composables/useMyOrders'
import { isActiveRouteOrderStatus } from '@/constants/order-status-codes'
import type { OrderResponse, OrderStatusUpdateRequest } from '@/types/api'

interface LoadOrderOptions {
  errorMessage?: string
  throwOnError?: boolean
}

interface UpdateOrderOptions {
  errorMessage?: string
  throwOnError?: boolean
}

export function useOrderDetails() {
  const order = ref<OrderResponse | null>(null)
  const loadState = useAsyncResource()
  const updateState = useAsyncResource()

  async function loadOrderById(id: string, options?: LoadOrderOptions): Promise<OrderResponse | null> {
    const response = await loadState.execute(() => ordersApi.getById(id), {
      errorMessage: options?.errorMessage ?? 'Failed to load order details. Please try again.',
      throwOnError: options?.throwOnError,
    })

    if (!response) {
      order.value = null
      return null
    }

    order.value = response.data
    return order.value
  }

  async function loadActiveOrder(id?: string | null, options?: LoadOrderOptions): Promise<OrderResponse | null> {
    if (id) {
      return loadOrderById(id, options)
    }

    const { loadMyOrders } = useMyOrders()

    const myOrders = await loadMyOrders({
      errorMessage: options?.errorMessage ?? 'Failed to load active order. Please try again.',
      throwOnError: options?.throwOnError,
    })

    if (!myOrders) {
      order.value = null
      return null
    }

    const activeOrder = [...myOrders]
      .filter((item) => isActiveRouteOrderStatus(item.status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null

    order.value = activeOrder
    return order.value
  }

  async function updateOrderStatus(
    id: string,
    payload: OrderStatusUpdateRequest,
    options?: UpdateOrderOptions,
  ): Promise<OrderResponse | null> {
    const response = await updateState.execute(() => ordersApi.updateStatus(id, payload), {
      errorMessage: options?.errorMessage ?? 'Failed to update order status. Please try again.',
      throwOnError: options?.throwOnError,
    })

    if (!response) {
      return null
    }

    order.value = response.data
    return order.value
  }

  return {
    order,
    isLoading: loadState.isLoading,
    loadError: loadState.error,
    isUpdating: updateState.isLoading,
    updateError: updateState.error,
    clearLoadError: loadState.clearError,
    clearUpdateError: updateState.clearError,
    loadOrderById,
    loadActiveOrder,
    updateOrderStatus,
  }
}
