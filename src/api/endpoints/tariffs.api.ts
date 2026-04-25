import { apiClient } from '../client'
import type {
  TariffResponse,
  CreateTariffRequest,
  UpdateTariffRequest,
} from '@/types/api'
import type { AxiosResponse } from 'axios'

export const tariffsApi = {
  /** GET /api/v1/tariffs — Список усіх тарифів */
  getAll: (): Promise<AxiosResponse<TariffResponse[]>> =>
    apiClient.get('/api/v1/tariffs'),

  /** POST /api/v1/tariffs — Створити тариф */
  create: (data: CreateTariffRequest): Promise<AxiosResponse<TariffResponse>> =>
    apiClient.post('/api/v1/tariffs', data),

  /** GET /api/v1/tariffs/default — Тариф за замовчуванням */
  getDefault: (): Promise<AxiosResponse<TariffResponse>> =>
    apiClient.get('/api/v1/tariffs/default'),

  /** GET /api/v1/tariffs/:id — Тариф за ID */
  getById: (id: string): Promise<AxiosResponse<TariffResponse>> =>
    apiClient.get(`/api/v1/tariffs/${id}`),

  /** PUT /api/v1/tariffs/:id — Оновити тариф */
  update: (id: string, data: UpdateTariffRequest): Promise<AxiosResponse<TariffResponse>> =>
    apiClient.put(`/api/v1/tariffs/${id}`, data),

  /** DELETE /api/v1/tariffs/:id — Видалити тариф */
  remove: (id: string): Promise<AxiosResponse<void>> =>
    apiClient.delete(`/api/v1/tariffs/${id}`),

  /** GET /api/v1/tariffs/name/:name — Пошук тарифу за назвою */
  getByName: (name: string): Promise<AxiosResponse<TariffResponse>> =>
    apiClient.get(`/api/v1/tariffs/name/${encodeURIComponent(name)}`),
}

