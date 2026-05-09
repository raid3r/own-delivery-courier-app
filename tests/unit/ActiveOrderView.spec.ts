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
  props: ['order', 'status'],
  template: '<div data-test="map-status">{{ status }}</div>',
}

const AppHeaderStub = {
  name: 'AppHeader',
  props: ['title'],
  template: `
    <div data-test="app-header">
      <div data-test="app-header-title">{{ title }}</div>
      <slot name="actions" />
    </div>
  `,
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

const BottomNavBarStub = {
  name: 'BottomNavBar',
  template: '<div data-test="bottom-nav" />',
}

const AppDialogStub = {
  name: 'AppDialog',
  props: ['isOpen', 'title', 'message', 'actions'],
  emits: ['action', 'close'],
  template: `
    <div v-if="isOpen" data-test="app-dialog">
      <div data-test="dialog-title">{{ title }}</div>
      <div v-if="message" data-test="dialog-message">{{ message }}</div>
      <button
        v-for="action in actions"
        :key="action.id"
        :data-test="'dialog-action-' + action.id"
        @click="$emit('action', action.id)"
      >
        {{ action.label }}
      </button>
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
        AppHeader: AppHeaderStub,
        DeliveryDetails: DeliveryDetailsStub,
        PageLoadState: PageLoadStateStub,
        AppDialog: AppDialogStub,
        BottomNavBar: BottomNavBarStub,
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
    mocks.getByCourier.mockResolvedValue({
      data: {
        items: [],
        total: 0,
        skip: 0,
        take: 100,
        hasMore: false,
      },
    })
  })

  it('loads active order by query id and renders real API data', async () => {
    const wrapper = createWrapper()
    await flushPromises()

    expect(mocks.getById).toHaveBeenCalledWith('order-1')
    expect(wrapper.get('[data-test="app-header-title"]').text()).toBe('ORD-1')
    expect(wrapper.get('[data-test="map-status"]').text()).toBe('In Transit')
    expect(wrapper.get('[data-test="delivery-tracking"]').text()).toBe('ORD-1')
    expect(wrapper.get('[data-test="delivery-recipient"]').text()).toBe('John Smith')
    expect(wrapper.find('[data-test="bottom-nav"]').exists()).toBe(true)
  })

  it('navigates back from header button', async () => {
    const wrapper = createWrapper()
    await flushPromises()

    await wrapper.get('[data-test="header-back"]').trigger('click')

    expect(mocks.back).toHaveBeenCalledTimes(1)
  })

  it('updates status through API and redirects to order details when flow completes', async () => {
    const wrapper = createWrapper()
    await flushPromises()

    await wrapper.get('[data-test="confirm"]').trigger('click')
    await flushPromises()

    expect(mocks.updateStatus).not.toHaveBeenCalled()
    expect(wrapper.get('[data-test="dialog-title"]').text()).toBe('Підтвердити доставку замовлення?')

    await wrapper.get('[data-test="dialog-action-confirm"]').trigger('click')
    await flushPromises()

    expect(mocks.updateStatus).toHaveBeenCalledWith('order-1', { newStatus: API_ORDER_STATUS.DELIVERED })
    expect(wrapper.get('[data-test="dialog-title"]').text()).toBe('Доставку підтверджено')
    expect(mocks.push).not.toHaveBeenCalled()

    await wrapper.get('[data-test="dialog-action-ok"]').trigger('click')
    await flushPromises()

    expect(mocks.push).toHaveBeenCalledWith('/orders/order-1')
  })

  it('shows empty state when there is no active order', async () => {
    routeState.query.id = undefined
    mocks.getByCourier.mockResolvedValueOnce({
      data: {
        items: [makeOrder({ id: 'done', status: API_ORDER_STATUS.DELIVERED })],
        total: 1,
        skip: 0,
        take: 100,
        hasMore: false,
      },
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

