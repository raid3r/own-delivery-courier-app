<script setup lang="ts">
interface Props {
  amount: number
  cents?: number
  goal: number
  completedStops: number
  weeklyAmount: number
  weeklyCents?: number
}

const props = defineProps<Props>()

const progress = computed(() => Math.min(Math.round((props.amount / props.goal) * 100), 100))

import { computed } from 'vue'
</script>

<template>
  <section class="flex flex-col gap-4">
    <!-- Primary Earnings Card -->
    <div class="bg-surface-container-low rounded-3xl p-6 relative overflow-hidden flex flex-col gap-2">
      <!-- Decorative blob -->
      <div
        class="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-primary-container to-transparent opacity-20 rounded-full blur-2xl pointer-events-none"
      />

      <h2 class="font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
        Today's Earnings
      </h2>

      <div class="font-headline text-5xl font-extrabold tracking-tighter text-on-surface mb-2">
        ${{ amount }}<span class="text-2xl text-on-surface-variant font-bold">.{{ String(cents ?? 0).padStart(2, '0') }}</span>
      </div>

      <!-- Kinetic Tracker -->
      <div class="mt-4 flex flex-col gap-2">
        <div class="flex justify-between items-end">
          <span class="font-label text-xs font-medium text-on-surface-variant">Daily Goal: ${{ goal }}</span>
          <span class="font-headline text-sm font-bold text-primary">{{ progress }}%</span>
        </div>
        <div class="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-primary to-primary-container rounded-full shadow-[0_0_10px_rgba(255,122,47,0.5)] transition-all duration-700"
            :style="{ width: `${progress}%` }"
          />
        </div>
      </div>
    </div>

    <!-- Metric Cards -->
    <div class="grid grid-cols-2 gap-4">
      <div class="bg-surface-container-lowest rounded-xl p-5 flex flex-col justify-between shadow-cloud-sm">
        <span class="material-symbols-outlined text-outline-variant mb-2">route</span>
        <span class="font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Completed</span>
        <span class="font-headline text-2xl font-bold text-on-surface mt-1">
          {{ completedStops }} <span class="text-xs font-normal text-on-surface-variant tracking-normal">stops</span>
        </span>
      </div>

      <div class="bg-surface-container-lowest rounded-xl p-5 flex flex-col justify-between shadow-cloud-sm">
        <span class="material-symbols-outlined text-outline-variant mb-2">calendar_month</span>
        <span class="font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">This Week</span>
        <span class="font-headline text-2xl font-bold text-on-surface mt-1">
          ${{ weeklyAmount }}<span class="text-xs font-normal text-on-surface-variant tracking-normal">.{{ String(weeklyCents ?? 0).padStart(2, '0') }}</span>
        </span>
      </div>
    </div>
  </section>
</template>

