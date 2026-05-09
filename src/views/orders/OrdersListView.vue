<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import AppLayout from '@/components/layout/AppLayout.vue'
import OrderCard from '@/components/orders/OrderCard.vue'
import FilterChips from '@/components/orders/FilterChips.vue'
import type { FilterChip } from '@/components/orders/FilterChips.vue'
import PageLoadState from '@/components/ui/PageLoadState.vue'
import { useAvailableOrders } from '@/composables/useAvailableOrders'
import { useMyOrders } from '@/composables/useMyOrders'
import { mapOrderToAvailableOrder } from '@/utils/order-mappers'

const router = useRouter()

// ── Вкладки ──────────────────────────────────────────────────────────────
type Tab = 'available' | 'my'
const activeTab = ref<Tab>('available')

// ── Фільтри (доступні замовлення) ────────────────────────────────────────
const activeFilter = ref<'filters' | 'payout' | 'distance'>('filters')

const filterChips: FilterChip[] = [
  { id: 'filters', label: 'Latest', icon: 'schedule' },
  { id: 'payout', label: 'Highest Payout', icon: 'attach_money' },
  { id: 'distance', label: 'Shortest Distance', icon: 'directions_car' },
]

// ── Доступні замовлення ───────────────────────────────────────────────────
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

// ── Мої замовлення ────────────────────────────────────────────────────────
const {
  orders: myOrdersRaw,
  isLoading: isMyOrdersLoading,
  loadError: myOrdersError,
  loadMyOrders,
} = useMyOrders()

const myOrders = computed(() =>
  myOrdersRaw.value.map((order) => ({
    ...mapOrderToAvailableOrder(order),
    actionLabel: 'Деталі',
  })),
)

async function refreshMyOrders() {
  await loadMyOrders({ errorMessage: 'Не вдалося завантажити ваші замовлення. Спробуйте ще раз.' })
}

function onViewMyOrder(id: string) {
  router.push(`/orders/${id}`)
}

// ── Ініціалізація ─────────────────────────────────────────────────────────
watch(activeTab, (tab) => {
  if (tab === 'available') loadOrders()
  if (tab === 'my') refreshMyOrders()
})

onMounted(() => {
  loadOrders()
})
</script>

<template>
  <AppLayout title="Velocity">
    <template #default>
      <div class="flex flex-col gap-6">

        <!-- Перемикач вкладок -->
        <div class="flex rounded-2xl bg-surface-container-low p-1 gap-1">
          <button
            class="flex-1 py-2.5 rounded-xl font-headline font-bold text-sm transition-colors"
            :class="activeTab === 'available'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'"
            @click="activeTab = 'available'"
          >
            Доступні замовлення
          </button>
          <button
            class="flex-1 py-2.5 rounded-xl font-headline font-bold text-sm transition-colors"
            :class="activeTab === 'my'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'"
            @click="activeTab = 'my'"
          >
            Мої замовлення
          </button>
        </div>

        <!-- ══ ВКЛАДКА: Доступні замовлення ══ -->
        <template v-if="activeTab === 'available'">
          <div>
            <h1 class="font-headline font-extrabold text-4xl tracking-tight text-on-surface mb-2">Доступні замовлення</h1>
            <p class="font-body text-sm text-on-surface-variant mb-6">Показано {{ visibleOrders.length }} з {{ total }} найближчих доставок</p>
            <FilterChips
              :chips="[...filterChips]"
              :active="activeFilter"
              @select="onSelectFilter"
            />
          </div>

          <PageLoadState
            :error-text="loadError"
            :is-loading="isLoading"
            loading-text="Завантаження доступних замовлень..."
            @retry="loadOrders"
          />

          <div v-if="!loadError && !isLoading && !visibleOrders.length" class="bg-surface-container-lowest rounded-2xl p-6 text-center">
            <p class="font-body text-sm text-on-surface-variant">Наразі немає доступних замовлень.</p>
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
              {{ isLoading ? 'Завантаження...' : 'Завантажити більше' }}
            </button>
          </div>
        </template>

        <!-- ══ ВКЛАДКА: Мої замовлення ══ -->
        <template v-if="activeTab === 'my'">
          <div>
            <h1 class="font-headline font-extrabold text-4xl tracking-tight text-on-surface mb-2">Мої замовлення</h1>
            <p class="font-body text-sm text-on-surface-variant">Замовлення, які ви взяли в роботу</p>
          </div>

          <PageLoadState
            :error-text="myOrdersError"
            :is-loading="isMyOrdersLoading"
            loading-text="Завантаження ваших замовлень..."
            @retry="refreshMyOrders"
          />

          <div v-if="!myOrdersError && !isMyOrdersLoading && !myOrders.length" class="bg-surface-container-lowest rounded-2xl p-6 text-center">
            <p class="font-body text-sm text-on-surface-variant">У вас ще немає замовлень.</p>
          </div>

          <div v-if="!myOrdersError && !isMyOrdersLoading && myOrders.length" class="space-y-6">
            <OrderCard
              v-for="order in myOrders"
              :key="order.id"
              :order="order"
              @accept="onViewMyOrder"
            />
          </div>
        </template>

      </div>
    </template>
  </AppLayout>
</template>
