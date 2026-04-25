<script setup lang="ts">
import AppHeader from './AppHeader.vue'
import BottomNavBar from './BottomNavBar.vue'

interface Props {
  title?: string
  avatarUrl?: string
  showNav?: boolean
  showHeader?: boolean
  hasUnread?: boolean
}

withDefaults(defineProps<Props>(), {
  title: 'Velocity',
  showNav: true,
  showHeader: true,
})
</script>

<template>
  <div class="bg-surface min-h-dvh">
    <AppHeader
      v-if="showHeader"
      :title="title"
      :avatar-url="avatarUrl"
      :has-unread="hasUnread"
    >
      <template v-if="$slots.actions" #actions>
        <slot name="actions" />
      </template>
    </AppHeader>

    <main class="pt-20 pb-28 px-5 max-w-lg mx-auto w-full">
      <slot />
    </main>

    <BottomNavBar v-if="showNav" />
  </div>
</template>
