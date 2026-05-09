import { ref } from 'vue'

import { ordersApi } from '@/api/endpoints/orders.api'
import type { OrderResponse } from '@/types/api'
import { useAsyncResource } from '@/composables/useAsyncResource'
import { useAuthStore } from '@/stores/auth.store'

interface LoadMyOrdersOptions {
  errorMessage?: string
  throwOnError?: boolean
}

export function useMyOrders() {
  const orders = ref<OrderResponse[]>([])
  const asyncState = useAsyncResource()
  const authStore = useAuthStore()

  async function resolveCourierId(): Promise<string> {
    if (authStore.profile?.courierId) {
      return authStore.profile.courierId
    }

    const profile = await authStore.fetchProfile()

    if (profile?.courierId) {
      return profile.courierId
    }

    throw new Error('Courier profile is unavailable')
  }

  async function fetchCourierOrders(courierId: string): Promise<OrderResponse[]> {
    const pageSize = 100
    const allOrders: OrderResponse[] = []
    let skip = 0

    while (true) {
      const response = await ordersApi.getByCourier(courierId, {
        skip,
        take: pageSize,
      })

      const batch = response.data.items ?? []
      allOrders.push(...batch)

      if (batch.length < pageSize) {
        return allOrders
      }

      skip += batch.length
    }
  }

  async function loadMyOrders(options?: LoadMyOrdersOptions): Promise<OrderResponse[] | null> {
    const response = await asyncState.execute(async () => {
      const courierId = await resolveCourierId()
      return fetchCourierOrders(courierId)
    }, {
      errorMessage: options?.errorMessage ?? 'Failed to load orders. Please try again.',
      throwOnError: options?.throwOnError,
    })

    if (!response) {
      return null
    }

    orders.value = response
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

