import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'vue-router'
import type { LoginCourierRequest, RegisterCourierRequest } from '@/types/api'

export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()

  async function login(credentials: LoginCourierRequest) {
    const ok = await authStore.login(credentials)
    if (ok) {
      await router.push('/dashboard')
    }
    return ok
  }

  async function register(data: RegisterCourierRequest) {
    const ok = await authStore.register(data)
    if (ok) {
      await router.push('/dashboard')
    }
    return ok
  }

  async function logout() {
    await authStore.logout()
    await router.push('/login')
  }

  return {
    login,
    register,
    logout,
    isLoading: authStore.isLoading,
    error: authStore.error,
    clearError: authStore.clearError,
    profile: authStore.profile,
    isAuthenticated: authStore.isAuthenticated,
  }
}
