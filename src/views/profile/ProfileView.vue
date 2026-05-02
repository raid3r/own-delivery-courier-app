<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppLayout from '@/components/layout/AppLayout.vue'
import PageLoadState from '@/components/ui/PageLoadState.vue'
import ProfileHeader from '@/components/profile/ProfileHeader.vue'
import SettingsGroup from '@/components/profile/SettingsGroup.vue'
import type { SettingsItem } from '@/components/profile/SettingsGroup.vue'
import { couriersApi } from '@/api/endpoints/couriers.api'
import { API_ORDER_STATUS } from '@/constants/order-status-codes'
import { useMyOrders } from '@/composables/useMyOrders'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()
const {
  orders,
  loadMyOrders,
} = useMyOrders()

const isLoading = ref(true)
const loadError = ref<string | null>(null)

const profile = computed(() => authStore.profile)

const profileName = computed(() => {
  const p = profile.value
  if (!p) return 'Courier'
  return `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || 'Courier'
})

const role = computed(() => (profile.value?.isActive ? 'Active Courier' : 'Courier'))

const stats = computed(() => {
  const total = orders.value.length
  const delivered = orders.value.filter((o) => o.status === API_ORDER_STATUS.DELIVERED).length
  const inProgress = orders.value.filter((o) => {
    return o.status === API_ORDER_STATUS.ASSIGNED
      || o.status === API_ORDER_STATUS.PICKED_UP
      || o.status === API_ORDER_STATUS.IN_TRANSIT
  }).length

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
    await loadMyOrders({
      errorMessage: 'Failed to load profile orders. Please try again.',
      throwOnError: true,
    })
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
      <PageLoadState
        :error-text="loadError"
        :is-loading="isLoading"
        loading-text="Loading profile..."
        @retry="loadProfileData"
      />

      <template v-if="!loadError && !isLoading">
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
