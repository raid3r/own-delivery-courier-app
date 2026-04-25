<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { name: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
  { name: 'Orders', icon: 'package_2', route: '/orders' },
  { name: 'Track', icon: 'local_shipping', route: '/map' },
  { name: 'Profile', icon: 'person', route: '/profile' },
]

function isActive(navRoute: string) {
  return route.path === navRoute || route.path.startsWith(navRoute + '/')
}
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 glass bg-surface-container-lowest/80 z-50 rounded-t-3xl shadow-nav"
  >
    <router-link
      v-for="item in navItems"
      :key="item.name"
      :to="item.route"
      class="flex flex-col items-center justify-center px-4 py-2 rounded-2xl transition-all duration-200 w-16 no-underline"
      :class="
        isActive(item.route)
          ? 'bg-primary/10 text-primary'
          : 'text-outline hover:bg-surface-container-low'
      "
    >
      <span
        class="material-symbols-outlined mb-1 text-[24px]"
        :class="isActive(item.route) ? 'icon-filled' : ''"
      >{{ item.icon }}</span>
      <span class="font-label text-[10px] font-semibold uppercase tracking-widest">{{ item.name }}</span>
    </router-link>
  </nav>
</template>

