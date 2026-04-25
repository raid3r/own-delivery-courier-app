<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useRouter } from 'vue-router'

const router = useRouter()
const mapEl = ref<HTMLElement | null>(null)
let map: L.Map | null = null

// Kyiv demo points
const PICKUP = { lat: 50.4501, lng: 30.5234, label: 'Pickup', name: 'Майдан Незалежності', detail: 'Хрещатик, 1' }
const DROPOFF = { lat: 50.4612, lng: 30.4456, label: 'Dropoff', name: 'ТРЦ Lavina Mall', detail: 'просп. Берестейський, 75' }

// Intermediate waypoints to simulate a realistic road route
const ROUTE_COORDS: [number, number][] = [
  [50.4501, 30.5234],
  [50.4535, 30.5180],
  [50.4570, 30.5050],
  [50.4590, 30.4900],
  [50.4605, 30.4720],
  [50.4612, 30.4556],
  [50.4612, 30.4456],
]

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

onMounted(() => {
  if (!mapEl.value) return

  map = L.map(mapEl.value, {
    center: [50.455, 30.490],
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

  // Route polyline
  L.polyline(ROUTE_COORDS, {
    color: '#ff7a2f',
    weight: 5,
    opacity: 0.85,
    dashArray: undefined,
    lineJoin: 'round',
    lineCap: 'round',
  }).addTo(map)

  // Pickup marker
  L.marker([PICKUP.lat, PICKUP.lng], { icon: createIcon('pickup') })
    .addTo(map)
    .bindPopup(`
      <div style="font-family:Inter,sans-serif; min-width:160px;">
        <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#595c5e;margin:0 0 4px;">Звідси забрати</p>
        <p style="font-size:14px;font-weight:700;color:#2c2f31;margin:0;">${PICKUP.name}</p>
        <p style="font-size:12px;color:#595c5e;margin:2px 0 0;">${PICKUP.detail}</p>
      </div>
    `, { offset: [0, -44] })
    .openPopup()

  // Dropoff marker
  L.marker([DROPOFF.lat, DROPOFF.lng], { icon: createIcon('dropoff') })
    .addTo(map)
    .bindPopup(`
      <div style="font-family:Inter,sans-serif; min-width:160px;">
        <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#595c5e;margin:0 0 4px;">Доставити сюди</p>
        <p style="font-size:14px;font-weight:700;color:#2c2f31;margin:0;">${DROPOFF.name}</p>
        <p style="font-size:12px;color:#595c5e;margin:2px 0 0;">${DROPOFF.detail}</p>
      </div>
    `, { offset: [0, -44] })

  // Courier marker (midpoint of route)
  const mid = ROUTE_COORDS[Math.floor(ROUTE_COORDS.length / 2)]
  L.marker(mid, { icon: createCourierIcon() })
    .addTo(map)
    .bindPopup(`<div style="font-family:Inter,sans-serif;font-weight:700;color:#2c2f31;">Ви тут</div>`)

  // Fit map to route
  map.fitBounds(L.polyline(ROUTE_COORDS).getBounds(), { padding: [60, 60] })
})

onUnmounted(() => {
  map?.remove()
  map = null
})
</script>

<template>
  <div class="relative h-dvh w-full flex flex-col bg-surface overflow-hidden">

    <!-- Map -->
    <div ref="mapEl" class="flex-1 w-full z-0" />

    <!-- Top overlay: back button + title -->
    <div class="absolute top-5 left-0 right-0 z-10 flex items-center justify-between px-5 pointer-events-none">
      <button
        class="pointer-events-auto bg-surface/85 backdrop-blur-md p-3 rounded-full shadow-cloud-md text-on-surface hover:bg-surface-container-low transition-colors"
        @click="router.back()"
      >
        <span class="material-symbols-outlined">arrow_back</span>
      </button>

      <div class="pointer-events-auto bg-surface/85 backdrop-blur-md px-4 py-2 rounded-full shadow-cloud-md flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span class="font-body text-xs font-semibold text-on-surface tracking-widest uppercase">In Transit</span>
      </div>
    </div>

    <!-- Bottom sheet: route info -->
    <div class="absolute bottom-0 left-0 right-0 z-10 bg-surface rounded-t-3xl shadow-nav px-5 pt-4 pb-8 flex flex-col gap-4">
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
            <p class="font-body text-sm font-semibold text-on-surface">Майдан Незалежності</p>
            <p class="font-body text-xs text-on-surface-variant">Хрещатик, 1</p>
          </div>
        </div>

        <!-- Dropoff -->
        <div class="flex items-start gap-4 relative z-10">
          <div class="w-6 h-6 rounded-full bg-surface-container-lowest border-2 border-tertiary flex items-center justify-center shrink-0 mt-0.5">
            <span class="material-symbols-outlined text-[14px] text-tertiary icon-filled">location_on</span>
          </div>
          <div>
            <p class="font-label text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Доставити</p>
            <p class="font-body text-sm font-semibold text-on-surface">ТРЦ Lavina Mall</p>
            <p class="font-body text-xs text-on-surface-variant">просп. Берестейський, 75</p>
          </div>
        </div>
      </div>

      <!-- Metrics row -->
      <div class="grid grid-cols-3 gap-3">
        <div class="bg-surface-container-low rounded-xl p-3 flex flex-col items-center gap-1">
          <span class="material-symbols-outlined text-outline-variant text-lg">schedule</span>
          <span class="font-headline text-base font-bold text-on-surface">18 хв</span>
          <span class="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">ETA</span>
        </div>
        <div class="bg-surface-container-low rounded-xl p-3 flex flex-col items-center gap-1">
          <span class="material-symbols-outlined text-outline-variant text-lg">route</span>
          <span class="font-headline text-base font-bold text-on-surface">7.2 км</span>
          <span class="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">Маршрут</span>
        </div>
        <div class="bg-surface-container-low rounded-xl p-3 flex flex-col items-center gap-1">
          <span class="material-symbols-outlined text-outline-variant text-lg">payments</span>
          <span class="font-headline text-base font-bold text-on-surface">$24.50</span>
          <span class="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">Виплата</span>
        </div>
      </div>

      <!-- Action button -->
      <button
        class="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-4 rounded-full font-headline font-bold text-base shadow-primary-glow flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        @click="router.push('/orders/active')"
      >
        <span class="material-symbols-outlined">navigation</span>
        Почати навігацію
      </button>
    </div>
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
  box-shadow: 0 4px 20px -8px rgba(44,47,49,0.15) !important;
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

