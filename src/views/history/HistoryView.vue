<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppLayout from '@/components/layout/AppLayout.vue'
import AppButton from '@/components/ui/AppButton.vue'
import HistoryItem from '@/components/history/HistoryItem.vue'
import type { HistoryItem as HistoryEntry } from '@/components/history/HistoryItem.vue'
import { ordersApi } from '@/api/endpoints/orders.api'
import type { OrderResponse } from '@/types/api'

const router = useRouter()

const isLoading = ref(true)
const loadError = ref<string | null>(null)
const orders = ref<OrderResponse[]>([])

function formatAddress(order: OrderResponse): string {
  const address = order.deliveryAddress
  const parts = [address.city, address.street, address.buildingNumber].filter(Boolean)
  return parts.length ? parts.join(', ') : 'Unknown address'
}

function mapStatus(status: OrderResponse['status']): HistoryEntry['status'] {
  if (status === 4) return 'delivered'
  if (status === 5) return 'cancelled'
  return 'returned'
}

function formatDateLabel(dateIso: string): string {
  const date = new Date(dateIso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (itemDate.getTime() === today.getTime()) return 'Today'
  if (itemDate.getTime() === yesterday.getTime()) return 'Yesterday'

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDurationMinutes(order: OrderResponse): number | undefined {
  if (!order.actualDeliveryTime) return undefined

  const start = new Date(order.createdAt).getTime()
  const end = new Date(order.actualDeliveryTime).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return undefined

  return Math.round((end - start) / 60000)
}

const historyItems = computed<HistoryEntry[]>(() => {
  return orders.value
    .filter((order) => order.status === 4 || order.status === 5 || order.status === 6)
    .map((order) => {
      const created = new Date(order.createdAt)
      const payout = Number(order.cost || 0)
      const whole = Math.floor(payout)
      const cents = Math.round((payout - whole) * 100)

      return {
        id: order.id,
        date: formatDateLabel(order.createdAt),
        time: created.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        address: formatAddress(order),
        payout: whole,
        payoutCents: cents > 0 ? cents : undefined,
        status: mapStatus(order.status),
        durationMinutes: formatDurationMinutes(order),
      }
    })
    .sort((a, b) => {
      const orderA = orders.value.find((o) => o.id === a.id)
      const orderB = orders.value.find((o) => o.id === b.id)
      return new Date(orderB?.createdAt ?? 0).getTime() - new Date(orderA?.createdAt ?? 0).getTime()
    })
})

const groups = computed(() => {
  const map = new Map<string, HistoryEntry[]>()

  for (const item of historyItems.value) {
    const current = map.get(item.date) ?? []
    current.push(item)
    map.set(item.date, current)
  }

  return Array.from(map.entries()).map(([date, items]) => ({ date, items }))
})

const weekSummary = computed(() => {
  const now = new Date()
  const start = new Date(now)
  const day = start.getDay()
  const diffToMonday = day === 0 ? 6 : day - 1
  start.setDate(start.getDate() - diffToMonday)
  start.setHours(0, 0, 0, 0)

  const weekDelivered = orders.value.filter((order) => {
    if (order.status !== 4) return false
    const created = new Date(order.createdAt).getTime()
    return Number.isFinite(created) && created >= start.getTime()
  })

  const total = weekDelivered.reduce((sum, order) => sum + Number(order.cost || 0), 0)
  const amount = Math.floor(total)
  const cents = Math.round((total - amount) * 100)

  return {
    amount,
    cents,
    deliveries: weekDelivered.length,
  }
})

async function loadHistory() {
  isLoading.value = true
  loadError.value = null

  try {
    const { data } = await ordersApi.getMyOrders()
    orders.value = data
  } catch {
    loadError.value = 'Failed to load delivery history. Please try again.'
  } finally {
    isLoading.value = false
  }
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
      <div
        v-if="loadError"
        class="rounded-2xl bg-error-container/70 text-on-error-container p-4 flex items-start justify-between gap-3"
      >
        <div class="flex items-start gap-2">
          <span class="material-symbols-outlined text-[18px] shrink-0">error</span>
          <p class="font-body text-sm">{{ loadError }}</p>
        </div>
        <AppButton size="sm" variant="danger" @click="loadHistory">
          Retry
        </AppButton>
      </div>

      <div v-else-if="isLoading" class="bg-surface-container-low rounded-3xl p-6 flex items-center gap-3">
        <svg class="h-5 w-5 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <p class="font-body text-sm text-on-surface-variant">Loading history...</p>
      </div>

      <template v-else>
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



