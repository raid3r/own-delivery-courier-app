<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { RouterView } from 'vue-router'
import { useGeolocation } from '@/composables/useGeolocation'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()
const { startTracking, stopTracking } = useGeolocation()

watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      startTracking()
      return
    }

    stopTracking()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  stopTracking()
})
</script>
<template>
  <RouterView />
</template>
