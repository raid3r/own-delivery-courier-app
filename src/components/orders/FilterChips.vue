<script setup lang="ts">
export interface FilterChip {
  id: string
  label: string
  icon?: string
}

interface Props {
  chips: FilterChip[]
  active?: string
}

defineProps<Props>()
defineEmits<{ select: [id: string] }>()
</script>

<template>
  <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
    <button
      v-for="chip in chips"
      :key="chip.id"
      class="flex items-center gap-1 px-4 py-2 rounded-full font-label text-sm font-semibold shrink-0 whitespace-nowrap transition-colors"
      :class="
        chip.id === active
          ? 'bg-primary text-on-primary'
          : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
      "
      @click="$emit('select', chip.id)"
    >
      <span v-if="chip.icon" class="material-symbols-outlined text-sm">{{ chip.icon }}</span>
      {{ chip.label }}
    </button>
  </div>
</template>

