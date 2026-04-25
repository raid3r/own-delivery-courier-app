<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  fullWidth?: boolean
  icon?: string
  iconRight?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  fullWidth: false,
})

const emit = defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[
      'inline-flex items-center justify-center gap-2 font-headline font-bold transition-all active:scale-[0.98] select-none',
      fullWidth && 'w-full',
      disabled && 'opacity-50 cursor-not-allowed',
      // sizes
      size === 'sm' && 'text-xs py-2.5 px-5',
      size === 'md' && 'text-sm py-3.5 px-6',
      size === 'lg' && 'text-base py-4 px-8',
      // variants
      variant === 'primary' && 'bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-full shadow-primary-glow-sm hover:opacity-90',
      variant === 'secondary' && 'bg-surface-container-high text-primary rounded-full hover:bg-surface-variant',
      variant === 'tertiary' && 'text-primary bg-transparent hover:bg-surface-container-low rounded-full',
      variant === 'danger' && 'bg-error-container text-on-error-container rounded-full hover:opacity-90',
    ]"
    @click="!disabled && emit('click', $event)"
  >
    <span v-if="icon" class="material-symbols-outlined text-[18px]">{{ icon }}</span>
    <slot />
    <span v-if="iconRight" class="material-symbols-outlined text-[18px]">{{ iconRight }}</span>
  </button>
</template>

