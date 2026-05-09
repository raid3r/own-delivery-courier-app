<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { useGeolocation } from '@/composables/useGeolocation'
import { useLocationStore } from '@/stores/location.store'
import { formatTime } from '@/utils/date'

const locationStore = useLocationStore()
const { isSupported } = useGeolocation()

const isOpen = ref(false)
const rootEl = ref<HTMLElement | null>(null)

const hasError = computed(() => !isSupported.value || Boolean(locationStore.error))
const markerClass = computed(() => (hasError.value ? 'text-error' : 'text-primary'))

const statusLabel = computed(() => {
  if (!isSupported.value) return 'неактивна (не підтримується)'
  return locationStore.watching ? 'активна' : 'неактивна'
})

const coordinatesLabel = computed(() => {
  if (!locationStore.current) return '--'
  const { lat, lng } = locationStore.current
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
})

const lastSyncLabel = computed(() => {
  if (!locationStore.lastSyncedAt) return '--:--'
  return formatTime(locationStore.lastSyncedAt)
})

const shortError = computed(() => {
  const raw = locationStore.error
  if (!isSupported.value) return 'Геолокація не підтримується'
  if (!raw) return null

  const normalized = raw.toLowerCase()
  if (normalized.includes('denied') || normalized.includes('permission')) return 'Немає доступу до геолокації'
  if (normalized.includes('timeout')) return 'Час очікування геолокації вичерпано'
  if (normalized.includes('unavailable')) return 'Позицію тимчасово недоступно'

  return raw.length > 72 ? `${raw.slice(0, 69)}...` : raw
})

function onTogglePopover() {
  isOpen.value = !isOpen.value
}

function onDocumentClick(event: MouseEvent) {
  if (!isOpen.value || !rootEl.value) return
  const target = event.target as Node | null
  if (target && !rootEl.value.contains(target)) {
    isOpen.value = false
  }
}

function onEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onEscape)
})
</script>

<template>
  <div ref="rootEl" class="relative">
    <button
      class="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-low"
      :title="hasError ? 'Геолокація: помилка' : 'Геолокація: все добре'"
      aria-label="Стан геолокації"
      @click="onTogglePopover"
    >
      <span class="material-symbols-outlined icon-filled text-[22px]" :class="markerClass">location_on</span>
    </button>

    <div
      v-show="isOpen"
      class="fixed left-1/2 top-20 z-50 w-[calc(100vw-2rem)] max-w-[18rem] -translate-x-1/2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-3 shadow-cloud-sm"
    >
      <h3 class="font-label text-sm font-semibold text-on-surface mb-2">Геолокація</h3>
      <p class="font-body text-xs text-on-surface-variant">Статус: <span class="text-on-surface">{{ statusLabel }}</span></p>
      <p class="mt-1 font-body text-xs text-on-surface-variant">Остання геолокація: <span class="text-on-surface">{{ coordinatesLabel }}</span></p>
      <p class="mt-1 font-body text-xs text-on-surface-variant">Остання синхронізація: <span class="text-on-surface">{{ lastSyncLabel }}</span></p>
      <p v-if="shortError" class="mt-1 font-body text-xs text-error">Помилка: {{ shortError }}</p>
    </div>
  </div>
</template>
