import { reactive } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { API_ORDER_STATUS } from '@/constants/order-status-codes'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  getMe: vi.fn(),
  getByCourier: vi.fn(),
  logout: vi.fn(),
}))

let mockAuthStore: {
  profile: any
  logout: ReturnType<typeof vi.fn>
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

vi.mock('@/api/endpoints/couriers.api', () => ({
  couriersApi: {
    getMe: mocks.getMe,
  },
}))

vi.mock('@/api/endpoints/orders.api', () => ({
  ordersApi: {
    getByCourier: mocks.getByCourier,
  },
}))

import ProfileView from '@/views/profile/ProfileView.vue'

const AppLayoutStub = {
  name: 'AppLayout',
  template: '<div><slot /></div>',
}

const AppButtonStub = {
  name: 'AppButton',
  emits: ['click'],
  template: '<button data-test="retry" @click="$emit(\'click\')"><slot /></button>',
}

const ProfileHeaderStub = {
  name: 'ProfileHeader',
  props: ['name', 'role', 'stats', 'rating'],
  template: '<div data-test="header">{{ name }}|{{ role }}|{{ stats?.[0]?.value ?? 0 }}</div>',
}

const SettingsGroupStub = {
  name: 'SettingsGroup',
  props: ['items'],
  emits: ['select'],
  template: `
    <div>
      <button
        v-for="item in items"
        :key="item.id"
        :data-test="'setting-' + item.id"
        @click="$emit('select', item.id)"
      >
        {{ item.label }}
      </button>
    </div>
  `,
}

function createWrapper() {
  return mount(ProfileView, {
    global: {
      stubs: {
        AppLayout: AppLayoutStub,
        AppButton: AppButtonStub,
        ProfileHeader: ProfileHeaderStub,
        SettingsGroup: SettingsGroupStub,
      },
    },
  })
}

describe('ProfileView', () => {
  beforeEach(() => {
    mocks.push.mockReset()
    mocks.getMe.mockReset()
    mocks.getByCourier.mockReset()
    mocks.logout.mockReset()

    mockAuthStore = reactive({
      profile: null,
      logout: mocks.logout,
    })

    mocks.logout.mockResolvedValue(undefined)
    mocks.getMe.mockResolvedValue({
      data: {
        courierId: 'c1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1000000000',
        createdAt: '2026-01-01T00:00:00Z',
        isActive: true,
      },
    })
    mocks.getByCourier.mockResolvedValue({
      data: [
        { id: '1', status: API_ORDER_STATUS.DELIVERED },
        { id: '2', status: API_ORDER_STATUS.ASSIGNED },
        { id: '3', status: API_ORDER_STATUS.IN_TRANSIT },
      ],
    })
  })

  it('loads and renders profile data successfully', async () => {
    const wrapper = createWrapper()
    await flushPromises()

    expect(mocks.getMe).toHaveBeenCalledTimes(1)
    expect(mocks.getByCourier).toHaveBeenCalledTimes(1)
    expect(mocks.getByCourier).toHaveBeenCalledWith('c1', { skip: 0, take: 100 })
    expect(wrapper.get('[data-test="header"]').text()).toContain('John Doe')
    expect(wrapper.get('[data-test="header"]').text()).toContain('Active Courier')
    expect(wrapper.get('[data-test="header"]').text()).toContain('|3')
  })

  it('shows error when profile request fails', async () => {
    mocks.getMe.mockRejectedValueOnce(new Error('network'))

    const wrapper = createWrapper()
    await flushPromises()

    expect(wrapper.text()).toContain('Failed to load profile data. Please try again.')
    expect(mocks.getByCourier).not.toHaveBeenCalled()
  })

  it('retries loading after error', async () => {
    mocks.getMe
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({
        data: {
          courierId: 'c2',
          email: 'jane@example.com',
          firstName: 'Jane',
          lastName: 'Roe',
          phoneNumber: '+2000000000',
          createdAt: '2026-01-01T00:00:00Z',
          isActive: true,
        },
      })

    const wrapper = createWrapper()
    await flushPromises()

    await wrapper.get('[data-test="retry"]').trigger('click')
    await flushPromises()

    expect(mocks.getMe).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[data-test="header"]').text()).toContain('Jane Roe')
  })

  it('logs out and redirects to login', async () => {
    const wrapper = createWrapper()
    await flushPromises()

    await wrapper.get('[data-test="setting-logout"]').trigger('click')
    await flushPromises()

    expect(mocks.logout).toHaveBeenCalledTimes(1)
    expect(mocks.push).toHaveBeenCalledWith('/login')
  })

  it('opens support and privacy links', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    const wrapper = createWrapper()
    await flushPromises()

    await wrapper.get('[data-test="setting-support"]').trigger('click')
    await wrapper.get('[data-test="setting-privacy"]').trigger('click')

    expect(openSpy).toHaveBeenNthCalledWith(1, 'https://support.owndelivery.app', '_blank', 'noopener,noreferrer')
    expect(openSpy).toHaveBeenNthCalledWith(2, 'https://owndelivery.app/privacy', '_blank', 'noopener,noreferrer')

    openSpy.mockRestore()
  })
})

