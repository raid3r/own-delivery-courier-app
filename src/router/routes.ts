import type { RouteRecordRaw } from 'vue-router'
export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/orders',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: () => import('@/views/auth/OnboardingView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/verify',
    name: 'Verify',
    component: () => import('@/views/auth/VerifyView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('@/views/orders/OrdersListView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/orders/active',
    name: 'ActiveOrder',
    component: () => import('@/views/orders/ActiveOrderView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/orders/:id',
    name: 'OrderDetail',
    component: () => import('@/views/orders/OrderDetailView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/map',
    name: 'LiveMap',
    component: () => import('@/views/map/LiveMapView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/shift',
    name: 'Shift',
    component: () => import('@/views/shift/ShiftView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/profile/ProfileView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('@/views/history/HistoryView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
  },
]
