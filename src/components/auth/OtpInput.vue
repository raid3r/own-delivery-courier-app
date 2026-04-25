<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  length?: number
  error?: string
}

const props = withDefaults(defineProps<Props>(), { length: 6 })
const emit = defineEmits<{ complete: [code: string] }>()

const digits = ref<string[]>(Array(props.length).fill(''))
const inputs = ref<HTMLInputElement[]>([])

function onInput(index: number, event: Event) {
  const val = (event.target as HTMLInputElement).value.replace(/\D/g, '')
  digits.value[index] = val.slice(-1)
  if (val && index < props.length - 1) {
    inputs.value[index + 1]?.focus()
  }
  if (digits.value.every(d => d)) {
    emit('complete', digits.value.join(''))
  }
}

function onKeydown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace' && !digits.value[index] && index > 0) {
    inputs.value[index - 1]?.focus()
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex gap-3 justify-center">
      <input
        v-for="(_, i) in digits"
        :key="i"
        ref="inputs"
        type="text"
        inputmode="numeric"
        maxlength="1"
        :value="digits[i]"
        class="w-12 h-14 text-center font-headline text-2xl font-bold text-on-surface bg-surface-container-low rounded-xl border-none focus:ring-2 focus:ring-primary/40 focus:bg-surface-container-highest focus:outline-none transition-all"
        :class="error ? 'ring-2 ring-error/40' : ''"
        @input="onInput(i, $event)"
        @keydown="onKeydown(i, $event)"
      />
    </div>
    <p v-if="error" class="text-center font-label text-xs text-error">{{ error }}</p>
  </div>
</template>

