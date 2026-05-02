<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import AppLayout from '@/components/layout/AppLayout.vue'
import PageLoadState from '@/components/ui/PageLoadState.vue'
import HistoryItem from '@/components/history/HistoryItem.vue'
import { API_ORDER_STATUS, isCompletedOrderStatus } from '@/constants/order-status-codes'
import { useMyOrders } from '@/composables/useMyOrders'
import { getSafeTimestamp, startOfWeek } from '@/utils/date'
import { splitAmount } from '@/utils/money'
import { mapOrderToHistoryItem, type HistoryItemViewModel } from '@/utils/order-mappers'

const router = useRouter()

const {
  orders,
  isLoading,
  loadError,
  loadMyOrders,
} = useMyOrders()

const historyItems = computed<HistoryItemViewModel[]>(() => {
  return orders.value
    .filter((order) => isCompletedOrderStatus(order.status))
    .map((order) => mapOrderToHistoryItem(order))
    .sort((a, b) => {
      const orderA = orders.value.find((o) => o.id === a.id)
      const orderB = orders.value.find((o) => o.id === b.id)
      return getSafeTimestamp(orderB?.createdAt) - getSafeTimestamp(orderA?.createdAt)
    })
})

const groups = computed(() => {
  const map = new Map<string, HistoryItemViewModel[]>()

  for (const item of historyItems.value) {
    const current = map.get(item.date) ?? []
    current.push(item)
    map.set(item.date, current)
  }

  return Array.from(map.entries()).map(([date, items]) => ({ date, items }))
})

const weekSummary = computed(() => {
  const weekStart = startOfWeek()

  const weekDelivered = orders.value.filter((order) => {
    if (order.status !== API_ORDER_STATUS.DELIVERED) return false
    return getSafeTimestamp(order.createdAt) >= weekStart.getTime()
  })

  const total = weekDelivered.reduce((sum, order) => sum + Number(order.cost || 0), 0)
  const weekSplit = splitAmount(total)

  return {
    amount: weekSplit.amount,
    cents: weekSplit.cents,
    deliveries: weekDelivered.length,
  }
})

async function loadHistory() {
  await loadMyOrders({
    errorMessage: 'Failed to load delivery history. Please try again.',
  })
}

function onSelectOrder(id: string) {
  router.push(`/orders/${id}`)
}

onMounted(() => {
  loadHistory()
})
</script>

<template>
  <AppLayout title="History">
    <div class="flex flex-col gap-8">
      <PageLoadState
        :error-text="loadError"
        :is-loading="isLoading"
        loading-text="Loading history..."
        @retry="loadHistory"
      />

      <template v-if="!loadError && !isLoading">
        <!-- Weekly summary card -->
        <div class="bg-surface-container-low rounded-3xl p-6 flex justify-between items-center">
          <div>
            <p class="font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">This Week</p>
            <p class="font-headline text-4xl font-extrabold tracking-tighter text-on-surface">
              <span data-test="week-amount">${{ weekSummary.amount }}</span><span class="text-xl text-on-surface-variant font-bold" data-test="week-cents">.{{ String(weekSummary.cents).padStart(2, '0') }}</span>
            </p>
          </div>
          <div class="text-right">
            <p class="font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">Deliveries</p>
            <p class="font-headline text-4xl font-extrabold tracking-tighter text-on-surface" data-test="week-deliveries">{{ weekSummary.deliveries }}</p>
          </div>
        </div>

        <div v-if="!groups.length" class="bg-surface-container-lowest rounded-2xl p-6 text-center">
          <p class="font-body text-sm text-on-surface-variant">No completed deliveries yet.</p>
        </div>

        <!-- Grouped history -->
        <div v-for="group in groups" :key="group.date" class="flex flex-col gap-3">
          <h3 class="font-headline text-base font-bold text-on-surface px-1">{{ group.date }}</h3>
          <div class="flex flex-col gap-3">
            <HistoryItem
              v-for="item in group.items"
              :key="item.id"
              :item="item"
              @select="onSelectOrder"
            />
          </div>
        </div>
      </template>
    </div>
  </AppLayout>
</template>



