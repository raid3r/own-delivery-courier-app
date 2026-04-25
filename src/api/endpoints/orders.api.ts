import { apiClient } from '../client'
import type {
  OrderResponse,
  CreateOrderRequest,
  OrderStatusUpdateRequest,
  CancelOrderRequest,
  RateOrderRequest,
} from '@/types/api'
import type { AxiosResponse } from 'axios'

export const ordersApi = {
  /** GET /api/v1/orders — Список усіх замовлень (адмін) */
  getAll: (): Promise<AxiosResponse<OrderResponse[]>> =>
    apiClient.get('/api/v1/orders'),

  /** POST /api/v1/orders — Створення нового замовлення */
  create: (data: CreateOrderRequest): Promise<AxiosResponse<OrderResponse>> =>
    apiClient.post('/api/v1/orders', data),

  /** GET /api/v1/orders/:id — Деталі замовлення за ID */
  getById: (id: string): Promise<AxiosResponse<OrderResponse>> =>
    apiClient.get(`/api/v1/orders/${id}`),

  /** GET /api/v1/orders/number/:orderNumber — Пошук за номером замовлення */
  getByNumber: (orderNumber: string): Promise<AxiosResponse<OrderResponse>> =>
    apiClient.get(`/api/v1/orders/number/${orderNumber}`),

  /** GET /api/v1/orders/my-orders — Мої замовлення (поточного користувача) */
  getMyOrders: (): Promise<AxiosResponse<OrderResponse[]>> =>
    apiClient.get('/api/v1/orders/my-orders'),

  /** GET /api/v1/orders/courier/:courierId — Замовлення конкретного кур'єра */
  getByCourier: (courierId: string): Promise<AxiosResponse<OrderResponse[]>> =>
    apiClient.get(`/api/v1/orders/courier/${courierId}`),

  /** PUT /api/v1/orders/:id/status — Оновити статус замовлення */
  updateStatus: (
    id: string,
    data: OrderStatusUpdateRequest,
  ): Promise<AxiosResponse<OrderResponse>> =>
    apiClient.put(`/api/v1/orders/${id}/status`, data),

  /** POST /api/v1/orders/:id/cancel — Скасувати замовлення */
  cancel: (id: string, data?: CancelOrderRequest): Promise<AxiosResponse<void>> =>
    apiClient.post(`/api/v1/orders/${id}/cancel`, data),

  /** POST /api/v1/orders/:id/rate — Оцінити замовлення */
  rate: (id: string, data: RateOrderRequest): Promise<AxiosResponse<void>> =>
    apiClient.post(`/api/v1/orders/${id}/rate`, data),
}
