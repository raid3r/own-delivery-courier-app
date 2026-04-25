import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CourierProfileResponse } from '@/types/api'
import { authApi } from '@/api/endpoints/auth.api'
import { couriersApi } from '@/api/endpoints/couriers.api'
import type { LoginCourierRequest, RegisterCourierRequest } from '@/types/api'

export const useAuthStore = defineStore('auth', () => {
  const profile = ref<CourierProfileResponse | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const isAuthenticated = computed(() => !!token.value)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  function setToken(t: string) {
    token.value = t
    localStorage.setItem('token', t)
  }

  function clearError() {
    error.value = null
  }

  async function login(credentials: LoginCourierRequest) {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await authApi.login(credentials)
      setToken(data.token!)
      profile.value = {
        courierId: data.courierId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: null,
        createdAt: data.expiresAt,
        isActive: true,
      }
      return true
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401) {
        error.value = 'Невірний email або пароль'
      } else if (err?.response?.data?.detail) {
        error.value = err.response.data.detail
      } else {
        error.value = 'Помилка підключення до сервера'
      }
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function register(data: RegisterCourierRequest) {
    isLoading.value = true
    error.value = null
    try {
      const { data: res } = await authApi.register(data)
      setToken(res.token!)
      profile.value = {
        courierId: res.courierId,
        email: res.email,
        firstName: res.firstName,
        lastName: res.lastName,
        phoneNumber: data.phoneNumber,
        createdAt: res.expiresAt,
        isActive: true,
      }
      return true
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 409) {
        error.value = 'Акаунт з таким email вже існує'
      } else if (err?.response?.data?.detail) {
        error.value = err.response.data.detail
      } else {
        error.value = 'Помилка реєстрації. Спробуйте ще раз'
      }
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function fetchProfile() {
    try {
      const { data } = await couriersApi.getMe()
      profile.value = data
    } catch {
      // ignore
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      // ignore
    } finally {
      profile.value = null
      token.value = null
      localStorage.removeItem('token')
    }
  }

  return {
    profile,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    fetchProfile,
    setToken,
    clearError,
  }
})
