<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppLayout from '@/components/layout/AppLayout.vue'
import OrderCard from '@/components/orders/OrderCard.vue'
import FilterChips from '@/components/orders/FilterChips.vue'
import type { FilterChip } from '@/components/orders/FilterChips.vue'
import PageLoadState from '@/components/ui/PageLoadState.vue'
import { useAvailableOrders } from '@/composables/useAvailableOrders'
import { mapOrderToAvailableOrder } from '@/utils/order-mappers'

const router = useRouter()
const activeFilter = ref<'filters' | 'payout' | 'distance'>('filters')

const filterChips: FilterChip[] = [
  { id: 'filters', label: 'Latest', icon: 'schedule' },
  { id: 'payout', label: 'Highest Payout', icon: 'attach_money' },
  { id: 'distance', label: 'Shortest Distance', icon: 'directions_car' },
]

const {
  orders,
  total,
  hasMore,
  isLoading,
  loadError,
  isAccepting,
  acceptError,
  loadAvailableOrders,
  acceptOrder,
} = useAvailableOrders()

const visibleOrders = computed(() => {
  const mappedOrders = orders.value.map((order) => mapOrderToAvailableOrder(order))

  if (activeFilter.value === 'payout') {
    return [...mappedOrders].sort((a, b) => {
      const payoutA = a.payout + (a.payoutCents ?? 0) / 100
      const payoutB = b.payout + (b.payoutCents ?? 0) / 100
      return payoutB - payoutA
    })
  }

  if (activeFilter.value === 'distance') {
    return [...mappedOrders].sort((a, b) => a.distanceMiles - b.distanceMiles)
  }

  return mappedOrders
})

function onSelectFilter(filterId: string) {
  if (filterId === 'filters' || filterId === 'payout' || filterId === 'distance') {
    activeFilter.value = filterId
  }
}

async function loadOrders() {
  await loadAvailableOrders({
    errorMessage: 'Failed to load available orders. Please try again.',
  })
}

async function loadMoreOrders() {
  await loadAvailableOrders({
    append: true,
    errorMessage: 'Failed to load more available orders. Please try again.',
  })
}

async function onAcceptOrder(id: string) {
  const acceptedOrder = await acceptOrder(id, {
    errorMessage: 'Failed to accept order. It may have already been taken.',
  })

  if (acceptedOrder) {
    router.push(`/orders/active?id=${acceptedOrder.id}`)
  }
}

onMounted(() => {
  loadOrders()
})
</script>

<template>
  <AppLayout title="Velocity">
    <template #default>
      <div class="flex flex-col gap-8">
        <div>
          <h1 class="font-headline font-extrabold text-4xl tracking-tight text-on-surface mb-2">Available Orders</h1>
          <p class="font-body text-sm text-on-surface-variant mb-6">Showing {{ visibleOrders.length }} of {{ total }} nearby deliveries</p>
          <FilterChips
            :chips="[...filterChips]"
            :active="activeFilter"
            @select="onSelectFilter"
          />
        </div>

        <PageLoadState
          :error-text="loadError"
          :is-loading="isLoading"
          loading-text="Loading available orders..."
          @retry="loadOrders"
        />

        <div v-if="!loadError && !isLoading && !visibleOrders.length" class="bg-surface-container-lowest rounded-2xl p-6 text-center">
          <p class="font-body text-sm text-on-surface-variant">No available orders right now.</p>
        </div>

        <div v-if="acceptError" class="rounded-2xl bg-error-container/70 text-on-error-container p-4">
          <p class="font-body text-sm">{{ acceptError }}</p>
        </div>

        <div v-if="!loadError && !isLoading && visibleOrders.length" class="space-y-6">
          <OrderCard
            v-for="order in visibleOrders"
            :key="order.id"
            :order="order"
            @accept="onAcceptOrder"
          />

          <button
            v-if="hasMore"
            class="w-full bg-surface-container-low text-on-surface font-headline font-bold text-sm py-4 rounded-full hover:bg-surface-container transition-colors disabled:opacity-60"
            :disabled="isLoading || isAccepting"
            data-test="load-more"
            @click="loadMoreOrders"
          >
            {{ isLoading ? 'Loading...' : 'Load More' }}
          </button>
        </div>
      </div>
    </template>
  </AppLayout>
</template>
