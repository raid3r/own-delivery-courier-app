<script setup lang="ts">
interface Props {
  mapImageUrl?: string
  status?: string
  showBackButton?: boolean
}

withDefaults(defineProps<Props>(), {
  status: 'In Transit',
  showBackButton: true,
})

defineEmits<{ back: [] }>()
</script>

<template>
  <div
    class="relative w-full h-56 bg-surface-container-high overflow-hidden"
    :style="mapImageUrl ? `background-image: url('${mapImageUrl}'); background-size: cover; background-position: center;` : ''"
  >
    <!-- Tinted overlay -->
    <div class="absolute inset-0 bg-surface/20" />

    <!-- Back button -->
    <div v-if="showBackButton" class="absolute top-5 left-5 z-10">
      <button
        class="bg-surface/80 glass p-3 rounded-full shadow-cloud-md text-on-surface hover:bg-surface-container-low transition-colors"
        @click="$emit('back')"
      >
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
    </div>

    <!-- Status badge -->
    <div class="absolute top-5 right-5 z-10">
      <div class="bg-surface/80 glass px-4 py-2 rounded-full shadow-cloud-md flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span class="font-body text-xs font-semibold text-on-surface tracking-widest uppercase">
          {{ status }}
        </span>
      </div>
    </div>
  </div>
</template>

