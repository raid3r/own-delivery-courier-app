import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Location } from '@/types/location'
export const useLocationStore = defineStore('location', () => {
  const current = ref<Location | null>(null)
  const watching = ref(false)
  return { current, watching }
})
