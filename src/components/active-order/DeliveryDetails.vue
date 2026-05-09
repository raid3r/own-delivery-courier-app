<script setup lang="ts">
interface Props {
  trackingId: string
  eta: string
  recipientName: string
  recipientAddress: string
  instructions?: string
  recipientPhone?: string
  actionLabel?: string
}

withDefaults(defineProps<Props>(), {
  actionLabel: 'Confirm Delivery',
})
defineEmits<{ confirm: []; call: [] }>()
</script>

<template>
  <div class="bg-surface w-full rounded-t-3xl shadow-nav -mt-6 relative z-20 flex flex-col">
    <!-- Drag handle -->
    <div class="w-full flex justify-center pt-4 pb-2">
      <div class="w-12 h-1.5 bg-outline-variant/30 rounded-full" />
    </div>

    <div class="px-6 pb-8 flex flex-col gap-6">
      <!-- Tracking & ETA -->
      <div class="flex justify-between items-end border-b border-surface-container-low pb-4">
        <div>
          <p class="font-body text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest mb-1">Tracking ID</p>
          <p class="font-headline text-lg font-bold text-on-surface tracking-tight">{{ trackingId }}</p>
        </div>
        <div class="text-right">
          <p class="font-body text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest mb-1">ETA</p>
          <p class="font-headline text-2xl font-black text-primary tracking-tighter">{{ eta }}</p>
        </div>
      </div>

      <!-- Recipient -->
      <div class="bg-surface-container-low rounded-xl p-4 flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-primary-container shrink-0">
          <span class="material-symbols-outlined text-2xl">person</span>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-headline font-bold text-on-surface">{{ recipientName }}</h3>
          <p class="font-body text-sm text-on-surface-variant truncate">{{ recipientAddress }}</p>
        </div>
        <button
          class="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-primary shadow-cloud-sm shrink-0"
          :disabled="!recipientPhone"
          :class="!recipientPhone ? 'opacity-50 cursor-not-allowed' : ''"
          @click="$emit('call')"
        >
          <span class="material-symbols-outlined">call</span>
        </button>
      </div>

      <!-- Instructions -->
      <div
        v-if="instructions"
        class="bg-surface-container-lowest rounded-xl p-4"
        style="border: 1px solid rgba(171,173,175,0.15)"
      >
        <div class="flex items-center gap-2 mb-2">
          <span class="material-symbols-outlined text-on-surface-variant text-sm">info</span>
          <h4 class="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Delivery Instructions</h4>
        </div>
        <p class="font-body text-sm text-on-surface leading-relaxed">{{ instructions }}</p>
      </div>

      <!-- Confirm button -->
      <button
        class="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-4 rounded-full font-headline font-bold text-lg shadow-primary-glow hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        @click="$emit('confirm')"
      >
        {{ actionLabel }}
        <span class="material-symbols-outlined">check_circle</span>
      </button>
    </div>
  </div>
</template>

