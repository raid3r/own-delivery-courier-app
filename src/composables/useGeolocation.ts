import { computed, readonly, ref } from 'vue'
import { locationApi } from '@/api/endpoints/location.api'
import { useLocationStore } from '@/stores/location.store'

const LOCATION_SYNC_INTERVAL_MS = 10_000

let watchId: number | null = null
let lastSentAt = 0
const isSending = ref(false)

export function useGeolocation() {
  const locationStore = useLocationStore()

  const isSupported = computed(() => typeof navigator !== 'undefined' && 'geolocation' in navigator)

  async function syncPosition(position: GeolocationPosition) {
    const now = Date.now()
    const { latitude, longitude, accuracy, altitude, speed } = position.coords

    locationStore.current = {
      lat: latitude,
      lng: longitude,
    }

    // Successful position callback means browser geolocation is working again.
    locationStore.error = null

    if (isSending.value || now - lastSentAt < LOCATION_SYNC_INTERVAL_MS) {
      return
    }

    isSending.value = true

    try {
      await locationApi.updateLocation({
        latitude,
        longitude,
        accuracy: Number.isFinite(accuracy) ? accuracy : null,
        altitude: Number.isFinite(altitude) ? (altitude as number) : null,
        speed: Number.isFinite(speed) ? (speed as number) : null,
      })
      lastSentAt = now
      locationStore.lastSyncedAt = new Date(now).toISOString()
    } catch (error) {
      locationStore.error = error instanceof Error ? error.message : 'Не вдалося оновити геолокацію'
    } finally {
      isSending.value = false
    }
  }

  function handlePositionError(error: GeolocationPositionError) {
    locationStore.error = error.message
    locationStore.watching = false
  }

  function startTracking() {
    if (!isSupported.value) {
      locationStore.error = 'Геолокація не підтримується цим пристроєм'
      return
    }

    if (watchId !== null) {
      return
    }

    locationStore.watching = true
    locationStore.error = null

    watchId = navigator.geolocation.watchPosition(syncPosition, handlePositionError, {
      enableHighAccuracy: true,
      maximumAge: 5_000,
      timeout: 15_000,
    })
  }

  function stopTracking() {
    if (watchId !== null && isSupported.value) {
      navigator.geolocation.clearWatch(watchId)
    }

    watchId = null
    lastSentAt = 0
    locationStore.watching = false
    isSending.value = false
  }

  return {
    error: computed(() => locationStore.error),
    isSending: readonly(isSending),
    isSupported,
    startTracking,
    stopTracking,
  }
}
