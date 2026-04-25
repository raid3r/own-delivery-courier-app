<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppLayout from '@/components/layout/AppLayout.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ProfileHeader from '@/components/profile/ProfileHeader.vue'
import SettingsGroup from '@/components/profile/SettingsGroup.vue'
import type { SettingsItem } from '@/components/profile/SettingsGroup.vue'
import { couriersApi } from '@/api/endpoints/couriers.api'
import { ordersApi } from '@/api/endpoints/orders.api'
import { useAuthStore } from '@/stores/auth.store'
import type { OrderResponse } from '@/types/api'

const router = useRouter()
const authStore = useAuthStore()

const isLoading = ref(true)
const loadError = ref<string | null>(null)
const orders = ref<OrderResponse[]>([])

const profile = computed(() => authStore.profile)

const profileName = computed(() => {
  const p = profile.value
  if (!p) return 'Courier'
  return `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || 'Courier'
})

const role = computed(() => (profile.value?.isActive ? 'Active Courier' : 'Courier'))

const stats = computed(() => {
  const total = orders.value.length
  const delivered = orders.value.filter((o) => o.status === 4).length
  const inProgress = orders.value.filter((o) => o.status === 1 || o.status === 2 || o.status === 3).length

  return [
    { label: 'Orders', value: total, icon: 'package_2' },
    { label: 'Delivered', value: delivered, icon: 'done_all' },
    { label: 'In Progress', value: inProgress, icon: 'route' },
  ]
})

const accountSettings = computed<SettingsItem[]>(() => {
  const p = profile.value
  return [
    { id: 'email', label: 'Email', icon: 'mail', value: p?.email ?? 'N/A' },
    { id: 'phone', label: 'Phone', icon: 'call', value: p?.phoneNumber ?? 'N/A' },
    { id: 'status', label: 'Status', icon: 'verified', value: p?.isActive ? 'Active' : 'Inactive' },
  ]
})

const appSettings: SettingsItem[] = [
  { id: 'history', label: 'Delivery History', icon: 'history' },
  { id: 'support', label: 'Help & Support', icon: 'help' },
  { id: 'privacy', label: 'Privacy Policy', icon: 'shield' },
]

const supportUrl = import.meta.env.VITE_SUPPORT_URL ?? 'https://support.owndelivery.app'
const privacyUrl = import.meta.env.VITE_PRIVACY_URL ?? 'https://owndelivery.app/privacy'

const dangerSettings: SettingsItem[] = [
  { id: 'logout', label: 'Sign Out', icon: 'logout', danger: true },
]

async function loadProfileData() {
  isLoading.value = true
  loadError.value = null

  try {
    const { data } = await couriersApi.getMe()
    authStore.profile = data
  } catch {
    loadError.value = 'Failed to load profile data. Please try again.'
    isLoading.value = false
    return
  }

  try {
    const { data } = await ordersApi.getMyOrders()
    orders.value = data
  } catch {
    // Keep profile visible even if stats endpoint is temporarily unavailable.
    orders.value = []
  } finally {
    isLoading.value = false
  }
}

async function onSelect(id: string) {
  switch (id) {
    case 'history':
      await router.push('/history')
      return
    case 'support':
      window.open(supportUrl, '_blank', 'noopener,noreferrer')
      return
    case 'privacy':
      window.open(privacyUrl, '_blank', 'noopener,noreferrer')
      return
    case 'logout':
      await authStore.logout()
      await router.push('/login')
      return
    default:
      return
  }
}

onMounted(() => {
  loadProfileData()
})
</script>

<template>
  <AppLayout title="Velocity">
    <div class="flex flex-col gap-6">
      <div
        v-if="loadError"
        class="rounded-2xl bg-error-container/70 text-on-error-container p-4 flex items-start justify-between gap-3"
      >
        <div class="flex items-start gap-2">
          <span class="material-symbols-outlined text-[18px] shrink-0">error</span>
          <p class="font-body text-sm">{{ loadError }}</p>
        </div>
        <AppButton size="sm" variant="danger" @click="loadProfileData">
          Retry
        </AppButton>
      </div>

      <div v-else-if="isLoading" class="bg-surface-container-low rounded-3xl p-6 flex items-center gap-3">
        <svg class="h-5 w-5 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <p class="font-body text-sm text-on-surface-variant">Loading profile...</p>
      </div>

      <template v-else>
        <ProfileHeader
          :name="profileName"
          :role="role"
          :stats="stats"
          :rating="0"
        />

        <SettingsGroup title="Account" :items="accountSettings" @select="onSelect" />
        <SettingsGroup title="App" :items="appSettings" @select="onSelect" />
        <SettingsGroup :items="dangerSettings" @select="onSelect" />
      </template>
    </div>
  </AppLayout>
</template>
