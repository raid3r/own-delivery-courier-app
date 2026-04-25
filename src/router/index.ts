import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
import { useAuthStore } from '@/stores/auth.store'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()

  // Redirect "/" based on auth state
  if (to.path === '/') {
    return auth.isAuthenticated ? next({ name: 'Dashboard' }) : next({ name: 'Login' })
  }

  // Redirect already-authenticated users away from auth pages
  const guestOnly = ['Login', 'Onboarding', 'Verify']
  if (guestOnly.includes(to.name as string) && auth.isAuthenticated) {
    return next({ name: 'Dashboard' })
  }

  // Protect private pages
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next({ name: 'Login' })
  }

  next()
})

export default router
