<script setup lang="ts">
import AuthCard from '@/components/auth/AuthCard.vue'
import OtpInput from '@/components/auth/OtpInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const error = ref('')
const loading = ref(false)

function onComplete(_code: string) {
  error.value = ''
  // Demo: any code works
  router.push('/dashboard')
}

function resend() {
  // TODO: resend OTP
}
</script>

<template>
  <AuthCard brand="KINETIC" subtitle="High-Performance Delivery Logistics">
    <template #header>
      <h2 class="font-headline text-2xl font-bold text-on-surface mb-1">Verify Your Phone</h2>
      <p class="font-body text-sm text-on-surface-variant">
        We sent a 6-digit code to your phone number. Enter it below.
      </p>
    </template>

    <div class="flex flex-col gap-8">
      <OtpInput :length="6" :error="error" @complete="onComplete" />

      <AppButton variant="primary" size="lg" full-width icon-right="arrow_forward" :disabled="loading">
        Verify Code
      </AppButton>

      <p class="text-center font-body text-sm text-on-surface-variant">
        Didn't receive it?
        <button class="text-primary font-semibold ml-1 hover:text-primary-container transition-colors" @click="resend">
          Resend Code
        </button>
      </p>
    </div>

    <template #footer>
      <div class="mt-8 text-center">
        <button class="font-body text-sm text-on-surface-variant hover:text-on-surface transition-colors" @click="router.back()">
          ← Back
        </button>
      </div>
    </template>
  </AuthCard>
</template>

