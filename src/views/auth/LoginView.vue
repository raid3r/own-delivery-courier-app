<script setup lang="ts">
import AuthCard from '@/components/auth/AuthCard.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')

const isLoading = computed(() => authStore.isLoading)
const serverError = computed(() => authStore.error)

async function onSubmit() {
  authStore.clearError()
  const ok = await authStore.login({ email: email.value, password: password.value })
  if (ok) {
    router.push('/dashboard')
  }
}
</script>

<template>
  <AuthCard
    brand="KINETIC"
    subtitle="High-Performance Delivery Logistics"
    title="Welcome Back"
  >
    <template #header>
      <h2 class="font-headline text-2xl font-bold text-on-surface mb-1">Вхід</h2>
      <p class="font-body text-sm text-on-surface-variant">Увійдіть, щоб продовжити роботу.</p>
    </template>

    <form class="space-y-6" @submit.prevent="onSubmit">
      <AppInput
        v-model="email"
        label="Email"
        placeholder="courier@example.com"
        icon="mail"
        type="email"
        required
        :disabled="isLoading"
      />
      <AppInput
        v-model="password"
        label="Пароль"
        placeholder="••••••••"
        icon="lock"
        type="password"
        required
        :disabled="isLoading"
      />

      <!-- Server error -->
      <div
        v-if="serverError"
        class="flex items-center gap-3 rounded-lg bg-error-container/60 px-4 py-3 text-sm text-on-error-container"
      >
        <span class="material-symbols-outlined text-[18px] shrink-0">error</span>
        {{ serverError }}
      </div>

      <div class="flex justify-end">
        <a class="font-body text-xs font-medium text-primary hover:text-primary-container transition-colors" href="#">
          Забули пароль?
        </a>
      </div>

      <div class="pt-2">
        <AppButton
          variant="primary"
          size="lg"
          type="submit"
          full-width
          icon-right="arrow_forward"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="flex items-center gap-2">
            <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Входимо…
          </span>
          <span v-else>Увійти</span>
        </AppButton>
      </div>
    </form>

    <template #footer>
      <div class="mt-8 text-center">
        <p class="font-body text-sm text-on-surface-variant">
          Немає акаунту?
          <a
            class="font-medium text-primary hover:text-primary-container transition-colors ml-1 cursor-pointer"
            @click="router.push('/onboarding')"
          >
            Зареєструватися
          </a>
        </p>
      </div>
    </template>
  </AuthCard>
</template>
