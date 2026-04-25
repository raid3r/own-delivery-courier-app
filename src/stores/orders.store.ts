import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Order } from '@/types/order'
export const useOrdersStore = defineStore('orders', () => {
  const orders = ref<Order[]>([])
  const activeOrder = ref<Order | null>(null)
  const loading = ref(false)
  return { orders, activeOrder, loading }
})
