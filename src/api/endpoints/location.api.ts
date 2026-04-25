import { apiClient } from '../client'
import type { LocationDto } from '@/types/api'
import type { AxiosResponse } from 'axios'

export const locationApi = {
  /** POST /api/v1/couriers/location — Оновити геолокацію кур'єра */
  updateLocation: (location: LocationDto): Promise<AxiosResponse<void>> =>
    apiClient.post('/api/v1/couriers/location', location),
}
