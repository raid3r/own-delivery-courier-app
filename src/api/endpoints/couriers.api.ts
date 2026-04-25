import { apiClient } from '../client'
import type { CourierProfileResponse } from '@/types/api'
import type { AxiosResponse } from 'axios'

export const couriersApi = {
  /** GET /api/v1/couriers/me — Профіль поточного кур'єра */
  getMe: (): Promise<AxiosResponse<CourierProfileResponse>> =>
    apiClient.get('/api/v1/couriers/me'),

  /** GET /api/v1/couriers/:id — Профіль кур'єра за ID */
  getById: (id: string): Promise<AxiosResponse<CourierProfileResponse>> =>
    apiClient.get(`/api/v1/couriers/${id}`),
}

