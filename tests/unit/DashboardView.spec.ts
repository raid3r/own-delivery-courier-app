import { reactive } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { API_ORDER_STATUS } from '@/constants/order-status-codes'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  getByCourier: vi.fn(),
  logout: vi.fn(),
  fetchProfile: vi.fn(),
}))

let mockAuthStore: {
  profile: any
  logout: ReturnType<typeof vi.fn>
  fetchProfile: ReturnType<typeof vi.fn>
}

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRouter: () => ({ push: mocks.push }),
  }
})

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => mockAuthStore,
}))

vi.mock('@/api/endpoints/orders.api', () => ({
  ordersApi: {
    getByCourier: mocks.getByCourier,
  },
}))

import type { OrderResponse } from '@/types/api'
import DashboardView from '@/views/dashboard/DashboardView.vue'

const AppLayoutStub = {
  name: 'AppLayout',
  props: ['title'],
  template: '<div><div data-test="layout-title">{{ title }}</div><slot name="actions" /><slot /></div>',
}

const AppButtonStub = {
  name: 'AppButton',
  emits: ['click'],
  template: '<button data-test="retry" @click="$emit(\'click\')"><slot /></button>',
}

const EarningsCardStub = {
  name: 'EarningsCard',
  props: ['amount', 'cents', 'goal', 'completedStops', 'weeklyAmount', 'weeklyCents'],
  template: `
    <div>
      <div data-test="earnings-amount">{{ amount }}</div>
      <div data-test="earnings-cents">{{ cents }}</div>
      <div data-test="earnings-goal">{{ goal }}</div>
      <div data-test="earnings-completed">{{ completedStops }}</div>
      <div data-test="earnings-weekly-amount">{{ weeklyAmount }}</div>
      <div data-test="earnings-weekly-cents">{{ weeklyCents }}</div>
    </div>
  `,
}

const RouteOrderCardStub = {
  name: 'RouteOrderCard',
  props: ['order'],
  emits: ['action'],
  template: '<button :data-test="`route-${order.id}`" @click="$emit(\'action\', order.id)">{{ order.statusLabel }}</button>',
}

function makeOrder(overrides: Partial<OrderResponse>): OrderResponse {
  return {
    id: 'order-1',
    orderNumber: 'ORD-1',
    status: API_ORDER_STATUS.DELIVERED,
    pickupAddress: { city: 'Pickup City', street: 'Pickup St', buildingNumber: '10', latitude: 0, longitude: 0 },
    deliveryAddress: { city: 'Delivery City', street: 'Delivery St', buildingNumber: '20', latitude: 0, longitude: 0 },
    weight: 1,
    dimensions: { width: 1, length: 1, height: 1 },
    cost: 10,
    paymentStatus: 1,
    createdAt: '2026-05-02T10:00:00Z',
    actualDeliveryTime: '2026-05-02T10:30:00Z',
    description: null,
    specialInstructions: null,
    ...overrides,
  }
}

function createWrapper() {
  return mount(DashboardView, {
    global: {
      stubs: {
        AppLayout: AppLayoutStub,
        AppButton: AppButtonStub,
        EarningsCard: EarningsCardStub,
        RouteOrderCard: RouteOrderCardStub,
      },
    },
  })
}

describe('DashboardView', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-02T12:00:00Z'))

    mocks.push.mockReset()
    mocks.getByCourier.mockReset()
    mocks.logout.mockReset()
    mocks.fetchProfile.mockReset()

    mockAuthStore = reactive({
      profile: null,
      logout: mocks.logout,
      fetchProfile: mocks.fetchProfile,
    })

    mocks.logout.mockResolvedValue(undefined)
    mocks.fetchProfile.mockImplementation(async () => {
      mockAuthStore.profile = {
        courierId: 'courier-1',
        email: 'courier@example.com',
        firstName: 'Alex',
        lastName: 'Rider',
        phoneNumber: null,
        createdAt: '2026-05-01T12:00:00Z',
        isActive: true,
      }
      return mockAuthStore.profile
    })
    mocks.getByCourier.mockResolvedValue({
      data: [
        makeOrder({ id: 'd1', status: API_ORDER_STATUS.DELIVERED, cost: 184.5, createdAt: '2026-05-02T08:00:00Z', actualDeliveryTime: '2026-05-02T09:00:00Z' }),
        makeOrder({ id: 'd2', status: API_ORDER_STATUS.DELIVERED, cost: 20.25, createdAt: '2026-04-30T08:00:00Z', actualDeliveryTime: '2026-04-30T09:00:00Z' }),
        makeOrder({ id: 'd3', status: API_ORDER_STATUS.DELIVERED, cost: 11, createdAt: '2026-04-20T08:00:00Z', actualDeliveryTime: '2026-04-20T09:00:00Z' }),
        makeOrder({ id: 'a1', status: API_ORDER_STATUS.ASSIGNED, orderNumber: 'PKP-11', actualDeliveryTime: null }),
        makeOrder({ id: 'a2', status: API_ORDER_STATUS.PICKED_UP, orderNumber: 'PKD-22', actualDeliveryTime: null }),
        makeOrder({ id: 'a3', status: API_ORDER_STATUS.IN_TRANSIT, orderNumber: 'TRN-33', actualDeliveryTime: null }),
      ],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads dashboard data and renders computed earnings and routes', async () => {
    const wrapper = createWrapper()
    await flushPromises()

    expect(mocks.fetchProfile).toHaveBeenCalledTimes(1)
    expect(mocks.getByCourier).toHaveBeenCalledTimes(1)
    expect(mocks.getByCourier).toHaveBeenCalledWith('courier-1', { skip: 0, take: 100 })
    expect(wrapper.get('[data-test="earnings-amount"]').text()).toBe('184')
    expect(wrapper.get('[data-test="earnings-cents"]').text()).toBe('50')
    expect(wrapper.get('[data-test="earnings-goal"]').text()).toBe('250')
    expect(wrapper.get('[data-test="earnings-completed"]').text()).toBe('1')
    expect(wrapper.get('[data-test="earnings-weekly-amount"]').text()).toBe('204')
    expect(wrapper.get('[data-test="earnings-weekly-cents"]').text()).toBe('75')
    expect(wrapper.findAll('[data-test^="route-"]')).toHaveLength(3)
  })

  it('shows error when dashboard request fails', async () => {
    mocks.getByCourier.mockRejectedValueOnce(new Error('network'))

    const wrapper = createWrapper()
    await flushPromises()

    expect(wrapper.text()).toContain('Failed to load dashboard data. Please try again.')
  })

  it('retries loading after error', async () => {
    mocks.getByCourier
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({
        data: [makeOrder({ id: 'a4', status: API_ORDER_STATUS.IN_TRANSIT, orderNumber: 'TRN-44' })],
      })

    const wrapper = createWrapper()
    await flushPromises()

    await wrapper.get('[data-test="retry"]').trigger('click')
    await flushPromises()

    expect(mocks.getByCourier).toHaveBeenCalledTimes(2)
    expect(wrapper.findAll('[data-test^="route-"]')).toHaveLength(1)
  })

  it('opens order details when route action is triggered', async () => {
    const wrapper = createWrapper()
    await flushPromises()

    await wrapper.get('[data-test="route-a1"]').trigger('click')

    expect(mocks.push).toHaveBeenCalledWith('/orders/a1')
  })

  it('logs out and redirects to login', async () => {
    const wrapper = createWrapper()
    await flushPromises()

    await wrapper.get('button[title="Вийти"]').trigger('click')
    await flushPromises()

    expect(mocks.logout).toHaveBeenCalledTimes(1)
    expect(mocks.push).toHaveBeenCalledWith('/login')
  })
})

