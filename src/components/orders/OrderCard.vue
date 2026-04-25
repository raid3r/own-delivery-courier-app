<script setup lang="ts">
export interface OrderStop {
  type: 'pickup' | 'dropoff'
  name: string
  address: string
}

export interface AvailableOrder {
  id: string
  type: 'Express' | 'Standard' | 'Priority'
  payout: number
  payoutCents?: number
  estimatedMinutes: number
  distanceMiles: number
  mapImageUrl?: string
  stops: OrderStop[]
}

interface Props {
  order: AvailableOrder
}

defineProps<Props>()
defineEmits<{ accept: [id: string] }>()
</script>

<template>
  <article class="bg-surface-container-lowest p-5 rounded-xl shadow-cloud-sm flex flex-col gap-5">
    <!-- Header row -->
    <div class="flex justify-between items-start">
      <div>
        <span class="bg-surface-container-low text-on-surface text-xs font-bold px-2 py-1 rounded-lg uppercase tracking-wider mb-2 inline-block">
          {{ order.type }}
        </span>
        <h2 class="font-headline text-3xl font-bold text-primary tracking-tight">
          ${{ order.payout }}<span v-if="order.payoutCents" class="text-lg">.{{ String(order.payoutCents).padStart(2, '0') }}</span>
        </h2>
        <p class="font-body text-xs text-on-surface-variant mt-1">
          Est. {{ order.estimatedMinutes }} mins · {{ order.distanceMiles }} mi total
        </p>
      </div>
      <img
        v-if="order.mapImageUrl"
        :src="order.mapImageUrl"
        alt="Route map"
        class="w-16 h-16 rounded-xl object-cover"
      />
      <div
        v-else
        class="w-16 h-16 rounded-xl bg-surface-container flex items-center justify-center"
      >
        <span class="material-symbols-outlined text-outline-variant">map</span>
      </div>
    </div>

    <!-- Route stops -->
    <div class="flex flex-col gap-3 relative">
      <div class="absolute left-[11px] top-4 bottom-4 w-0.5 bg-surface-container-high z-0" />

      <div
        v-for="stop in order.stops"
        :key="stop.type"
        class="flex items-start gap-4 relative z-10"
      >
        <div
          class="w-6 h-6 rounded-full bg-surface-container-lowest flex items-center justify-center shrink-0 mt-0.5"
          :class="stop.type === 'pickup' ? 'border-2 border-primary' : 'border-2 border-tertiary'"
        >
          <span
            v-if="stop.type === 'pickup'"
            class="w-2 h-2 rounded-full bg-primary"
          />
          <span
            v-else
            class="material-symbols-outlined text-[14px] text-tertiary icon-filled"
          >location_on</span>
        </div>

        <div>
          <p class="font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            {{ stop.type === 'pickup' ? 'Pickup' : 'Dropoff' }}
          </p>
          <p class="font-body text-sm font-semibold text-on-surface">{{ stop.name }}</p>
          <p class="font-body text-xs text-on-surface-variant">{{ stop.address }}</p>
        </div>
      </div>
    </div>

    <!-- Accept button -->
    <button
      class="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-bold text-sm py-4 rounded-full shadow-primary-glow-sm hover:opacity-90 transition-opacity mt-2"
      @click="$emit('accept', order.id)"
    >
      Accept Order
    </button>
  </article>
</template>

