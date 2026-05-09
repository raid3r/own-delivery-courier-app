import { computed, ref } from 'vue'

import { ordersApi } from '@/api/endpoints/orders.api'
import { useAsyncResource } from '@/composables/useAsyncResource'
import type { OrderResponse } from '@/types/api'

interface LoadAvailableOrdersOptions {
  append?: boolean
  errorMessage?: string
  throwOnError?: boolean
}

interface AcceptOrderOptions {
  errorMessage?: string
  throwOnError?: boolean
}

const DEFAULT_PAGE_SIZE = 20

export function useAvailableOrders() {
  const orders = ref<OrderResponse[]>([])
  const total = ref(0)
  const skip = ref(0)
  const take = ref(DEFAULT_PAGE_SIZE)
  const hasMore = ref(false)
  const loadState = useAsyncResource()
  const acceptState = useAsyncResource()

  const nextSkip = computed(() => orders.value.length)

  async function loadAvailableOrders(options?: LoadAvailableOrdersOptions): Promise<OrderResponse[] | null> {
    const shouldAppend = options?.append === true
    const requestedSkip = shouldAppend ? nextSkip.value : 0

    const response = await loadState.execute(() => ordersApi.getAvailable({
      skip: requestedSkip,
      take: take.value,
    }), {
      errorMessage: options?.errorMessage ?? 'Failed to load available orders. Please try again.',
      throwOnError: options?.throwOnError,
    })

    if (!response) {
      return null
    }

    const page = response.data
    orders.value = shouldAppend ? [...orders.value, ...page.items] : page.items
    total.value = page.total
    skip.value = page.skip
    take.value = page.take
    hasMore.value = page.hasMore

    return orders.value
  }

  async function acceptOrder(id: string, options?: AcceptOrderOptions): Promise<OrderResponse | null> {
    const response = await acceptState.execute(() => ordersApi.acceptOrder(id), {
      errorMessage: options?.errorMessage ?? 'Failed to accept order. Please try again.',
      throwOnError: options?.throwOnError,
    })

    if (!response) {
      return null
    }

    orders.value = orders.value.filter((order) => order.id !== id)
    total.value = Math.max(0, total.value - 1)
    hasMore.value = orders.value.length < total.value

    return response.data
  }

  return {
    orders,
    total,
    hasMore,
    isLoading: loadState.isLoading,
    loadError: loadState.error,
    isAccepting: acceptState.isLoading,
    acceptError: acceptState.error,
    clearLoadError: loadState.clearError,
    clearAcceptError: acceptState.clearError,
    loadAvailableOrders,
    acceptOrder,
  }
}
