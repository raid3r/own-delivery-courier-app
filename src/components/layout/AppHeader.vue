<script setup lang="ts">
interface Props {
  avatarUrl?: string
  title?: string
  showNotification?: boolean
  hasUnread?: boolean
  transparent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Velocity',
  showNotification: true,
  transparent: false,
})

const emit = defineEmits<{ notificationClick: [] }>()
</script>

<template>
  <header
    class="fixed z-50 top-0 left-0 w-full flex justify-between items-center px-6 py-4 glass"
    :class="transparent ? 'bg-transparent' : 'bg-surface-container-lowest/90'"
  >
    <div class="flex items-center gap-3">
      <img
        v-if="avatarUrl"
        :src="avatarUrl"
        alt="Profile"
        class="w-10 h-10 rounded-full object-cover shadow-sm"
      />
      <span class="text-2xl font-black text-on-surface tracking-tighter font-headline">
        <slot name="title">{{ title }}</slot>
      </span>
    </div>

    <div class="flex items-center gap-2">
      <slot name="actions" />
      <button
        v-if="showNotification"
        class="flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-low hover:bg-surface-container transition-colors relative"
        @click="emit('notificationClick')"
      >
        <span class="material-symbols-outlined text-primary-container icon-filled">notifications</span>
        <span
          v-if="hasUnread"
          class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error"
        />
      </button>
    </div>
  </header>
</template>

