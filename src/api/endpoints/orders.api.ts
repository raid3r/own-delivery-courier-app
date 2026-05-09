import { apiClient } from '../client'
import type {
  OrderResponse,
  CreateOrderRequest,
  OrderStatusUpdateRequest,
  CancelOrderRequest,
  RateOrderRequest,
  PagedResponse,
} from '@/types/api'
import type { AxiosResponse } from 'axios'

interface OrdersQueryParams {
  skip?: number
  take?: number
}

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
  getMyOrders: (params?: OrdersQueryParams): Promise<AxiosResponse<OrderResponse[]>> =>
    apiClient.get('/api/v1/orders/my-orders', { params }),

  /** GET /api/v1/orders/available — Доступні незайняті замовлення */
  getAvailable: (params?: OrdersQueryParams): Promise<AxiosResponse<PagedResponse<OrderResponse>>> =>
    apiClient.get('/api/v1/orders/available', { params }),

  /** POST /api/v1/orders/:id/accept — Прийняти доступне замовлення */
  acceptOrder: (id: string): Promise<AxiosResponse<OrderResponse>> =>
    apiClient.post(`/api/v1/orders/${id}/accept`),

  /** GET /api/v1/orders/courier/:courierId — Замовлення конкретного кур'єра */
  getByCourier: (courierId: string, params?: OrdersQueryParams): Promise<AxiosResponse<PagedResponse<OrderResponse>>> =>
    apiClient.get(`/api/v1/orders/courier/${courierId}`, { params }),

  /** PUT /api/v1/orders/:id/status — Оновити статус замовлення */
  updateStatus: (
    id: string,
    data: OrderStatusUpdateRequest,
  ): Promise<AxiosResponse<OrderResponse>> =>
    apiClient.patch(`/api/v1/orders/${id}/status`, data),

  /** POST /api/v1/orders/:id/cancel — Скасувати замовлення */
  cancel: (id: string, data?: CancelOrderRequest): Promise<AxiosResponse<void>> =>
    apiClient.post(`/api/v1/orders/${id}/cancel`, data),

  /** POST /api/v1/orders/:id/rate — Оцінити замовлення */
  rate: (id: string, data: RateOrderRequest): Promise<AxiosResponse<void>> =>
    apiClient.post(`/api/v1/orders/${id}/rate`, data),
}
