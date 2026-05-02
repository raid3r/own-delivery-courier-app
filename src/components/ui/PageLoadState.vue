<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'

interface Props {
  errorText: string | null
  isLoading: boolean
  loadingText: string
  retryLabel?: string
}

withDefaults(defineProps<Props>(), {
  retryLabel: 'Retry',
})

defineEmits<{ retry: [] }>()
</script>

<template>
  <div
    v-if="errorText"
    class="rounded-2xl bg-error-container/70 text-on-error-container p-4 flex items-start justify-between gap-3"
  >
    <div class="flex items-start gap-2">
      <span class="material-symbols-outlined text-[18px] shrink-0">error</span>
      <p class="font-body text-sm">{{ errorText }}</p>
    </div>
    <AppButton size="sm" variant="danger" @click="$emit('retry')">
      {{ retryLabel }}
    </AppButton>
  </div>

  <div v-else-if="isLoading" class="bg-surface-container-low rounded-3xl p-6 flex items-center gap-3">
    <svg class="h-5 w-5 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
    <p class="font-body text-sm text-on-surface-variant">{{ loadingText }}</p>
  </div>
</template>

