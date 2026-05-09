<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppLayout from '@/components/layout/AppLayout.vue'
import PageLoadState from '@/components/ui/PageLoadState.vue'
import { useOrderDetails } from '@/composables/useOrderDetails'
import { isActiveRouteOrderStatus } from '@/constants/order-status-codes'
import { formatDate, formatTime } from '@/utils/date'
import { splitAmount } from '@/utils/money'
import {
  formatFullAddress,
  getOrderStatusLabel,
} from '@/utils/order-formatters'

const route = useRoute()
const router = useRouter()

const {
  order,
  isLoading,
  loadError,
  loadOrderById,
} = useOrderDetails()

const orderId = computed(() => String(route.params.id ?? ''))

const payout = computed(() => splitAmount(Number(order.value?.cost ?? 0)))
const statusLabel = computed(() => (order.value ? getOrderStatusLabel(order.value.status) : 'Unknown'))
const hasActiveFlow = computed(() => (order.value ? isActiveRouteOrderStatus(order.value.status) : false))

async function loadOrder() {
  if (!orderId.value) {
    return
  }

  await loadOrderById(orderId.value, {
    errorMessage: 'Failed to load order details. Please try again.',
  })
}

function openActiveOrder() {
  if (!order.value || !hasActiveFlow.value) {
    return
  }

  router.push(`/orders/active?id=${order.value.id}`)
}

onMounted(() => {
  loadOrder()
})

watch(orderId, () => {
  loadOrder()
})
</script>

<template>
  <AppLayout :title="order?.orderNumber ?? 'Order Details'">
    <template #actions>
      <button
        class="flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-low hover:bg-surface-container transition-colors"
        title="Назад"
        @click="router.back()"
      >
        <span class="material-symbols-outlined text-on-surface text-[20px]">arrow_back</span>
      </button>
    </template>

    <div class="flex flex-col gap-6">
      <PageLoadState
        :error-text="loadError"
        :is-loading="isLoading"
        loading-text="Loading order details..."
        @retry="loadOrder"
      />

      <template v-if="order && !isLoading && !loadError">
        <section class="bg-surface-container-low rounded-3xl p-6 flex flex-col gap-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">Status</p>
              <p class="font-headline text-2xl font-extrabold tracking-tight text-on-surface" data-test="order-status">{{ statusLabel }}</p>
            </div>
            <div class="text-right">
              <p class="font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">Payout</p>
              <p class="font-headline text-3xl font-extrabold tracking-tight text-primary" data-test="order-payout">
                ${{ payout.amount }}<span class="text-lg text-primary/80">.{{ String(payout.cents).padStart(2, '0') }}</span>
              </p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="bg-surface rounded-2xl p-4">
              <p class="font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Created</p>
              <p class="font-body text-sm font-semibold text-on-surface">{{ formatDate(order.createdAt) }}</p>
              <p class="font-body text-xs text-on-surface-variant">{{ formatTime(order.createdAt) }}</p>
            </div>
            <div class="bg-surface rounded-2xl p-4">
              <p class="font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Tracking ID</p>
              <p class="font-body text-sm font-semibold text-on-surface" data-test="order-number">{{ order.orderNumber ?? order.id }}</p>
              <p class="font-body text-xs text-on-surface-variant">Weight: {{ order.weight }} kg</p>
            </div>
          </div>
        </section>

        <section class="bg-surface-container-lowest rounded-3xl p-6 flex flex-col gap-4">
          <div>
            <p class="font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Pickup Address</p>
            <p class="font-body text-sm font-semibold text-on-surface" data-test="pickup-address">{{ formatFullAddress(order.pickupAddress) }}</p>
          </div>
          <div>
            <p class="font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Delivery Address</p>
            <p class="font-body text-sm font-semibold text-on-surface" data-test="delivery-address">{{ formatFullAddress(order.deliveryAddress) }}</p>
          </div>
        </section>

        <section class="bg-surface-container-lowest rounded-3xl p-6 flex flex-col gap-4">
          <div>
            <p class="font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Package Details</p>
            <p class="font-body text-sm text-on-surface">{{ order.dimensions.length }} × {{ order.dimensions.width }} × {{ order.dimensions.height }} cm</p>
          </div>

          <div v-if="order.description">
            <p class="font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Description</p>
            <p class="font-body text-sm text-on-surface">{{ order.description }}</p>
          </div>

          <div v-if="order.specialInstructions">
            <p class="font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Instructions</p>
            <p class="font-body text-sm text-on-surface" data-test="instructions">{{ order.specialInstructions }}</p>
          </div>
        </section>

        <button
          v-if="hasActiveFlow"
          class="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-4 rounded-full font-headline font-bold text-base shadow-primary-glow hover:opacity-90 transition-opacity"
          data-test="open-active-order"
          @click="openActiveOrder"
        >
          Open Active Delivery
        </button>
      </template>
    </div>
  </AppLayout>
</template>
