import { reactive } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { API_ORDER_STATUS } from '@/constants/order-status-codes'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  back: vi.fn(),
  getById: vi.fn(),
  getByCourier: vi.fn(),
  updateStatus: vi.fn(),
  fetchProfile: vi.fn(),
}))

const routeState = reactive({
  query: { id: 'order-1' as string | undefined },
})

let mockAuthStore: {
  profile: any
  fetchProfile: ReturnType<typeof vi.fn>
}

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRoute: () => routeState,
    useRouter: () => ({ push: mocks.push, back: mocks.back }),
  }
})

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => mockAuthStore,
}))

vi.mock('@/api/endpoints/orders.api', () => ({
  ordersApi: {
    getById: mocks.getById,
    getByCourier: mocks.getByCourier,
    updateStatus: mocks.updateStatus,
  },
}))

import type { OrderResponse } from '@/types/api'
import ActiveOrderView from '@/views/orders/ActiveOrderView.vue'

const MapSectionStub = {
  name: 'MapSection',
  props: ['status'],
  emits: ['back'],
  template: '<div data-test="map-status">{{ status }}</div>',
}

const DeliveryDetailsStub = {
  name: 'DeliveryDetails',
  props: ['trackingId', 'eta', 'recipientName', 'recipientAddress', 'instructions', 'actionLabel'],
  emits: ['confirm', 'call'],
  template: `
    <div>
      <div data-test="delivery-tracking">{{ trackingId }}</div>
      <div data-test="delivery-recipient">{{ recipientName }}</div>
      <div data-test="delivery-address">{{ recipientAddress }}</div>
      <button data-test="confirm" @click="$emit('confirm')">{{ actionLabel }}</button>
    </div>
  `,
}

const PageLoadStateStub = {
  name: 'PageLoadState',
  props: ['errorText', 'isLoading'],
  emits: ['retry'],
  template: `
    <div>
      <div v-if="errorText">{{ errorText }}</div>
      <div v-else-if="isLoading">Loading...</div>
      <button v-if="errorText" data-test="retry" @click="$emit('retry')">Retry</button>
    </div>
  `,
}

function makeOrder(overrides: Partial<OrderResponse>): OrderResponse {
  return {
    id: 'order-1',
    orderNumber: 'ORD-1',
    status: API_ORDER_STATUS.IN_TRANSIT,
    pickupAddress: { city: 'Kyiv', street: 'Pickup', buildingNumber: '1', latitude: 50.45, longitude: 30.52 },
    deliveryAddress: { city: 'Kyiv', street: 'Dropoff', buildingNumber: '2', latitude: 50.46, longitude: 30.53 },
    weight: 1,
    dimensions: { width: 10, length: 20, height: 30 },
    cost: 18,
    paymentStatus: 1,
    createdAt: '2026-05-02T10:00:00Z',
    actualDeliveryTime: null,
    description: 'John Smith',
    specialInstructions: 'Leave at door',
    ...overrides,
  }
}

function createWrapper() {
  return mount(ActiveOrderView, {
    global: {
      stubs: {
        MapSection: MapSectionStub,
        DeliveryDetails: DeliveryDetailsStub,
        PageLoadState: PageLoadStateStub,
      },
    },
  })
}

describe('ActiveOrderView', () => {
  beforeEach(() => {
    routeState.query.id = 'order-1'
    mocks.push.mockReset()
    mocks.back.mockReset()
    mocks.getById.mockReset()
    mocks.getByCourier.mockReset()
    mocks.updateStatus.mockReset()
    mocks.fetchProfile.mockReset()

    mockAuthStore = {
      profile: null,
      fetchProfile: mocks.fetchProfile,
    }

    mocks.fetchProfile.mockImplementation(async () => {
      mockAuthStore.profile = { courierId: 'courier-1' }
      return mockAuthStore.profile
    })

    mocks.getById.mockResolvedValue({ data: makeOrder({}) })
    mocks.updateStatus.mockResolvedValue({
      data: makeOrder({ status: API_ORDER_STATUS.DELIVERED }),
    })
    mocks.getByCourier.mockResolvedValue({ data: [] })
  })

  it('loads active order by query id and renders real API data', async () => {
    const wrapper = createWrapper()
    await flushPromises()

    expect(mocks.getById).toHaveBeenCalledWith('order-1')
    expect(wrapper.get('[data-test="map-status"]').text()).toBe('In Transit')
    expect(wrapper.get('[data-test="delivery-tracking"]').text()).toBe('ORD-1')
    expect(wrapper.get('[data-test="delivery-recipient"]').text()).toBe('John Smith')
  })

  it('updates status through API and redirects to order details when flow completes', async () => {
    const wrapper = createWrapper()
    await flushPromises()

    await wrapper.get('[data-test="confirm"]').trigger('click')
    await flushPromises()

    expect(mocks.updateStatus).toHaveBeenCalledWith('order-1', { newStatus: API_ORDER_STATUS.DELIVERED })
    expect(mocks.push).toHaveBeenCalledWith('/orders/order-1')
  })

  it('shows empty state when there is no active order', async () => {
    routeState.query.id = undefined
    mocks.getByCourier.mockResolvedValueOnce({
      data: [makeOrder({ id: 'done', status: API_ORDER_STATUS.DELIVERED })],
    })

    const wrapper = createWrapper()
    await flushPromises()

    expect(mocks.fetchProfile).toHaveBeenCalled()
    expect(wrapper.text()).toContain('You do not have an active delivery right now.')

    await wrapper.get('[data-test="back-to-orders"]').trigger('click')
    expect(mocks.push).toHaveBeenCalledWith('/orders')
  })

  it('shows error state when active order request fails', async () => {
    mocks.getById.mockRejectedValueOnce(new Error('network'))

    const wrapper = createWrapper()
    await flushPromises()

    expect(wrapper.text()).toContain('Failed to load active order. Please try again.')
  })
})

