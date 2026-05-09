import { reactive } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { API_ORDER_STATUS } from '@/constants/order-status-codes'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  back: vi.fn(),
  getById: vi.fn(),
}))

const routeState = reactive({
  params: { id: 'order-1' },
})

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRoute: () => routeState,
    useRouter: () => ({ push: mocks.push, back: mocks.back }),
  }
})

vi.mock('@/api/endpoints/orders.api', () => ({
  ordersApi: {
    getById: mocks.getById,
  },
}))

import type { OrderResponse } from '@/types/api'
import OrderDetailView from '@/views/orders/OrderDetailView.vue'

const AppLayoutStub = {
  name: 'AppLayout',
  props: ['title'],
  template: '<div><div data-test="layout-title">{{ title }}</div><slot name="actions" /><slot /></div>',
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
    orderNumber: 'ORD-42',
    status: API_ORDER_STATUS.IN_TRANSIT,
    pickupAddress: { city: 'Kyiv', street: 'Pickup', buildingNumber: '1', latitude: 50.45, longitude: 30.52 },
    deliveryAddress: { city: 'Kyiv', street: 'Delivery', buildingNumber: '2', latitude: 50.46, longitude: 30.53 },
    weight: 2,
    dimensions: { width: 10, length: 20, height: 30 },
    cost: 24.5,
    paymentStatus: 1,
    createdAt: '2026-05-02T10:00:00Z',
    actualDeliveryTime: null,
    description: 'Gift box',
    specialInstructions: 'Call on arrival',
    ...overrides,
  }
}

function createWrapper() {
  return mount(OrderDetailView, {
    global: {
      stubs: {
        AppLayout: AppLayoutStub,
        PageLoadState: PageLoadStateStub,
      },
    },
  })
}

describe('OrderDetailView', () => {
  beforeEach(() => {
    routeState.params.id = 'order-1'
    mocks.push.mockReset()
    mocks.back.mockReset()
    mocks.getById.mockReset()
    mocks.getById.mockResolvedValue({ data: makeOrder({}) })
  })

  it('loads and renders order details from API', async () => {
    const wrapper = createWrapper()
    await flushPromises()

    expect(mocks.getById).toHaveBeenCalledWith('order-1')
    expect(wrapper.get('[data-test="layout-title"]').text()).toBe('ORD-42')
    expect(wrapper.get('[data-test="order-status"]').text()).toBe('In Transit')
    expect(wrapper.get('[data-test="pickup-address"]').text()).toContain('Pickup')
    expect(wrapper.get('[data-test="delivery-address"]').text()).toContain('Delivery')
    expect(wrapper.get('[data-test="instructions"]').text()).toBe('Call on arrival')
  })

  it('opens active delivery screen for active orders', async () => {
    const wrapper = createWrapper()
    await flushPromises()

    await wrapper.get('[data-test="open-active-order"]').trigger('click')

    expect(mocks.push).toHaveBeenCalledWith('/orders/active?id=order-1')
  })

  it('hides active action for completed orders', async () => {
    mocks.getById.mockResolvedValueOnce({
      data: makeOrder({ status: API_ORDER_STATUS.DELIVERED }),
    })

    const wrapper = createWrapper()
    await flushPromises()

    expect(wrapper.find('[data-test="open-active-order"]').exists()).toBe(false)
  })

  it('shows error state and retries loading', async () => {
    mocks.getById
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ data: makeOrder({ id: 'order-2', orderNumber: 'ORD-43' }) })

    const wrapper = createWrapper()
    await flushPromises()

    expect(wrapper.text()).toContain('Failed to load order details. Please try again.')

    await wrapper.get('[data-test="retry"]').trigger('click')
    await flushPromises()

    expect(mocks.getById).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('ORD-43')
  })
})

