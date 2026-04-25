import { apiClient } from './client'
import { useAuthStore } from '@/stores/auth.store'

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      // Avoid infinite loop for auth endpoints themselves
      const isAuthEndpoint = err.config?.url?.includes('/api/v1/auth/')
      if (!isAuthEndpoint) {
        try {
          const authStore = useAuthStore()
          await authStore.logout()
        } catch {
          localStorage.removeItem('token')
        }
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  },
)
