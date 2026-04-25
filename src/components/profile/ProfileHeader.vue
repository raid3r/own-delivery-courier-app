<script setup lang="ts">
export interface ProfileStat {
  label: string
  value: string | number
  icon?: string
}

interface Props {
  name: string
  role?: string
  avatarUrl?: string
  stats?: ProfileStat[]
  rating?: number
}

withDefaults(defineProps<Props>(), {
  role: 'Courier',
  stats: () => [],
  rating: 0,
})
</script>

<template>
  <div class="bg-surface-container-low rounded-3xl p-6 flex flex-col items-center gap-4 relative overflow-hidden">
    <div class="absolute -right-12 -top-12 w-48 h-48 bg-gradient-to-br from-primary-container to-transparent opacity-10 rounded-full blur-3xl pointer-events-none" />

    <!-- Avatar -->
    <div class="relative">
      <img
        v-if="avatarUrl"
        :src="avatarUrl"
        :alt="name"
        class="w-20 h-20 rounded-full object-cover shadow-cloud-md"
      />
      <div
        v-else
        class="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center"
      >
        <span class="material-symbols-outlined text-4xl text-outline-variant">person</span>
      </div>
      <!-- Rating badge -->
      <div
        v-if="rating"
        class="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-tertiary-container text-on-tertiary-container text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 whitespace-nowrap"
      >
        <span class="material-symbols-outlined text-[12px] icon-filled">star</span>
        {{ rating.toFixed(1) }}
      </div>
    </div>

    <div class="text-center">
      <h2 class="font-headline text-xl font-extrabold text-on-surface">{{ name }}</h2>
      <p class="font-label text-xs text-on-surface-variant uppercase tracking-wider mt-0.5">{{ role }}</p>
    </div>

    <!-- Stats row -->
    <div v-if="stats.length" class="w-full grid gap-2" :class="`grid-cols-${Math.min(stats.length, 3)}`">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="bg-surface-container-lowest rounded-xl p-3 flex flex-col items-center gap-1 shadow-cloud-sm"
      >
        <span v-if="stat.icon" class="material-symbols-outlined text-outline-variant text-sm">{{ stat.icon }}</span>
        <span class="font-headline text-lg font-bold text-on-surface">{{ stat.value }}</span>
        <span class="font-label text-[10px] uppercase tracking-wider text-on-surface-variant text-center">{{ stat.label }}</span>
      </div>
    </div>
  </div>
</template>

