import type { ApiOrderStatus } from '@/constants/order-status-codes'

// ─── Shared DTOs ─────────────────────────────────────────────────────────────

export interface AddressDto {
  city?: string | null
  street?: string | null
  buildingNumber?: string | null
  postalCode?: string | null
  latitude: number
  longitude: number
  apartmentNumber?: string | null
  description?: string | null
}

export interface DimensionsDto {
  width: number
  length: number
  height: number
}

export interface LocationDto {
  latitude: number
  longitude: number
  accuracy?: number | null
  altitude?: number | null
  speed?: number | null
}

// ─── Enums ───────────────────────────────────────────────────────────────────

/** API_ORDER_STATUS: Pending, Assigned, PickedUp, InTransit, Delivered, Cancelled, Failed */
export type OrderStatus = ApiOrderStatus

/** 0=Cash, 1=Card, 2=Online, 3=Invoice, 4=Other */
export type PaymentMethod = 0 | 1 | 2 | 3 | 4

/** 0=Pending, 1=Paid, 2=Failed, 3=Refunded, 4=Cancelled */
export type PaymentStatus = 0 | 1 | 2 | 3 | 4

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface RegisterCourierRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  phoneNumber: string
  licenseNumber?: string | null
}

export interface LoginCourierRequest {
  email: string
  password: string
}

export interface AuthResponse {
  userId: string
  courierId: string
  email: string | null
  firstName: string | null
  lastName: string | null
  token: string | null
  expiresAt: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  accessToken: string | null
  refreshToken: string | null
  expiresAt: string
  tokenType: string | null
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
  confirmPassword: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// ─── Couriers ─────────────────────────────────────────────────────────────────

export interface CourierProfileResponse {
  courierId: string
  email: string | null
  firstName: string | null
  lastName: string | null
  phoneNumber: string | null
  createdAt: string
  isActive: boolean
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface CreateOrderRequest {
  pickupAddress: AddressDto
  deliveryAddress: AddressDto
  weight: number
  dimensions: DimensionsDto
  tariffId: string
  description?: string | null
  specialInstructions?: string | null
  scheduledDeliveryTime?: string | null
  paymentMethod: PaymentMethod
}

export interface OrderResponse {
  id: string
  orderNumber: string | null
  status: OrderStatus
  pickupAddress: AddressDto
  deliveryAddress: AddressDto
  weight: number
  dimensions: DimensionsDto
  cost: number
  paymentStatus: PaymentStatus
  createdAt: string
  actualDeliveryTime: string | null
  description: string | null
  specialInstructions: string | null
}

export interface PagedResponse<T> {
  items: T[]
  total: number
  skip: number
  take: number
  hasMore: boolean
}

export interface OrderStatusUpdateRequest {
  newStatus: OrderStatus
  reason?: string | null
  location?: LocationDto | null
}

export interface CancelOrderRequest {
  reason?: string | null
}

export interface RateOrderRequest {
  score: number
  comment?: string | null
}

// ─── Tariffs ──────────────────────────────────────────────────────────────────

export interface TariffResponse {
  id: string
  name: string | null
  baseCost: number
  pricePerKm: number
  pricePerKg: number
  estimatedDeliveryTime: number
  maxWeight: number
  maxDimensions: DimensionsDto
  isActive: boolean
  description: string | null
}

export interface CreateTariffRequest {
  name: string
  baseCost: number
  pricePerKm: number
  pricePerKg: number
  estimatedDeliveryTime: number
  maxWeight: number
  maxDimensions: DimensionsDto
  description?: string | null
}

export interface UpdateTariffRequest {
  name?: string | null
  baseCost?: number | null
  pricePerKm?: number | null
  pricePerKg?: number | null
  estimatedDeliveryTime?: number | null
  maxWeight?: number | null
  maxDimensions?: DimensionsDto
  description?: string | null
  isActive?: boolean | null
}
