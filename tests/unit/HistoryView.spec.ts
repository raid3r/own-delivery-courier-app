import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { API_ORDER_STATUS } from '@/constants/order-status-codes'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  getByCourier: vi.fn(),
  fetchProfile: vi.fn(),
}))

let mockAuthStore: {
  profile: any
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
import HistoryView from '@/views/history/HistoryView.vue'

const AppLayoutStub = {
  name: 'AppLayout',
  template: '<div><slot /></div>',
}

const AppButtonStub = {
  name: 'AppButton',
  emits: ['click'],
  template: '<button data-test="retry" @click="$emit(\'click\')"><slot /></button>',
}

const HistoryItemStub = {
  name: 'HistoryItem',
  props: ['item'],
  emits: ['select'],
  template: '<button :data-test="`history-item-${item.id}`" @click="$emit(\'select\', item.id)">{{ item.id }}</button>',
}

function makeOrder(overrides: Partial<OrderResponse>): OrderResponse {
  return {
    id: 'order-1',
    orderNumber: 'ORD-1',
    status: API_ORDER_STATUS.DELIVERED,
    pickupAddress: { latitude: 0, longitude: 0 },
    deliveryAddress: { city: 'City', street: 'Street', buildingNumber: '1', latitude: 0, longitude: 0 },
    weight: 1,
    dimensions: { width: 1, length: 1, height: 1 },
    cost: 10,
    paymentStatus: 1,
    createdAt: '2026-04-24T10:00:00Z',
    actualDeliveryTime: '2026-04-24T10:30:00Z',
    description: null,
    specialInstructions: null,
    ...overrides,
  }
}

function createWrapper() {
  return mount(HistoryView, {
    global: {
      stubs: {
        AppLayout: AppLayoutStub,
        AppButton: AppButtonStub,
        HistoryItem: HistoryItemStub,
      },
    },
  })
}

describe('HistoryView', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-25T12:00:00Z'))

    mocks.push.mockReset()
    mocks.getByCourier.mockReset()
    mocks.fetchProfile.mockReset()

    mockAuthStore = {
      profile: null,
      fetchProfile: mocks.fetchProfile,
    }

    mocks.fetchProfile.mockImplementation(async () => {
      mockAuthStore.profile = {
        courierId: 'courier-1',
        email: 'courier@example.com',
        firstName: 'Alex',
        lastName: 'Rider',
        phoneNumber: null,
        createdAt: '2026-04-01T12:00:00Z',
        isActive: true,
      }
      return mockAuthStore.profile
    })

    mocks.getByCourier.mockResolvedValue({
      data: {
        items: [
          makeOrder({ id: 'd1', status: API_ORDER_STATUS.DELIVERED, cost: 24.5, createdAt: '2026-04-24T14:00:00Z' }),
          makeOrder({ id: 'c1', status: API_ORDER_STATUS.CANCELLED, cost: 12, createdAt: '2026-04-24T13:00:00Z', actualDeliveryTime: null }),
          makeOrder({ id: 'r1', status: API_ORDER_STATUS.FAILED, cost: 15, createdAt: '2026-04-10T13:00:00Z', actualDeliveryTime: null }),
          makeOrder({ id: 'a1', status: API_ORDER_STATUS.ASSIGNED, cost: 99, createdAt: '2026-04-24T12:00:00Z', actualDeliveryTime: null }),
        ],
        total: 4,
        skip: 0,
        take: 100,
        hasMore: false,
      },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads and renders history with backend data', async () => {
    const wrapper = createWrapper()
    await flushPromises()

    expect(mocks.fetchProfile).toHaveBeenCalledTimes(1)
    expect(mocks.getByCourier).toHaveBeenCalledTimes(1)
    expect(mocks.getByCourier).toHaveBeenCalledWith('courier-1', { skip: 0, take: 100 })
    expect(wrapper.findAll('[data-test^="history-item-"]')).toHaveLength(3)
    expect(wrapper.get('[data-test="week-amount"]').text()).toBe('$24')
    expect(wrapper.get('[data-test="week-cents"]').text()).toBe('.50')
    expect(wrapper.get('[data-test="week-deliveries"]').text()).toBe('1')
  })

  it('shows error state when request fails', async () => {
    mocks.getByCourier.mockRejectedValueOnce(new Error('network'))

    const wrapper = createWrapper()
    await flushPromises()

    expect(wrapper.text()).toContain('Failed to load delivery history. Please try again.')
  })

  it('shows empty state when there are no completed deliveries', async () => {
    mocks.getByCourier.mockResolvedValueOnce({
      data: [
        makeOrder({ id: 'a2', status: API_ORDER_STATUS.ASSIGNED }),
        makeOrder({ id: 'a3', status: API_ORDER_STATUS.PICKED_UP }),
      ],
    })

    const wrapper = createWrapper()
    await flushPromises()

    expect(wrapper.findAll('[data-test^="history-item-"]')).toHaveLength(0)
    expect(wrapper.text()).toContain('No completed deliveries yet.')
  })

  it('retries loading after error', async () => {
    mocks.getByCourier
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({
        data: [makeOrder({ id: 'd2', status: API_ORDER_STATUS.DELIVERED, cost: 18, createdAt: '2026-04-24T15:00:00Z' })],
      })

    const wrapper = createWrapper()
    await flushPromises()

    await wrapper.get('[data-test="retry"]').trigger('click')
    await flushPromises()

    expect(mocks.getByCourier).toHaveBeenCalledTimes(2)
    expect(wrapper.findAll('[data-test^="history-item-"]')).toHaveLength(1)
  })

  it('opens order details page when selecting item', async () => {
    const wrapper = createWrapper()
    await flushPromises()

    await wrapper.get('[data-test="history-item-d1"]').trigger('click')

    expect(mocks.push).toHaveBeenCalledWith('/orders/d1')
  })
})

