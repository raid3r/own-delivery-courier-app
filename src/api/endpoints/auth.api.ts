import { apiClient } from '../client'
import type {
  RegisterCourierRequest,
  LoginCourierRequest,
  AuthResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
} from '@/types/api'
import type { AxiosResponse } from 'axios'

export const authApi = {
  /** POST /api/v1/auth/register — Реєстрація кур'єра */
  register: (data: RegisterCourierRequest): Promise<AxiosResponse<AuthResponse>> =>
    apiClient.post('/api/v1/auth/register', data),

  /** POST /api/v1/auth/login — Вхід кур'єра */
  login: (data: LoginCourierRequest): Promise<AxiosResponse<AuthResponse>> =>
    apiClient.post('/api/v1/auth/login', data),

  /** POST /api/v1/auth/logout — Вихід */
  logout: (): Promise<AxiosResponse<void>> =>
    apiClient.post('/api/v1/auth/logout'),

  /** POST /api/v1/auth/refresh — Оновлення токену */
  refresh: (data: RefreshTokenRequest): Promise<AxiosResponse<RefreshTokenResponse>> =>
    apiClient.post('/api/v1/auth/refresh', data),

  /** GET /api/v1/auth/verify-email — Підтвердження email */
  verifyEmail: (token: string): Promise<AxiosResponse<void>> =>
    apiClient.get('/api/v1/auth/verify-email', { params: { token } }),

  /** POST /api/v1/auth/forgot-password — Запит скидання пароля */
  forgotPassword: (data: ForgotPasswordRequest): Promise<AxiosResponse<void>> =>
    apiClient.post('/api/v1/auth/forgot-password', data),

  /** POST /api/v1/auth/reset-password — Скидання пароля */
  resetPassword: (data: ResetPasswordRequest): Promise<AxiosResponse<void>> =>
    apiClient.post('/api/v1/auth/reset-password', data),

  /** POST /api/v1/auth/change-password — Зміна пароля */
  changePassword: (data: ChangePasswordRequest): Promise<AxiosResponse<void>> =>
    apiClient.post('/api/v1/auth/change-password', data),
}
