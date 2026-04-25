<script setup lang="ts">
import AuthCard from '@/components/auth/AuthCard.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
  licenseNumber: '',
})

const fieldErrors = ref<Record<string, string>>({})
const isLoading = computed(() => authStore.isLoading)
const serverError = computed(() => authStore.error)

function validate() {
  const errors: Record<string, string> = {}
  if (!form.value.firstName.trim()) errors.firstName = "Вкажіть ім'я"
  if (!form.value.lastName.trim()) errors.lastName = 'Вкажіть прізвище'
  if (!form.value.email.trim()) errors.email = 'Вкажіть email'
  if (!form.value.phoneNumber.trim()) errors.phoneNumber = 'Вкажіть номер телефону'
  if (form.value.password.length < 8) errors.password = 'Мінімум 8 символів'
  if (form.value.password !== form.value.confirmPassword)
    errors.confirmPassword = 'Паролі не співпадають'
  fieldErrors.value = errors
  return Object.keys(errors).length === 0
}

async function onSubmit() {
  if (!validate()) return
  authStore.clearError()
  const ok = await authStore.register({
    firstName: form.value.firstName,
    lastName: form.value.lastName,
    email: form.value.email,
    phoneNumber: form.value.phoneNumber,
    password: form.value.password,
    licenseNumber: form.value.licenseNumber || null,
  })
  if (ok) {
    router.push('/dashboard')
  }
}
</script>

<template>
  <AuthCard brand="KINETIC" show-close @close="router.push('/login')">
    <template #header>
      <h1 class="font-headline text-3xl font-extrabold tracking-tight text-on-surface mb-2">
        Реєстрація
      </h1>
      <p class="font-body text-on-surface-variant text-sm leading-relaxed">
        Заповніть форму, щоб стати кур'єром Kinetic.
      </p>
    </template>

    <form class="space-y-6" @submit.prevent="onSubmit">
      <!-- Personal -->
      <div class="space-y-4">
        <h2 class="font-headline text-base font-bold text-on-surface-variant uppercase tracking-wider">
          Особисті дані
        </h2>
        <div class="grid grid-cols-2 gap-4">
          <AppInput
            v-model="form.firstName"
            label="Ім'я"
            placeholder="Іван"
            icon="person"
            required
            :disabled="isLoading"
            :error="fieldErrors.firstName"
          />
          <AppInput
            v-model="form.lastName"
            label="Прізвище"
            placeholder="Коваленко"
            icon="person"
            required
            :disabled="isLoading"
            :error="fieldErrors.lastName"
          />
        </div>
        <AppInput
          v-model="form.email"
          label="Email"
          placeholder="ivan@example.com"
          icon="mail"
          type="email"
          required
          :disabled="isLoading"
          :error="fieldErrors.email"
        />
        <AppInput
          v-model="form.phoneNumber"
          label="Телефон"
          placeholder="+380501234567"
          icon="call"
          type="tel"
          required
          :disabled="isLoading"
          :error="fieldErrors.phoneNumber"
        />
      </div>

      <div class="w-full h-px bg-surface-container-low" />

      <!-- Optional -->
      <div class="space-y-4">
        <h2 class="font-headline text-base font-bold text-on-surface-variant uppercase tracking-wider">
          Додатково (необов'язково)
        </h2>
        <AppInput
          v-model="form.licenseNumber"
          label="Номер ліцензії / посвідчення"
          placeholder="DL-1234567"
          icon="badge"
          :disabled="isLoading"
        />
      </div>

      <div class="w-full h-px bg-surface-container-low" />

      <!-- Security -->
      <div class="space-y-4">
        <h2 class="font-headline text-base font-bold text-on-surface-variant uppercase tracking-wider">
          Безпека
        </h2>
        <AppInput
          v-model="form.password"
          label="Пароль"
          placeholder="••••••••"
          icon="lock"
          type="password"
          hint="Мінімум 8 символів."
          required
          :disabled="isLoading"
          :error="fieldErrors.password"
        />
        <AppInput
          v-model="form.confirmPassword"
          label="Підтвердження пароля"
          placeholder="••••••••"
          icon="lock"
          type="password"
          required
          :disabled="isLoading"
          :error="fieldErrors.confirmPassword"
        />
      </div>

      <!-- Server error -->
      <div
        v-if="serverError"
        class="flex items-center gap-3 rounded-lg bg-error-container/60 px-4 py-3 text-sm text-on-error-container"
      >
        <span class="material-symbols-outlined text-[18px] shrink-0">error</span>
        {{ serverError }}
      </div>

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
          Реєструємо…
        </span>
        <span v-else>Зареєструватися</span>
      </AppButton>

      <p class="text-center text-xs font-label text-on-surface-variant">
        Реєструючись, ви погоджуєтесь з
        <a class="text-primary font-semibold" href="#">Умовами використання</a> та
        <a class="text-primary font-semibold" href="#">Політикою конфіденційності</a>.
      </p>
    </form>

    <template #footer>
      <div class="mt-8 text-center">
        <p class="font-body text-sm text-on-surface-variant">
          Вже є акаунт?
          <a
            class="text-primary font-bold ml-1 cursor-pointer"
            @click="router.push('/login')"
          >Увійти</a>
        </p>
      </div>
    </template>
  </AuthCard>
</template>
