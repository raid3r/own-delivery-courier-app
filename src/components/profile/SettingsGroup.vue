<script setup lang="ts">
export interface SettingsItem {
  id: string
  label: string
  icon: string
  value?: string
  danger?: boolean
}

interface Props {
  title?: string
  items: SettingsItem[]
}

defineProps<Props>()
defineEmits<{ select: [id: string] }>()
</script>

<template>
  <div class="flex flex-col gap-1">
    <h3 v-if="title" class="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant px-1 mb-2">
      {{ title }}
    </h3>
    <div class="bg-surface-container-lowest rounded-xl overflow-hidden shadow-cloud-sm">
      <button
        v-for="(item, index) in items"
        :key="item.id"
        class="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-surface-container-low transition-colors text-left"
        :class="index < items.length - 1 ? 'border-b border-surface-container-low' : ''"
        @click="$emit('select', item.id)"
      >
        <span
          class="material-symbols-outlined text-xl"
          :class="item.danger ? 'text-error' : 'text-on-surface-variant'"
        >{{ item.icon }}</span>
        <span
          class="flex-1 font-body text-sm font-medium"
          :class="item.danger ? 'text-error' : 'text-on-surface'"
        >{{ item.label }}</span>
        <span v-if="item.value" class="font-label text-xs text-on-surface-variant">{{ item.value }}</span>
        <span class="material-symbols-outlined text-[18px] text-outline-variant">chevron_right</span>
      </button>
    </div>
  </div>
</template>

