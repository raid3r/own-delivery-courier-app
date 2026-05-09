<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'

export interface AppDialogAction {
  id: string
  label: string
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger'
}

interface Props {
  isOpen: boolean
  title: string
  message?: string
  tone?: 'default' | 'success' | 'danger'
  actions: readonly AppDialogAction[]
  closeOnBackdrop?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  message: undefined,
  tone: 'default',
  closeOnBackdrop: false,
})

const emit = defineEmits<{ action: [id: string]; close: [] }>()

function onBackdropClick() {
  if (props.closeOnBackdrop) {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/50 px-4 py-6"
      data-test="app-dialog"
      @click="onBackdropClick"
    >
      <div
        class="w-full max-w-md rounded-3xl bg-surface-container-lowest shadow-cloud-lg border border-surface-container-high p-6 sm:p-7"
        role="dialog"
        aria-modal="true"
        @click.stop
      >
        <div class="flex flex-col gap-4 text-center sm:text-left">
          <div class="mx-auto sm:mx-0 flex h-14 w-14 items-center justify-center rounded-full"
            :class="[
              tone === 'success' && 'bg-primary/12 text-primary',
              tone === 'danger' && 'bg-error-container text-on-error-container',
              tone === 'default' && 'bg-surface-container-high text-primary',
            ]"
          >
            <span class="material-symbols-outlined text-[28px]">
              {{ tone === 'success' ? 'check_circle' : tone === 'danger' ? 'warning' : 'help' }}
            </span>
          </div>

          <div class="flex flex-col gap-2">
            <h2 class="font-headline text-2xl font-extrabold tracking-tight text-on-surface" data-test="dialog-title">
              {{ title }}
            </h2>
            <p v-if="message" class="font-body text-sm leading-6 text-on-surface-variant" data-test="dialog-message">
              {{ message }}
            </p>
          </div>

          <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <AppButton
              v-for="action in actions"
              :key="action.id"
              :variant="action.variant ?? 'primary'"
              :full-width="true"
              size="md"
              :data-test="`dialog-action-${action.id}`"
              @click="emit('action', action.id)"
            >
              {{ action.label }}
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

