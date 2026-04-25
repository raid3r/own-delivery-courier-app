<script setup lang="ts">
export interface HistoryItem {
  id: string
  date: string
  time: string
  address: string
  payout: number
  payoutCents?: number
  status: 'delivered' | 'cancelled' | 'returned'
  durationMinutes?: number
}

interface Props {
  item: HistoryItem
}

defineProps<Props>()
defineEmits<{ select: [id: string] }>()

const statusConfig = {
  delivered: { label: 'Delivered', color: 'text-tertiary', bg: 'bg-tertiary/10' },
  cancelled: { label: 'Cancelled', color: 'text-error', bg: 'bg-error/10' },
  returned: { label: 'Returned', color: 'text-secondary', bg: 'bg-secondary/10' },
}
</script>

<template>
  <button
    class="w-full bg-surface-container-lowest rounded-xl p-4 flex items-center gap-4 shadow-cloud-sm hover:bg-surface-container-low transition-colors text-left"
    @click="$emit('select', item.id)"
  >
    <!-- Icon -->
    <div
      class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
      :class="statusConfig[item.status].bg"
    >
      <span
        class="material-symbols-outlined text-xl"
        :class="statusConfig[item.status].color"
      >
        {{ item.status === 'delivered' ? 'check_circle' : item.status === 'cancelled' ? 'cancel' : 'undo' }}
      </span>
    </div>

    <!-- Info -->
    <div class="flex-1 min-w-0">
      <p class="font-body text-sm font-semibold text-on-surface truncate">{{ item.address }}</p>
      <p class="font-label text-xs text-on-surface-variant mt-0.5">
        {{ item.date }} · {{ item.time }}
        <span v-if="item.durationMinutes"> · {{ item.durationMinutes }} min</span>
      </p>
    </div>

    <!-- Payout -->
    <div class="text-right shrink-0">
      <p class="font-headline text-base font-bold text-on-surface">
        ${{ item.payout }}<span v-if="item.payoutCents" class="text-xs font-normal">.{{ String(item.payoutCents).padStart(2,'0') }}</span>
      </p>
      <span
        class="font-label text-[10px] font-bold uppercase tracking-wider"
        :class="statusConfig[item.status].color"
      >{{ statusConfig[item.status].label }}</span>
    </div>
  </button>
</template>

