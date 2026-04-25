import { defineStore } from 'pinia'
import { ref } from 'vue'
export const useUiStore = defineStore('ui', () => {
  const loading = ref(false)
  const toast = ref<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    toast.value = { message, type }
    setTimeout(() => { toast.value = null }, 3000)
  }
  return { loading, toast, showToast }
})
