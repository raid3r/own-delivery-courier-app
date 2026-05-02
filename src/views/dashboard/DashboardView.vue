<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { API_ORDER_STATUS, isActiveRouteOrderStatus } from '@/constants/order-status-codes'
import { useMyOrders } from '@/composables/useMyOrders'
import { getSafeTimestamp, isTimestampInDay, startOfToday, startOfWeek } from '@/utils/date'
import { splitAmount } from '@/utils/money'
import { mapOrderToRouteOrder, type RouteOrderViewModel } from '@/utils/order-mappers'
import AppLayout from '@/components/layout/AppLayout.vue'
import PageLoadState from '@/components/ui/PageLoadState.vue'
import EarningsCard from '@/components/dashboard/EarningsCard.vue'
import RouteOrderCard from '@/components/dashboard/RouteOrderCard.vue'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()
const dailyGoal = 250

const {
  orders,
  isLoading,
  loadError,
  loadMyOrders,
} = useMyOrders()

const courierName = computed(() => {
  const p = authStore.profile
  if (!p) return 'Velocity'
  return `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || 'Velocity'
})

async function onLogout() {
  await authStore.logout()
  router.push('/login')
}


const earnings = computed(() => {
  const todayStart = startOfToday()
  const weekStart = startOfWeek()

  const deliveredOrders = orders.value.filter((order) => order.status === API_ORDER_STATUS.DELIVERED)
  const deliveredToday = deliveredOrders.filter((order) => {
    return isTimestampInDay(getSafeTimestamp(order.actualDeliveryTime ?? order.createdAt), todayStart)
  })
  const deliveredThisWeek = deliveredOrders.filter((order) => {
    return getSafeTimestamp(order.actualDeliveryTime ?? order.createdAt) >= weekStart.getTime()
  })

  const todayTotal = deliveredToday.reduce((sum, order) => sum + Number(order.cost || 0), 0)
  const weekTotal = deliveredThisWeek.reduce((sum, order) => sum + Number(order.cost || 0), 0)

  const todaySplit = splitAmount(todayTotal)
  const weeklySplit = splitAmount(weekTotal)

  return {
    amount: todaySplit.amount,
    cents: todaySplit.cents,
    goal: dailyGoal,
    completedStops: deliveredToday.length,
    weeklyAmount: weeklySplit.amount,
    weeklyCents: weeklySplit.cents,
  }
})

const activeRoutes = computed<RouteOrderViewModel[]>(() => {
  return orders.value
    .filter((order) => isActiveRouteOrderStatus(order.status))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((order) => mapOrderToRouteOrder(order))
})

async function loadDashboardData() {
  if (!authStore.profile) {
    await authStore.fetchProfile()
  }

  await loadMyOrders({
    errorMessage: 'Failed to load dashboard data. Please try again.',
  })
}

function onRouteAction(id: string) {
  router.push(`/orders/${id}`)
}

onMounted(() => {
  loadDashboardData()
})
</script>

<template>
  <AppLayout :title="courierName" has-unread>
    <template #actions>
      <button
        class="flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-low hover:bg-error-container transition-colors"
        title="Вийти"
        @click="onLogout"
      >
        <span class="material-symbols-outlined text-on-surface-variant text-[20px]">logout</span>
      </button>
    </template>

    <div class="flex flex-col gap-10">
      <PageLoadState
        :error-text="loadError"
        :is-loading="isLoading"
        loading-text="Loading dashboard..."
        @retry="loadDashboardData"
      />

      <template v-if="!loadError && !isLoading">
        <EarningsCard
          :amount="earnings.amount"
          :cents="earnings.cents"
          :goal="earnings.goal"
          :completed-stops="earnings.completedStops"
          :weekly-amount="earnings.weeklyAmount"
          :weekly-cents="earnings.weeklyCents"
        />

        <section>
          <div class="flex justify-between items-baseline mb-6 px-1">
            <h3 class="font-headline text-xl font-extrabold tracking-tight text-on-surface">Active Routes</h3>
            <span
              class="font-label text-xs font-medium text-primary cursor-pointer hover:underline"
              @click="router.push('/map')"
            >View Map</span>
          </div>
          <div v-if="!activeRoutes.length" class="bg-surface-container-lowest rounded-2xl p-6 text-center">
            <p class="font-body text-sm text-on-surface-variant">No active routes at the moment.</p>
          </div>
          <div v-else class="flex flex-col gap-6">
            <RouteOrderCard
              v-for="order in activeRoutes"
              :key="order.id"
              :order="order"
              @action="onRouteAction"
            />
          </div>
        </section>
      </template>
    </div>
  </AppLayout>
</template>
