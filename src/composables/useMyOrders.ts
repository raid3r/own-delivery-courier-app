import { ref } from 'vue'

import { ordersApi } from '@/api/endpoints/orders.api'
import type { OrderResponse } from '@/types/api'
import { useAsyncResource } from '@/composables/useAsyncResource'

interface LoadMyOrdersOptions {
  errorMessage?: string
  throwOnError?: boolean
}

export function useMyOrders() {
  const orders = ref<OrderResponse[]>([])
  const asyncState = useAsyncResource()

  async function loadMyOrders(options?: LoadMyOrdersOptions): Promise<OrderResponse[] | null> {
    const response = await asyncState.execute(() => ordersApi.getMyOrders(), {
      errorMessage: options?.errorMessage ?? 'Failed to load orders. Please try again.',
      throwOnError: options?.throwOnError,
    })

    if (!response) {
      return null
    }

    orders.value = response.data
    return orders.value
  }

  return {
    orders,
    isLoading: asyncState.isLoading,
    loadError: asyncState.error,
    loadMyOrders,
    clearLoadError: asyncState.clearError,
  }
}

