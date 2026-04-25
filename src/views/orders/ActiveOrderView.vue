<script setup lang="ts">
import MapSection from '@/components/active-order/MapSection.vue'
import DeliveryDetails from '@/components/active-order/DeliveryDetails.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const mapUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpzz_mHzvK7j3LHTLlyj-axTjV4KHt-8IonFP0hIzBFp0xpAdKKEoIZJubhIJU8bMhGmZHWeidT571k_L5TRfHakvvHXbRUNFTJfsmr8fYV7GhMIsQSSDUWD6UxfDeOaO2xVwgFOYqlYqMkT8O0uCWfG_rbMCTGDnY2LClPUHK77LlV3EmWMeS2www0aSN_SU-Ytos6PyU3lN4Xlp5FLWDtwVwJrVwJNkbPM4T7DyOw2B6_SV_AdYM9N_rQfF8VEulnEjUBnrS3Ak'
</script>

<template>
  <div class="bg-surface h-dvh flex flex-col overflow-hidden">
    <MapSection
      :map-image-url="mapUrl"
      status="In Transit"
      @back="router.back()"
    />
    <DeliveryDetails
      tracking-id="VEL-8492-BX"
      eta="14 min"
      recipient-name="Eleanor Vance"
      recipient-address="1042 West Elm Street, Apt 4B"
      instructions="Please leave package at the front desk with the concierge. If they are away, leave by the inside lobby doors. Do not leave outside."
      @confirm="router.push('/dashboard')"
      @call="() => {}"
    />
  </div>
</template>
