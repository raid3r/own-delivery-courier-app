<script setup lang="ts">
import AppLayout from '@/components/layout/AppLayout.vue'
import EarningsCard from '@/components/dashboard/EarningsCard.vue'
import RouteOrderCard from '@/components/dashboard/RouteOrderCard.vue'
import type { RouteOrder } from '@/components/dashboard/RouteOrderCard.vue'
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()

const courierName = computed(() => {
  const p = authStore.profile
  if (!p) return 'Velocity'
  return `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || 'Velocity'
})

async function onLogout() {
  await authStore.logout()
  router.push('/login')
}

const activeRoutes: RouteOrder[] = [
  {
    id: '1',
    status: 'transit',
    statusLabel: 'In Transit',
    trackingId: 'TRK-8842-A',
    eta: '14:30',
    address: { street: '4820 Winding Way', details: 'Apartment 4B, North Gate' },
  },
  {
    id: '2',
    status: 'priority',
    statusLabel: 'Priority Pickup',
    trackingId: 'PKP-1092-X',
    urgent: true,
    address: { street: 'Velocity Hub - Downtown', details: 'Bay 4, Loading Dock' },
  },
]
</script>

<template>
  <AppLayout :title="courierName" has-unread>
    <template #actions>
      <button
        class="flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-low hover:bg-error-container transition-colors"
        title="Вийти"
        @click="onLogout"
      >
        <span class="material-symbols-outlined text-on-surface-variant text-[20px]">logout</span>
      </button>
    </template>

    <div class="flex flex-col gap-10">
      <EarningsCard
        :amount="184"
        :cents="50"
        :goal="250"
        :completed-stops="12"
        :weekly-amount="840"
        :weekly-cents="20"
      />

      <section>
        <div class="flex justify-between items-baseline mb-6 px-1">
          <h3 class="font-headline text-xl font-extrabold tracking-tight text-on-surface">Active Routes</h3>
          <span
            class="font-label text-xs font-medium text-primary cursor-pointer hover:underline"
            @click="router.push('/map')"
          >View Map</span>
        </div>
        <div class="flex flex-col gap-6">
          <RouteOrderCard
            v-for="order in activeRoutes"
            :key="order.id"
            :order="order"
            @action="router.push('/orders/active')"
          />
        </div>
      </section>
    </div>
  </AppLayout>
</template>
