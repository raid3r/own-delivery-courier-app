import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { API_ORDER_STATUS } from '@/constants/order-status-codes'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  getAvailable: vi.fn(),
  acceptOrder: vi.fn(),
}))

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRouter: () => ({ push: mocks.push }),
  }
})

vi.mock('@/api/endpoints/orders.api', () => ({
  ordersApi: {
    getAvailable: mocks.getAvailable,
    acceptOrder: mocks.acceptOrder,
  },
}))

import type { OrderResponse } from '@/types/api'
import OrdersListView from '@/views/orders/OrdersListView.vue'

const AppLayoutStub = {
  name: 'AppLayout',
  template: '<div><slot /></div>',
}

const FilterChipsStub = {
  name: 'FilterChips',
  props: ['chips'],
  emits: ['select'],
  template: `
    <div>
      <button
        v-for="chip in chips"
        :key="chip.id"
        :data-test="'filter-' + chip.id"
        @click="$emit('select', chip.id)"
      >
        {{ chip.label }}
      </button>
    </div>
  `,
}

const OrderCardStub = {
  name: 'OrderCard',
  props: ['order'],
  emits: ['accept'],
  template: '<button :data-test="`order-${order.id}`" @click="$emit(\'accept\', order.id)">{{ order.id }}|{{ order.payout }}|{{ order.distanceMiles }}|{{ order.type }}</button>',
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
    status: API_ORDER_STATUS.PENDING,
    pickupAddress: { city: 'Kyiv', street: 'Pickup', buildingNumber: '1', latitude: 50.45, longitude: 30.52 },
    deliveryAddress: { city: 'Kyiv', street: 'Dropoff', buildingNumber: '2', latitude: 50.46, longitude: 30.53 },
    weight: 1,
    dimensions: { width: 1, length: 1, height: 1 },
    cost: 10,
    paymentStatus: 1,
    createdAt: '2026-05-02T10:00:00Z',
    actualDeliveryTime: null,
    description: null,
    specialInstructions: null,
    ...overrides,
  }
}

function createWrapper() {
  return mount(OrdersListView, {
    global: {
      stubs: {
        AppLayout: AppLayoutStub,
        FilterChips: FilterChipsStub,
        OrderCard: OrderCardStub,
        PageLoadState: PageLoadStateStub,
      },
    },
  })
}

describe('OrdersListView', () => {
  beforeEach(() => {
    mocks.push.mockReset()
    mocks.getAvailable.mockReset()
    mocks.acceptOrder.mockReset()

    mocks.getAvailable.mockResolvedValue({
      data: {
        items: [
          makeOrder({ id: 'short-distance', cost: 12, pickupAddress: { latitude: 50.45, longitude: 30.52 }, deliveryAddress: { latitude: 50.451, longitude: 30.521 } }),
          makeOrder({ id: 'high-payout', cost: 24.5, pickupAddress: { latitude: 50.45, longitude: 30.52 }, deliveryAddress: { latitude: 50.5, longitude: 30.6 } }),
        ],
        total: 2,
        skip: 0,
        take: 20,
        hasMore: false,
      },
    })

    mocks.acceptOrder.mockResolvedValue({
      data: makeOrder({ id: 'short-distance', status: API_ORDER_STATUS.ASSIGNED }),
    })
  })

  it('loads available orders from API and renders them', async () => {
    const wrapper = createWrapper()
    await flushPromises()

    expect(mocks.getAvailable).toHaveBeenCalledWith({ skip: 0, take: 20 })
    expect(wrapper.text()).toContain('Showing 2 of 2 nearby deliveries')
    expect(wrapper.findAll('[data-test^="order-"]')).toHaveLength(2)
  })

  it('loads more available orders when the API has another page', async () => {
    mocks.getAvailable
      .mockResolvedValueOnce({
        data: {
          items: [makeOrder({ id: 'first-page' })],
          total: 2,
          skip: 0,
          take: 20,
          hasMore: true,
        },
      })
      .mockResolvedValueOnce({
        data: {
          items: [makeOrder({ id: 'second-page' })],
          total: 2,
          skip: 1,
          take: 20,
          hasMore: false,
        },
      })

    const wrapper = createWrapper()
    await flushPromises()

    await wrapper.get('[data-test="load-more"]').trigger('click')
    await flushPromises()

    expect(mocks.getAvailable).toHaveBeenLastCalledWith({ skip: 1, take: 20 })
    expect(wrapper.find('[data-test="order-first-page"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="order-second-page"]').exists()).toBe(true)
  })

  it('sorts orders by highest payout', async () => {
    const wrapper = createWrapper()
    await flushPromises()

    await wrapper.get('[data-test="filter-payout"]').trigger('click')

    const orderCards = wrapper.findAll('[data-test^="order-"]')
    expect(orderCards[0].attributes('data-test')).toBe('order-high-payout')
  })

  it('shows empty state when API returns no orders', async () => {
    mocks.getAvailable.mockResolvedValueOnce({
      data: {
        items: [],
        total: 0,
        skip: 0,
        take: 20,
        hasMore: false,
      },
    })

    const wrapper = createWrapper()
    await flushPromises()

    expect(wrapper.text()).toContain('No available orders right now.')
  })

  it('shows error and retries loading', async () => {
    mocks.getAvailable
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({
        data: {
          items: [makeOrder({ id: 'retry-order' })],
          total: 1,
          skip: 0,
          take: 20,
          hasMore: false,
        },
      })

    const wrapper = createWrapper()
    await flushPromises()

    expect(wrapper.text()).toContain('Failed to load available orders. Please try again.')

    await wrapper.get('[data-test="retry"]').trigger('click')
    await flushPromises()

    expect(mocks.getAvailable).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[data-test="order-retry-order"]').exists()).toBe(true)
  })

  it('accepts order and opens active delivery', async () => {
    const wrapper = createWrapper()
    await flushPromises()

    await wrapper.get('[data-test="order-short-distance"]').trigger('click')
    await flushPromises()

    expect(mocks.acceptOrder).toHaveBeenCalledWith('short-distance')
    expect(mocks.push).toHaveBeenCalledWith('/orders/active?id=short-distance')
  })

  it('shows accept error when the order was already taken', async () => {
    mocks.acceptOrder.mockRejectedValueOnce(new Error('conflict'))

    const wrapper = createWrapper()
    await flushPromises()

    await wrapper.get('[data-test="order-short-distance"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Failed to accept order. It may have already been taken.')
    expect(mocks.push).not.toHaveBeenCalled()
  })
})
