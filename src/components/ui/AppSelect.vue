<script setup lang="ts">
interface Option {
  value: string
  label: string
}

interface Props {
  modelValue?: string
  label?: string
  placeholder?: string
  options: Option[]
  icon?: string
  error?: string
  required?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  required: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" class="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
      {{ label }}
    </label>
    <div class="relative">
      <span
        v-if="icon"
        class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-outline-variant pointer-events-none"
      >{{ icon }}</span>
      <select
        :value="modelValue"
        :required="required"
        :disabled="disabled"
        :class="[
          'w-full border-none rounded-lg font-body text-sm text-on-surface bg-surface-container-low focus:bg-surface-container-highest focus:ring-0 focus:outline-none transition-colors appearance-none cursor-pointer py-3.5 pr-10',
          icon ? 'pl-12' : 'pl-4',
          disabled && 'opacity-50 cursor-not-allowed',
        ]"
        @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      >
        <option v-if="placeholder" value="" disabled :selected="!modelValue">{{ placeholder }}</option>
        <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[20px] text-outline pointer-events-none">
        expand_more
      </span>
    </div>
    <p v-if="error" class="font-label text-xs text-error">{{ error }}</p>
  </div>
</template>

