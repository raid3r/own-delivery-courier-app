<script setup lang="ts">
import AppLayout from '@/components/layout/AppLayout.vue'
import OrderCard from '@/components/orders/OrderCard.vue'
import FilterChips from '@/components/orders/FilterChips.vue'
import type { AvailableOrder } from '@/components/orders/OrderCard.vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const activeFilter = ref('filters')

const filterChips = [
  { id: 'filters', label: 'Filters', icon: 'tune' },
  { id: 'payout', label: 'Highest Payout', icon: 'attach_money' },
  { id: 'distance', label: 'Shortest Distance', icon: 'directions_car' },
]

const orders: AvailableOrder[] = [
  {
    id: '1',
    type: 'Express',
    payout: 24,
    payoutCents: 50,
    estimatedMinutes: 45,
    distanceMiles: 3.2,
    stops: [
      { type: 'pickup', name: 'Blue Bottle Coffee', address: '115 Sansome St' },
      { type: 'dropoff', name: 'Salesforce Tower', address: '415 Mission St, Fl 32' },
    ],
  },
  {
    id: '2',
    type: 'Standard',
    payout: 18,
    estimatedMinutes: 30,
    distanceMiles: 1.8,
    stops: [
      { type: 'pickup', name: 'Sweetgreen', address: '171 2nd St' },
      { type: 'dropoff', name: 'WeWork', address: '25 Taylor St' },
    ],
  },
]

function acceptOrder(_id: string) {
  router.push(`/orders/active`)
}
</script>

<template>
  <AppLayout title="Velocity">
    <template #default>
      <div class="mb-8">
        <h1 class="font-headline font-extrabold text-4xl tracking-tight text-on-surface mb-2">Available Orders</h1>
        <p class="font-body text-sm text-on-surface-variant mb-6">Showing {{ orders.length }} nearby deliveries</p>
        <FilterChips
          :chips="filterChips"
          :active="activeFilter"
          @select="activeFilter = $event"
        />
      </div>

      <div class="space-y-6">
        <OrderCard
          v-for="order in orders"
          :key="order.id"
          :order="order"
          @accept="acceptOrder"
        />
      </div>
    </template>
  </AppLayout>
</template>
