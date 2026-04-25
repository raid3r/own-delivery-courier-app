import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Shift } from '@/types/shift'
export const useShiftStore = defineStore('shift', () => {
  const activeShift = ref<Shift | null>(null)
  const isOnShift = ref(false)
  return { activeShift, isOnShift }
})
