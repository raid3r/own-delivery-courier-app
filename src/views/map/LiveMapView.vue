<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import L from 'leaflet'
import { useRoute, useRouter } from 'vue-router'
import { API_ORDER_STATUS } from '@/constants/order-status-codes'

// Fix default icon issue in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

import AppHeader from '@/components/layout/AppHeader.vue'
import BottomNavBar from '@/components/layout/BottomNavBar.vue'
import PageLoadState from '@/components/ui/PageLoadState.vue'
import { useOrderDetails } from '@/composables/useOrderDetails'
import { useGeolocation } from '@/composables/useGeolocation'
import { useLocationStore } from '@/stores/location.store'
import { getOrderStatusLabel } from '@/utils/order-formatters'
import { calculateDistanceKm, kilometersToMiles, roundToSingleDecimal } from '@/utils/geo'

const router = useRouter()
const route = useRoute()

const mapEl = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let courierMarker: L.Marker | null = null
let routePolyline: L.Polyline | null = null
let routeRequestController: AbortController | null = null
const roadDistanceMeters = ref<number | null>(null)
const roadDurationSeconds = ref<number | null>(null)

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving'

const {
  order,
  isLoading: isOrderLoading,
  loadError: orderError,
  loadActiveOrder,
} = useOrderDetails()

const locationStore = useLocationStore()

const {
  startTracking,
  stopTracking,
} = useGeolocation()

const requestedOrderId = computed(() => {
  const { id } = route.query
  return typeof id === 'string' ? id : null
})

const statusLabel = computed(() => (order.value ? getOrderStatusLabel(order.value.status) : 'Inactive'))

function calculateStraightRouteDistanceMiles(points: [number, number][]): number {
  if (points.length < 2) return 0

  let totalKm = 0
  for (let index = 1; index < points.length; index += 1) {
    const [prevLat, prevLng] = points[index - 1]
    const [lat, lng] = points[index]
    totalKm += calculateDistanceKm(prevLat, prevLng, lat, lng)
  }

  return roundToSingleDecimal(kilometersToMiles(totalKm))
}

const distanceMiles = computed(() => {
  if (roadDistanceMeters.value !== null) {
    const km = roadDistanceMeters.value / 1000
    return roundToSingleDecimal(kilometersToMiles(km))
  }

  return calculateStraightRouteDistanceMiles(getRouteCoordsByStatus())
})

const etaLabel = computed(() => {
  if (roadDurationSeconds.value !== null) {
    return `${Math.max(1, Math.round(roadDurationSeconds.value / 60))} min`
  }

  return `${Math.max(10, Math.round(distanceMiles.value * 12))} min`
})

const payout = computed(() => order.value?.cost ?? 0)

function buildRouteRequestKey(points: [number, number][]) {
  return points
    .map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`)
    .join('|')
}

async function fetchRoadRouteCoords(points: [number, number][]): Promise<{
  coords: [number, number][]
  distanceMeters: number
  durationSeconds: number
} | null> {
  if (points.length < 2) return null

  const coordinates = points
    .map(([lat, lng]) => `${lng},${lat}`)
    .join(';')

  const requestUrl = `${OSRM_BASE_URL}/${coordinates}?overview=full&geometries=geojson&steps=false&alternatives=false`

  routeRequestController?.abort()
  const controller = new AbortController()
  routeRequestController = controller

  try {
    const response = await fetch(requestUrl, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`OSRM request failed: ${response.status}`)
    }

    const data = await response.json() as {
      routes?: Array<{
        geometry?: { coordinates?: [number, number][] }
        distance?: number
        duration?: number
      }>
    }

    const routeData = data.routes?.[0]
    const roadCoords = routeData?.geometry?.coordinates
    const distanceMeters = Number(routeData?.distance)
    const durationSeconds = Number(routeData?.duration)

    if (!roadCoords?.length || !Number.isFinite(distanceMeters) || !Number.isFinite(durationSeconds)) {
      return null
    }

    // OSRM returns [lng, lat], convert to Leaflet format [lat, lng].
    return {
      coords: roadCoords.map(([lng, lat]) => [lat, lng] as [number, number]),
      distanceMeters,
      durationSeconds,
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return null
    }

    console.error('OSRM routing failed, fallback to straight polyline:', error)
    return null
  } finally {
    if (routeRequestController === controller) {
      routeRequestController = null
    }
  }
}

function createIcon(type: 'pickup' | 'dropoff') {
  const color = type === 'pickup' ? '#9c3f00' : '#7a5400'
  const symbol = type === 'pickup' ? '↑' : '✓'
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:40px; height:40px;
        background:${color};
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 4px 14px rgba(0,0,0,0.25);
        border:3px solid white;
        display:flex; align-items:center; justify-content:center;
      ">
        <span style="transform:rotate(45deg); color:white; font-size:16px; font-weight:bold; line-height:1;">${symbol}</span>
      </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -44],
  })
}

function createCourierIcon() {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:44px; height:44px;
        background:linear-gradient(135deg,#9c3f00,#ff7a2f);
        border-radius:50%;
        box-shadow:0 4px 16px rgba(156,63,0,0.5);
        border:3px solid white;
        display:flex; align-items:center; justify-content:center;
      ">
        <span style="font-size:22px;">🛵</span>
      </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -26],
  })
}

function getRouteCoordsByStatus(): [number, number][] {
  if (!order.value) return []

  const pickup: [number, number] = [order.value.pickupAddress.latitude, order.value.pickupAddress.longitude]
  const delivery: [number, number] = [order.value.deliveryAddress.latitude, order.value.deliveryAddress.longitude]
  const courier = locationStore.current
    ? [locationStore.current.lat, locationStore.current.lng] as [number, number]
    : null

  if (order.value.status === API_ORDER_STATUS.DELIVERED) {
    return [pickup, delivery]
  }

  if (order.value.status === API_ORDER_STATUS.PICKED_UP || order.value.status === API_ORDER_STATUS.IN_TRANSIT) {
    return courier ? [courier, delivery] : [pickup, delivery]
  }

  // Не забрано: кур'єр -> точка забору -> точка доставки.
  return courier ? [courier, pickup, delivery] : [pickup, delivery]
}

async function updateRoutePolyline(shouldFitBounds = false) {
  if (!map) return

  const routeCoords = getRouteCoordsByStatus()
  if (routeCoords.length < 2) return

  const requestKey = buildRouteRequestKey(routeCoords)
  const roadRouteData = await fetchRoadRouteCoords(routeCoords)

  // If map state changed while request was in flight, skip stale update.
  if (!map || requestKey !== buildRouteRequestKey(getRouteCoordsByStatus())) {
    return
  }

  const polylineCoords = roadRouteData && roadRouteData.coords.length > 1
    ? roadRouteData.coords
    : routeCoords

  if (roadRouteData) {
    roadDistanceMeters.value = roadRouteData.distanceMeters
    roadDurationSeconds.value = roadRouteData.durationSeconds
  } else {
    roadDistanceMeters.value = null
    roadDurationSeconds.value = null
  }

  if (routePolyline) {
    routePolyline.setLatLngs(polylineCoords)
  } else {
    routePolyline = L.polyline(polylineCoords, {
      color: '#ff7a2f',
      weight: 5,
      opacity: 0.85,
      dashArray: undefined,
      lineJoin: 'round',
      lineCap: 'round',
    }).addTo(map)
  }

  if (shouldFitBounds) {
    map.fitBounds(L.latLngBounds(polylineCoords), { padding: [60, 60] })
  }
}

function syncCourierMarker() {
  if (!map || !locationStore.current) return

  const courierPosition: [number, number] = [locationStore.current.lat, locationStore.current.lng]

  if (courierMarker) {
    courierMarker.setLatLng(courierPosition)
    return
  }

  courierMarker = L.marker(courierPosition, {
    icon: createCourierIcon(),
    zIndexOffset: 1000,
  })
    .addTo(map)
    .bindPopup(`<div style="font-family:Inter,sans-serif;font-weight:700;color:#2c2f31;">Ви тут</div>`)
}

async function initializeMap() {
  if (!order.value) return

  // Дочекаємося, поки DOME готовий
  await nextTick()

  // Додатна затримка для гарантування розмірів контейнера
  await new Promise(resolve => setTimeout(resolve, 100))

  if (!mapEl.value) {
    console.error('Map element not found')
    return
  }

  // Видаляємо старі карту, якщо вона існує
  if (map) {
    map.remove()
    map = null
  }

  const pickupLat = order.value.pickupAddress.latitude
  const pickupLng = order.value.pickupAddress.longitude

  try {
    // Ініціалізуємо карту
    map = L.map(mapEl.value, {
      center: [pickupLat, pickupLng],
      zoom: 13,
      zoomControl: false,
    })

    // Tile layer — OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    // Custom zoom control (bottom-right)
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Route polyline (depends on order status + courier position)
    // Delay first request until markers are added to avoid duplicate OSRM fetch.
    // Pickup marker
    L.marker([order.value.pickupAddress.latitude, order.value.pickupAddress.longitude], {
      icon: createIcon('pickup'),
    })
      .addTo(map)
      .bindPopup(`
        <div style="font-family:Inter,sans-serif; min-width:160px;">
          <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#595c5e;margin:0 0 4px;">Звідси забрати</p>
          <p style="font-size:14px;font-weight:700;color:#2c2f31;margin:0;">${order.value.pickupAddress.street || 'Pickup'}</p>
          <p style="font-size:12px;color:#595c5e;margin:2px 0 0;">${order.value.pickupAddress.buildingNumber}</p>
        </div>
      `, { offset: [0, -44] })

    // Dropoff marker
    L.marker([order.value.deliveryAddress.latitude, order.value.deliveryAddress.longitude], {
      icon: createIcon('dropoff'),
    })
      .addTo(map)
      .bindPopup(`
        <div style="font-family:Inter,sans-serif; min-width:160px;">
          <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#595c5e;margin:0 0 4px;">Доставити сюди</p>
          <p style="font-size:14px;font-weight:700;color:#2c2f31;margin:0;">${order.value.deliveryAddress.street || 'Delivery'}</p>
          <p style="font-size:12px;color:#595c5e;margin:2px 0 0;">${order.value.deliveryAddress.buildingNumber}</p>
        </div>
      `, { offset: [0, -44] })

    // Add courier marker if location is already available
    syncCourierMarker()

    // Ensure viewport matches currently active route after all layers are ready
    await updateRoutePolyline(true)

    // Виклик invalidateSize() щоб карта відобразилась правильно
    map.invalidateSize()

    console.log('Map initialized successfully', {
      courierLocation: locationStore.current,
      status: order.value.status,
      routeCoords: getRouteCoordsByStatus(),
    })
  } catch (error) {
    console.error('Error initializing map:', error)
  }
}

onMounted(() => {
  loadActiveOrder(requestedOrderId.value, {
    errorMessage: 'Failed to load order. Please try again.',
  })

  startTracking()
})

watch(
  () => order.value,
  async () => {
    await initializeMap()
  }
)

watch(
  () => locationStore.current,
  () => {
    if (!map) return

    syncCourierMarker()
    void updateRoutePolyline(false)

    if (locationStore.current) {
      console.log('Courier marker/location updated:', locationStore.current)
    }
  }
)

watch(
  () => order.value?.status,
  () => {
    if (!map || !order.value) return

    void updateRoutePolyline(true)
    console.log('Route status changed:', {
      status: order.value.status,
      routeCoords: getRouteCoordsByStatus(),
    })
  }
)

onUnmounted(() => {
  stopTracking()
  routeRequestController?.abort()
  map?.remove()
  map = null
  courierMarker = null
  routePolyline = null
  routeRequestController = null
  roadDistanceMeters.value = null
  roadDurationSeconds.value = null
})
</script>

<template>
  <div class="bg-surface min-h-dvh flex flex-col pb-28">
    <AppHeader title="Live Map">
      <template #actions>
        <button
          class="flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-low hover:bg-surface-container transition-colors"
          title="Назад"
          @click="router.back()"
        >
          <span class="material-symbols-outlined text-on-surface text-[20px]">arrow_back</span>
        </button>
      </template>
    </AppHeader>

    <template v-if="order && !isOrderLoading && !orderError">
      <!-- Map container with fixed height -->
      <div class="pt-20 w-full relative h-96">
        <div ref="mapEl" class="w-full h-full" />

        <!-- Status badge (overlaid on map) -->
        <div class="absolute top-4 right-5 z-[1100] pointer-events-none">
          <div class="bg-surface/85 backdrop-blur-md px-4 py-2 rounded-full shadow-cloud-md flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span class="font-body text-xs font-semibold text-on-surface tracking-widest uppercase">{{ statusLabel }}</span>
          </div>
        </div>
      </div>

      <!-- Courier location info (below map) -->
      <div class="px-5 py-3 bg-surface-container-low">
        <div class="flex items-center justify-between gap-2 text-xs">
          <div class="flex flex-col gap-1">
            <p class="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">Локація курєра</p>
            <p class="font-body text-sm font-semibold text-on-surface">
              {{ locationStore.current ? `${locationStore.current.lat.toFixed(6)}, ${locationStore.current.lng.toFixed(6)}` : 'Дані відсутні' }}
            </p>
          </div>
          <div class="flex items-center gap-1">
            <span v-if="locationStore.watching" class="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span class="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">
              {{ locationStore.watching ? 'Активно' : 'Неактивно' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Info sheet: route info (below map) -->
      <div class="bg-surface rounded-t-3xl shadow-nav px-5 pt-4 pb-8 flex flex-col gap-4 overflow-y-auto">
        <!-- Handle -->
        <div class="w-12 h-1.5 bg-outline-variant/30 rounded-full mx-auto" />

        <!-- Route stops -->
        <div class="flex flex-col gap-3 relative">
          <div class="absolute left-[11px] top-4 bottom-4 w-0.5 bg-surface-container-high z-0" />

          <!-- Pickup -->
          <div class="flex items-start gap-4 relative z-10">
            <div class="w-6 h-6 rounded-full bg-surface-container-lowest border-2 border-primary flex items-center justify-center shrink-0 mt-0.5">
              <span class="w-2 h-2 rounded-full bg-primary" />
            </div>
            <div>
              <p class="font-label text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Забрати</p>
              <p class="font-body text-sm font-semibold text-on-surface">{{ order.pickupAddress.street || 'Pickup' }}</p>
              <p class="font-body text-xs text-on-surface-variant">{{ order.pickupAddress.buildingNumber }}</p>
            </div>
          </div>

          <!-- Dropoff -->
          <div class="flex items-start gap-4 relative z-10">
            <div class="w-6 h-6 rounded-full bg-surface-container-lowest border-2 border-tertiary flex items-center justify-center shrink-0 mt-0.5">
              <span class="material-symbols-outlined text-[14px] text-tertiary icon-filled">location_on</span>
            </div>
            <div>
              <p class="font-label text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Доставити</p>
              <p class="font-body text-sm font-semibold text-on-surface">{{ order.deliveryAddress.street || 'Delivery' }}</p>
              <p class="font-body text-xs text-on-surface-variant">{{ order.deliveryAddress.buildingNumber }}</p>
            </div>
          </div>
        </div>

        <!-- Metrics row -->
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-surface-container-low rounded-xl p-3 flex flex-col items-center gap-1">
            <span class="material-symbols-outlined text-outline-variant text-lg">schedule</span>
            <span class="font-headline text-base font-bold text-on-surface">{{ etaLabel }}</span>
            <span class="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">ETA</span>
          </div>
          <div class="bg-surface-container-low rounded-xl p-3 flex flex-col items-center gap-1">
            <span class="material-symbols-outlined text-outline-variant text-lg">route</span>
            <span class="font-headline text-base font-bold text-on-surface">{{ distanceMiles }} mi</span>
            <span class="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">Маршрут</span>
          </div>
          <div class="bg-surface-container-low rounded-xl p-3 flex flex-col items-center gap-1">
            <span class="material-symbols-outlined text-outline-variant text-lg">payments</span>
            <span class="font-headline text-base font-bold text-on-surface">${{ payout }}</span>
            <span class="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">Виплата</span>
          </div>
        </div>

        <!-- Action button -->
        <button
          class="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-4 rounded-full font-headline font-bold text-base shadow-primary-glow flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          @click="router.push('/orders/active')"
        >
          <span class="material-symbols-outlined">navigation</span>
          Перейти до замовлення
        </button>
      </div>
    </template>

    <div v-else class="pt-20 flex-1 flex flex-col gap-6 p-5">
      <PageLoadState
        :error-text="orderError"
        :is-loading="isOrderLoading"
        loading-text="Loading map..."
        @retry="loadActiveOrder(requestedOrderId, { errorMessage: 'Failed to load order. Please try again.' })"
      />

      <div v-if="!orderError && !isOrderLoading" class="bg-surface-container-lowest rounded-3xl p-6 text-center">
        <p class="font-body text-sm text-on-surface-variant mb-4">No active delivery to track.</p>
        <button
          class="bg-primary text-on-primary px-5 py-3 rounded-full font-headline font-bold"
          @click="router.push('/orders')"
        >
          Back to Orders
        </button>
      </div>
    </div>

    <BottomNavBar />
  </div>
</template>

<style scoped>
/* Override Leaflet popup styling to match design system */
:deep(.leaflet-popup-content-wrapper) {
  border-radius: 0.75rem;
  box-shadow: 0 8px 30px -8px rgba(44, 47, 49, 0.12);
  border: none;
  padding: 0;
}
:deep(.leaflet-popup-content) {
  margin: 12px 16px;
}
:deep(.leaflet-popup-tip-container) {
  display: none;
}
:deep(.leaflet-control-zoom) {
  border: none !important;
  box-shadow: 0 4px 20px -8px rgba(44, 47, 49, 0.15) !important;
}
:deep(.leaflet-control-zoom a) {
  border-radius: 0.5rem !important;
  border: none !important;
  color: #2c2f31 !important;
  font-size: 18px !important;
  line-height: 30px !important;
  width: 32px !important;
  height: 32px !important;
}
:deep(.leaflet-control-zoom-in) {
  border-radius: 0.5rem 0.5rem 0 0 !important;
}
:deep(.leaflet-control-zoom-out) {
  border-radius: 0 0 0.5rem 0.5rem !important;
}
</style>
