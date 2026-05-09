<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { API_ORDER_STATUS } from '@/constants/order-status-codes'
import AppLayout from '@/components/layout/AppLayout.vue'
import OrderCard from '@/components/orders/OrderCard.vue'
import FilterChips from '@/components/orders/FilterChips.vue'
import type { FilterChip } from '@/components/orders/FilterChips.vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import type { AppDialogAction } from '@/components/ui/AppDialog.vue'
import PageLoadState from '@/components/ui/PageLoadState.vue'
import { useAvailableOrders } from '@/composables/useAvailableOrders'
import { useMyOrders } from '@/composables/useMyOrders'
import { mapOrderToAvailableOrder } from '@/utils/order-mappers'
import { getOrderStatusLabel } from '@/utils/order-formatters'

const router = useRouter()

type DialogTone = 'default' | 'success' | 'danger'

interface DialogConfig {
  title: string
  message?: string
  tone?: DialogTone
  actions: AppDialogAction[]
  onAction: (actionId: string) => void | Promise<void>
}

// ── Вкладки ──────────────────────────────────────────────────────────────
type Tab = 'available' | 'my'
const activeTab = ref<Tab>('available')
const dialogConfig = ref<DialogConfig | null>(null)

// ── Фільтри (доступні замовлення) ────────────────────────────────────────
const activeFilter = ref<'filters' | 'payout' | 'distance'>('filters')

type MyOrdersStatusFilter = 'all' | 'assigned' | 'picked-up' | 'in-transit' | 'delivered' | 'cancelled' | 'failed'
const activeMyStatusFilter = ref<MyOrdersStatusFilter>('all')

const filterChips: FilterChip[] = [
  { id: 'filters', label: 'Latest', icon: 'schedule' },
  { id: 'payout', label: 'Highest Payout', icon: 'attach_money' },
  { id: 'distance', label: 'Shortest Distance', icon: 'directions_car' },
]

const myStatusChips: FilterChip[] = [
  { id: 'all', label: 'Усі', icon: 'list' },
  { id: 'assigned', label: getOrderStatusLabel(API_ORDER_STATUS.ASSIGNED), icon: 'assignment' },
  { id: 'picked-up', label: getOrderStatusLabel(API_ORDER_STATUS.PICKED_UP), icon: 'inventory_2' },
  { id: 'in-transit', label: getOrderStatusLabel(API_ORDER_STATUS.IN_TRANSIT), icon: 'local_shipping' },
  { id: 'delivered', label: getOrderStatusLabel(API_ORDER_STATUS.DELIVERED), icon: 'task_alt' },
  { id: 'cancelled', label: getOrderStatusLabel(API_ORDER_STATUS.CANCELLED), icon: 'cancel' },
  { id: 'failed', label: getOrderStatusLabel(API_ORDER_STATUS.FAILED), icon: 'error' },
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

function onSelectMyStatusFilter(filterId: string) {
  if (
    filterId === 'all'
    || filterId === 'assigned'
    || filterId === 'picked-up'
    || filterId === 'in-transit'
    || filterId === 'delivered'
    || filterId === 'cancelled'
    || filterId === 'failed'
  ) {
    activeMyStatusFilter.value = filterId
  }
}

function openDialog(config: DialogConfig) {
  dialogConfig.value = config
}

function closeDialog() {
  dialogConfig.value = null
}

async function onDialogAction(actionId: string) {
  const currentDialog = dialogConfig.value
  if (!currentDialog) return

  await currentDialog.onAction(actionId)
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
  openDialog({
    title: 'Підтвердити прийняття замовлення?',
    message: 'Замовлення буде призначено вам. Переконайтеся, що ви готові взяти його в роботу.',
    actions: [
      { id: 'cancel', label: 'Скасувати', variant: 'secondary' },
      { id: 'confirm', label: 'Підтвердити', variant: 'primary' },
    ],
    onAction: async (actionId) => {
      if (actionId === 'cancel') {
        closeDialog()
        return
      }

      closeDialog()

      const acceptedOrder = await acceptOrder(id, {
        errorMessage: 'Failed to accept order. It may have already been taken.',
      })

      if (!acceptedOrder) {
        return
      }

      openDialog({
        title: 'Замовлення успішно прийнято',
        message: 'Тепер ви можете переглянути активне замовлення та продовжити виконання доставки.',
        tone: 'success',
        actions: [
          { id: 'ok', label: 'ОК', variant: 'primary' },
        ],
        onAction: async () => {
          closeDialog()
          await router.push(`/orders/active?id=${acceptedOrder.id}`)
        },
      })
    },
  })
}

// ── Мої замовлення ────────────────────────────────────────────────────────
const {
  orders: myOrdersRaw,
  isLoading: isMyOrdersLoading,
  loadError: myOrdersError,
  loadMyOrders,
} = useMyOrders()

const filteredMyOrdersRaw = computed(() => myOrdersRaw.value.filter((order) => {
  if (activeMyStatusFilter.value === 'all') return true
  if (activeMyStatusFilter.value === 'assigned') return order.status === API_ORDER_STATUS.ASSIGNED
  if (activeMyStatusFilter.value === 'picked-up') return order.status === API_ORDER_STATUS.PICKED_UP
  if (activeMyStatusFilter.value === 'in-transit') return order.status === API_ORDER_STATUS.IN_TRANSIT
  if (activeMyStatusFilter.value === 'delivered') return order.status === API_ORDER_STATUS.DELIVERED
  if (activeMyStatusFilter.value === 'cancelled') return order.status === API_ORDER_STATUS.CANCELLED
  return order.status === API_ORDER_STATUS.FAILED
}))

const myOrders = computed(() =>
  filteredMyOrdersRaw.value.map((order) => ({
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
            <p class="font-body text-sm text-on-surface-variant mb-6">Замовлення, які ви взяли в роботу</p>
            <FilterChips
              :chips="myStatusChips"
              :active="activeMyStatusFilter"
              @select="onSelectMyStatusFilter"
            />
          </div>

          <PageLoadState
            :error-text="myOrdersError"
            :is-loading="isMyOrdersLoading"
            loading-text="Завантаження ваших замовлень..."
            @retry="refreshMyOrders"
          />

          <div v-if="!myOrdersError && !isMyOrdersLoading && !myOrders.length" class="bg-surface-container-lowest rounded-2xl p-6 text-center">
            <p class="font-body text-sm text-on-surface-variant">
              {{ activeMyStatusFilter === 'all' ? 'У вас ще немає замовлень.' : 'Немає замовлень з обраним статусом.' }}
            </p>
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

      <AppDialog
        :is-open="Boolean(dialogConfig)"
        :title="dialogConfig?.title ?? ''"
        :message="dialogConfig?.message"
        :tone="dialogConfig?.tone ?? 'default'"
        :actions="dialogConfig?.actions ?? []"
        @action="onDialogAction"
        @close="closeDialog"
      />
    </template>
  </AppLayout>
</template>
