<script setup lang="ts">
interface Props {
  modelValue?: string
  label?: string
  placeholder?: string
  type?: string
  icon?: string
  iconRight?: string
  error?: string
  hint?: string
  required?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  required: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label
      v-if="label"
      class="font-label text-xs font-semibold uppercase tracking-wider"
      :class="error ? 'text-error' : 'text-on-surface-variant'"
    >
      {{ label }}
    </label>

    <div class="relative">
      <span
        v-if="icon"
        class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-outline-variant pointer-events-none"
      >{{ icon }}</span>

      <input
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :class="[
          'w-full border-none rounded-lg font-body text-sm text-on-surface placeholder:text-outline-variant transition-colors focus:ring-0 focus:outline-none',
          icon ? 'pl-12 pr-4' : 'px-4',
          iconRight ? 'pr-12' : '',
          'py-3.5',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
          error
            ? 'bg-surface-container-low ring-1 ring-error/40'
            : 'bg-surface-container-low focus:bg-surface-container-highest',
        ]"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />

      <span
        v-if="iconRight"
        class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[20px] text-outline-variant pointer-events-none"
      >{{ iconRight }}</span>
    </div>

    <p v-if="error" class="font-label text-xs text-error">{{ error }}</p>
    <p v-else-if="hint" class="font-label text-xs text-on-surface-variant">{{ hint }}</p>
  </div>
</template>

