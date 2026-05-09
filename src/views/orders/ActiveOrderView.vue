<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import MapSection from '@/components/active-order/MapSection.vue'
import DeliveryDetails from '@/components/active-order/DeliveryDetails.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomNavBar from '@/components/layout/BottomNavBar.vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import type { AppDialogAction } from '@/components/ui/AppDialog.vue'
import PageLoadState from '@/components/ui/PageLoadState.vue'
import { useOrderDetails } from '@/composables/useOrderDetails'
import { API_ORDER_STATUS } from '@/constants/order-status-codes'
import { calculateDistanceKm, kilometersToMiles, roundToSingleDecimal } from '@/utils/geo'
import {
  formatFullAddress,
  getOrderProgressAction,
  getOrderStatusLabel,
} from '@/utils/order-formatters'

const route = useRoute()
const router = useRouter()

type DialogTone = 'default' | 'success' | 'danger'

interface DialogConfig {
  title: string
  message?: string
  tone?: DialogTone
  actions: AppDialogAction[]
  onAction: (actionId: string) => void | Promise<void>
}

const {
  order,
  isLoading,
  loadError,
  isUpdating,
  updateError,
  loadActiveOrder,
  updateOrderStatus,
} = useOrderDetails()

const dialogConfig = ref<DialogConfig | null>(null)

const requestedOrderId = computed(() => {
  const { id } = route.query
  return typeof id === 'string' ? id : null
})

const progressAction = computed(() => (order.value ? getOrderProgressAction(order.value.status) : null))
const statusLabel = computed(() => (order.value ? getOrderStatusLabel(order.value.status) : 'Active Order'))
const trackingId = computed(() => order.value?.orderNumber ?? order.value?.id ?? '—')
const headerTitle = computed(() => order.value?.orderNumber ?? 'Active Order')
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

function getProgressConfirmationCopy() {
  if (!progressAction.value) {
    return {
      title: 'Відкрити деталі замовлення?',
      message: 'Ви можете перейти на сторінку деталей замовлення для перегляду повної інформації.',
    }
  }

  if (progressAction.value.nextStatus === API_ORDER_STATUS.PICKED_UP) {
    return {
      title: 'Підтвердити отримання замовлення?',
      message: 'Підтвердіть дію лише якщо ви вже забрали замовлення у точці видачі.',
    }
  }

  if (progressAction.value.nextStatus === API_ORDER_STATUS.IN_TRANSIT) {
    return {
      title: 'Підтвердити початок доставки?',
      message: 'Після підтвердження замовлення буде позначено як таке, що вже в дорозі до отримувача.',
    }
  }

  return {
    title: 'Підтвердити доставку замовлення?',
    message: 'Підтвердіть дію лише якщо замовлення вже передано отримувачу.',
  }
}

function getProgressSuccessCopy(status: number) {
  if (status === API_ORDER_STATUS.PICKED_UP) {
    return {
      title: 'Замовлення позначено як забране',
      message: 'Тепер ви можете розпочати доставку до отримувача.',
    }
  }

  if (status === API_ORDER_STATUS.IN_TRANSIT) {
    return {
      title: 'Доставку розпочато',
      message: 'Статус замовлення успішно оновлено. Прямуйте до адреси отримувача.',
    }
  }

  return {
    title: 'Доставку підтверджено',
    message: 'Статус замовлення успішно оновлено. Ви можете перейти до деталей замовлення.',
  }
}

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

  const confirmation = getProgressConfirmationCopy()

  openDialog({
    title: confirmation.title,
    message: confirmation.message,
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

      const updatedOrder = await updateOrderStatus(order.value!.id, {
        newStatus: progressAction.value!.nextStatus,
      }, {
        errorMessage: 'Failed to update order status. Please try again.',
      })

      if (!updatedOrder) {
        return
      }

      const success = getProgressSuccessCopy(updatedOrder.status)
      const shouldRedirectToDetails = !getOrderProgressAction(updatedOrder.status)

      openDialog({
        title: success.title,
        message: success.message,
        tone: 'success',
        actions: [
          { id: 'ok', label: 'ОК', variant: 'primary' },
        ],
        onAction: async () => {
          closeDialog()

          if (shouldRedirectToDetails) {
            await router.push(`/orders/${updatedOrder.id}`)
          }
        },
      })
    },
  })
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
  <div class="bg-surface min-h-dvh flex flex-col overflow-x-hidden pb-28">
    <AppHeader :title="headerTitle">
      <template #actions>
        <button
          class="flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-low hover:bg-surface-container transition-colors"
          title="Назад"
          data-test="header-back"
          @click="router.back()"
        >
          <span class="material-symbols-outlined text-on-surface text-[20px]">arrow_back</span>
        </button>
      </template>
    </AppHeader>

    <div class="pt-20 flex-1 flex flex-col">
      <template v-if="order && !isLoading && !loadError">
        <MapSection
          :order="order"
          :status="statusLabel"
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

    <AppDialog
      :is-open="Boolean(dialogConfig)"
      :title="dialogConfig?.title ?? ''"
      :message="dialogConfig?.message"
      :tone="dialogConfig?.tone ?? 'default'"
      :actions="dialogConfig?.actions ?? []"
      @action="onDialogAction"
      @close="closeDialog"
    />

    <BottomNavBar />
  </div>
</template>
