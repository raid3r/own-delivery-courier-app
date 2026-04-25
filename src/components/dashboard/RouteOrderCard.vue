<script setup lang="ts">
export interface RouteOrder {
  id: string
  status: 'transit' | 'priority' | 'pending'
  statusLabel: string
  trackingId: string
  eta?: string
  urgent?: boolean
  address: {
    street: string
    details?: string
  }
  icon?: string
}

interface Props {
  order: RouteOrder
}

defineProps<Props>()
defineEmits<{ action: [id: string] }>()
</script>

<template>
  <div
    class="bg-surface-container-lowest rounded-[1.25rem] p-5 shadow-cloud-md relative overflow-hidden"
  >
    <!-- Left accent bar -->
    <div
      class="absolute left-0 top-0 bottom-0 w-1.5"
      :class="{
        'bg-tertiary': order.status === 'transit',
        'bg-error-container': order.status === 'priority',
        'bg-secondary': order.status === 'pending',
      }"
    />

    <div class="flex justify-between items-start mb-4 pl-2">
      <div class="flex flex-col">
        <span
          class="font-label text-[10px] font-bold tracking-widest uppercase mb-1"
          :class="{
            'text-tertiary': order.status === 'transit',
            'text-error': order.status === 'priority',
            'text-secondary': order.status === 'pending',
          }"
        >{{ order.statusLabel }}</span>
        <span class="font-label text-xs text-on-surface-variant">ID: {{ order.trackingId }}</span>
      </div>

      <!-- ETA or Urgent badge -->
      <div
        v-if="order.urgent"
        class="bg-error/10 rounded-lg px-3 py-1 flex items-center gap-1"
      >
        <span class="material-symbols-outlined text-[14px] text-error">warning</span>
        <span class="font-headline text-sm font-bold text-error">ASAP</span>
      </div>
      <div
        v-else-if="order.eta"
        class="bg-surface-container-low rounded-lg px-3 py-1 flex items-center gap-1"
      >
        <span class="material-symbols-outlined text-[14px] text-on-surface-variant">schedule</span>
        <span class="font-headline text-sm font-bold text-on-surface">{{ order.eta }}</span>
      </div>
    </div>

    <!-- Address -->
    <div class="flex items-start gap-3 pl-2 mb-5">
      <span class="material-symbols-outlined text-outline-variant mt-0.5 text-lg">
        {{ order.icon ?? (order.status === 'priority' ? 'storefront' : 'location_on') }}
      </span>
      <div class="flex flex-col">
        <span class="font-body text-sm font-semibold text-on-surface">{{ order.address.street }}</span>
        <span v-if="order.address.details" class="font-label text-xs text-on-surface-variant">
          {{ order.address.details }}
        </span>
      </div>
    </div>

    <!-- Action button -->
    <button
      class="w-full font-headline text-sm font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 transition-all"
      :class="
        order.status === 'priority'
          ? 'bg-surface-container-high text-primary hover:bg-surface-variant'
          : 'bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-primary-glow-sm hover:opacity-90'
      "
      @click="$emit('action', order.id)"
    >
      {{ order.status === 'priority' ? 'Acknowledge Pickup' : 'Update Status' }}
      <span v-if="order.status !== 'priority'" class="material-symbols-outlined text-[18px]">arrow_forward</span>
    </button>
  </div>
</template>

