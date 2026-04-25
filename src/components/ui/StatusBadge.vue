<script setup lang="ts">
type Variant = 'default' | 'express' | 'standard' | 'priority' | 'transit' | 'delivered' | 'cancelled'

interface Props {
  variant?: Variant
  label: string
  dot?: boolean
  pulse?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  dot: false,
  pulse: false,
})

const classes: Record<Variant, string> = {
  default: 'bg-surface-container-low text-on-surface',
  express: 'bg-surface-container-low text-on-surface',
  standard: 'bg-surface-container-low text-on-surface',
  priority: 'bg-error/10 text-error',
  transit: 'bg-tertiary/10 text-tertiary',
  delivered: 'bg-tertiary-container/30 text-tertiary',
  cancelled: 'bg-error-container/20 text-error',
}

const dotColor: Record<Variant, string> = {
  default: 'bg-outline',
  express: 'bg-primary',
  standard: 'bg-secondary',
  priority: 'bg-error',
  transit: 'bg-tertiary',
  delivered: 'bg-tertiary',
  cancelled: 'bg-error',
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 font-label text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg"
    :class="classes[variant]"
  >
    <span
      v-if="dot"
      class="w-2 h-2 rounded-full flex-shrink-0"
      :class="[dotColor[variant], pulse && 'animate-pulse']"
    />
    {{ label }}
  </span>
</template>

