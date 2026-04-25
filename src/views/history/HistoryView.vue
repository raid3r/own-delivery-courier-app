<script setup lang="ts">
import AppLayout from '@/components/layout/AppLayout.vue'
import HistoryItem from '@/components/history/HistoryItem.vue'

const groups = [
  {
    date: 'Today',
    items: [
      { id: '1', date: 'Today', time: '14:22', address: 'Salesforce Tower, 415 Mission St', payout: 24, payoutCents: 50, status: 'delivered' as const, durationMinutes: 42 },
      { id: '2', date: 'Today', time: '11:08', address: 'WeWork, 25 Taylor St', payout: 18, status: 'delivered' as const, durationMinutes: 28 },
    ],
  },
  {
    date: 'Yesterday',
    items: [
      { id: '3', date: 'Yesterday', time: '17:45', address: 'Union Square, Powell St', payout: 32, payoutCents: 0, status: 'delivered' as const, durationMinutes: 55 },
      { id: '4', date: 'Yesterday', time: '14:30', address: 'Mission District, 16th St', payout: 12, status: 'cancelled' as const },
    ],
  },
]

// Weekly summary
</script>

<template>
  <AppLayout title="History">
    <div class="flex flex-col gap-8">
      <!-- Weekly summary card -->
      <div class="bg-surface-container-low rounded-3xl p-6 flex justify-between items-center">
        <div>
          <p class="font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">This Week</p>
          <p class="font-headline text-4xl font-extrabold tracking-tighter text-on-surface">
            $840<span class="text-xl text-on-surface-variant font-bold">.20</span>
          </p>
        </div>
        <div class="text-right">
          <p class="font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">Deliveries</p>
          <p class="font-headline text-4xl font-extrabold tracking-tighter text-on-surface">24</p>
        </div>
      </div>

      <!-- Grouped history -->
      <div v-for="group in groups" :key="group.date" class="flex flex-col gap-3">
        <h3 class="font-headline text-base font-bold text-on-surface px-1">{{ group.date }}</h3>
        <div class="flex flex-col gap-3">
          <HistoryItem
            v-for="item in group.items"
            :key="item.id"
            :item="item"
          />
        </div>
      </div>
    </div>
  </AppLayout>
</template>



