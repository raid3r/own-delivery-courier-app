<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import L from 'leaflet'
import type { OrderResponse, AddressDto } from '@/types/api'
import { API_ORDER_STATUS } from '@/constants/order-status-codes'

interface Props {
  order?: OrderResponse | null
  status?: string
  showBackButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  status: 'In Transit',
  showBackButton: true,
})

defineEmits<{ back: [] }>()

const mapContainer = ref<HTMLElement | null>(null)
let mapInstance: L.Map | null = null

// Визначаємо, яку адресу показувати в залежності від статусу
const targetAddress = computed(() => {
  if (!props.order) return null

  // Якщо замовлення ще не взяте (статус ASSIGNED) - показуємо pickup адресу
  if (props.order.status === API_ORDER_STATUS.ASSIGNED) {
    return props.order.pickupAddress
  }

  // Для інших статусів - показуємо delivery адресу
  return props.order.deliveryAddress
})

const markerLabel = computed(() => {
  if (!props.order) return 'Location'

  if (props.order.status === API_ORDER_STATUS.ASSIGNED) {
    return 'Pickup Location'
  }

  return 'Delivery Location'
})

// Функція для відкриття маршруту в системній карті
function openInMapsApp(address: AddressDto) {
  const lat = address.latitude
  const lng = address.longitude
  const label = encodeURIComponent(address.street || 'Location')

  // Визначаємо, який застосунок карти запустити
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isAndroid = /Android/.test(navigator.userAgent)

  if (isIOS) {
    // Apple Maps
    window.location.href = `maps://maps.apple.com/?daddr=${lat},${lng}&q=${label}`
  } else if (isAndroid) {
    // Google Maps
    window.location.href = `geo:${lat},${lng}?q=${label}`
  } else {
    // Desktop - відкриваємо Google Maps в новій вкладці
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`)
  }
}

// Функція для ініціалізації карти
function initializeMap() {
  if (!mapContainer.value || !targetAddress.value) return

  // Видаляємо стару карту якщо вона існує
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }

  const { latitude, longitude } = targetAddress.value

  // Створюємо карту
  mapInstance = L.map(mapContainer.value, {
    center: [latitude, longitude],
    zoom: 15,
    zoomControl: true,
    scrollWheelZoom: false, // Вимикаємо zoom на скролі щоб не конфліктувало з прокруткою сторінки
  })

  // Додаємо OpenStreetMap тайли
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(mapInstance)

  // Створюємо іконку маркера з кастомним стилем
  const customIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })

  // Додаємо маркер на карту
  L.marker([latitude, longitude], { icon: customIcon })
    .bindPopup(`<div class="text-sm">
      <p class="font-bold">${markerLabel.value}</p>
      <p class="text-xs text-gray-600">${targetAddress.value.street || 'Location'}</p>
      <button onclick="window.mapClickHandler && window.mapClickHandler()" class="mt-2 text-blue-600 text-xs hover:underline">
        Open in Maps
      </button>
    </div>`)
    .addTo(mapInstance)

  // Зберігаємо функцію обробки кліку в глобальний обсяг для popup
  ;(window as any).mapClickHandler = () => {
    if (targetAddress.value) {
      openInMapsApp(targetAddress.value)
    }
  }
}

onMounted(() => {
  initializeMap()
})

// Перестворюємо карту при зміні замовлення або адреси
watch(() => targetAddress.value, () => {
  initializeMap()
})
</script>

<template>
  <div class="relative w-full h-56 bg-surface-container-high overflow-hidden">
    <!-- Map container -->
    <div
      ref="mapContainer"
      class="w-full h-full"
    />

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

