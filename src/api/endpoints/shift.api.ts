import { apiClient } from '../client'
export const shiftApi = {
  start: () => apiClient.post('/shifts/start'),
  end: () => apiClient.post('/shifts/end'),
  current: () => apiClient.get('/shifts/current'),
}
