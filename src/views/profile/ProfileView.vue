<script setup lang="ts">
import AppLayout from '@/components/layout/AppLayout.vue'
import ProfileHeader from '@/components/profile/ProfileHeader.vue'
import SettingsGroup from '@/components/profile/SettingsGroup.vue'
import type { SettingsItem } from '@/components/profile/SettingsGroup.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const stats = [
  { label: 'Deliveries', value: '428', icon: 'package_2' },
  { label: 'Rating', value: '4.9', icon: 'star' },
  { label: 'Km', value: '3.2k', icon: 'route' },
]

const accountSettings: SettingsItem[] = [
  { id: 'personal', label: 'Personal Information', icon: 'person' },
  { id: 'vehicle', label: 'Vehicle Details', icon: 'directions_car', value: 'Sedan' },
  { id: 'payment', label: 'Payment Methods', icon: 'payments' },
  { id: 'notifications', label: 'Notifications', icon: 'notifications' },
]

const appSettings: SettingsItem[] = [
  { id: 'history', label: 'Delivery History', icon: 'history' },
  { id: 'support', label: 'Help & Support', icon: 'help' },
  { id: 'privacy', label: 'Privacy Policy', icon: 'shield' },
]

const dangerSettings: SettingsItem[] = [
  { id: 'logout', label: 'Sign Out', icon: 'logout', danger: true },
]

function onSelect(id: string) {
  if (id === 'history') router.push('/history')
  if (id === 'logout') router.push('/login')
}
</script>

<template>
  <AppLayout title="Velocity">
    <div class="flex flex-col gap-6">
      <ProfileHeader
        name="Alex Mercer"
        role="Senior Courier"
        :stats="stats"
        :rating="4.9"
      />

      <SettingsGroup title="Account" :items="accountSettings" @select="onSelect" />
      <SettingsGroup title="App" :items="appSettings" @select="onSelect" />
      <SettingsGroup :items="dangerSettings" @select="onSelect" />
    </div>
  </AppLayout>
</template>
