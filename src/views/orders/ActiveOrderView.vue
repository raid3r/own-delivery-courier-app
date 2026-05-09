<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import MapSection from '@/components/active-order/MapSection.vue'
import DeliveryDetails from '@/components/active-order/DeliveryDetails.vue'
import PageLoadState from '@/components/ui/PageLoadState.vue'
import { useOrderDetails } from '@/composables/useOrderDetails'
import { calculateDistanceKm, kilometersToMiles, roundToSingleDecimal } from '@/utils/geo'
import {
  formatFullAddress,
  getOrderProgressAction,
  getOrderStatusLabel,
} from '@/utils/order-formatters'

const route = useRoute()
const router = useRouter()

const {
  order,
  isLoading,
  loadError,
  isUpdating,
  updateError,
  loadActiveOrder,
  updateOrderStatus,
} = useOrderDetails()

const requestedOrderId = computed(() => {
  const { id } = route.query
  return typeof id === 'string' ? id : null
})

const progressAction = computed(() => (order.value ? getOrderProgressAction(order.value.status) : null))
const statusLabel = computed(() => (order.value ? getOrderStatusLabel(order.value.status) : 'Active Order'))
const trackingId = computed(() => order.value?.orderNumber ?? order.value?.id ?? '—')
const recipientName = computed(() => order.value?.description?.trim() || 'Delivery recipient')
const recipientAddress = computed(() => (order.value ? formatFullAddress(order.value.deliveryAddress) : ''))
const instructions = computed(() => order.value?.specialInstructions ?? undefined)
const distanceMiles = computed(() => {
  if (!order.value) return 0

  const distanceKm = calculateDistanceKm(
    order.value.pickupAddress.latitude,
    order.value.pickupAddress.longitude,
    order.value.deliveryAddress.latitude,
    order.value.deliveryAddress.longitude,
  )

  return roundToSingleDecimal(kilometersToMiles(distanceKm))
})
const etaLabel = computed(() => `${Math.max(10, Math.round(distanceMiles.value * 12))} min`)
const actionLabel = computed(() => progressAction.value?.label ?? 'View Order Details')

async function loadOrder() {
  await loadActiveOrder(requestedOrderId.value, {
    errorMessage: 'Failed to load active order. Please try again.',
  })
}

async function onConfirm() {
  if (!order.value) {
    return
  }

  if (!progressAction.value) {
    await router.push(`/orders/${order.value.id}`)
    return
  }

  const updatedOrder = await updateOrderStatus(order.value.id, {
    newStatus: progressAction.value.nextStatus,
  }, {
    errorMessage: 'Failed to update order status. Please try again.',
  })

  if (!updatedOrder) {
    return
  }

  if (!getOrderProgressAction(updatedOrder.status)) {
    await router.push(`/orders/${updatedOrder.id}`)
  }
}

function onCall() {
  // API currently does not expose recipient phone for courier order screens.
}

onMounted(() => {
  loadOrder()
})

watch(requestedOrderId, () => {
  loadOrder()
})
</script>

<template>
  <div class="bg-surface min-h-dvh flex flex-col overflow-hidden">
    <template v-if="order && !isLoading && !loadError">
      <MapSection
        :order="order"
        :status="statusLabel"
        @back="router.back()"
      />

      <div class="px-5 py-4 bg-surface-container-lowest border-b border-surface-container-low">
        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="bg-surface-container-low rounded-xl p-3">
            <p class="font-headline text-base font-bold text-on-surface" data-test="active-eta">{{ etaLabel }}</p>
            <p class="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">ETA</p>
          </div>
          <div class="bg-surface-container-low rounded-xl p-3">
            <p class="font-headline text-base font-bold text-on-surface" data-test="active-distance">{{ distanceMiles }} mi</p>
            <p class="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">Distance</p>
          </div>
          <div class="bg-surface-container-low rounded-xl p-3">
            <p class="font-headline text-base font-bold text-on-surface" data-test="active-number">{{ trackingId }}</p>
            <p class="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">Tracking</p>
          </div>
        </div>
      </div>

      <div v-if="updateError" class="px-5 pt-4">
        <div class="rounded-2xl bg-error-container/70 text-on-error-container p-4">
          <p class="font-body text-sm">{{ updateError }}</p>
        </div>
      </div>

      <DeliveryDetails
        :tracking-id="trackingId"
        :eta="isUpdating ? 'Saving...' : etaLabel"
        :recipient-name="recipientName"
        :recipient-address="recipientAddress"
        :instructions="instructions"
        :action-label="isUpdating ? 'Updating…' : actionLabel"
        @confirm="onConfirm"
        @call="onCall"
      />
    </template>

    <div v-else class="p-5 flex-1 flex flex-col gap-6">
      <PageLoadState
        :error-text="loadError"
        :is-loading="isLoading"
        loading-text="Loading active order..."
        @retry="loadOrder"
      />

      <div v-if="!loadError && !isLoading" class="bg-surface-container-lowest rounded-3xl p-6 text-center">
        <p class="font-body text-sm text-on-surface-variant mb-4">You do not have an active delivery right now.</p>
        <button
          class="bg-primary text-on-primary px-5 py-3 rounded-full font-headline font-bold"
          data-test="back-to-orders"
          @click="router.push('/orders')"
        >
          Back to Orders
        </button>
      </div>
    </div>
  </div>
</template>
