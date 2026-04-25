<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
  brand?: string
  showClose?: boolean
}

withDefaults(defineProps<Props>(), {
  brand: 'KINETIC',
  showClose: false,
})

defineEmits<{ close: [] }>()
</script>

<template>
  <div class="bg-surface min-h-dvh flex flex-col items-center justify-center relative overflow-hidden">
    <!-- Ambient background blobs -->
    <div class="absolute inset-0 pointer-events-none z-0">
      <div class="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[120px]" />
      <div class="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-tertiary/5 rounded-full blur-[100px]" />
    </div>

    <!-- Header bar -->
    <header class="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-4 bg-surface/80 glass">
      <span class="font-headline font-black text-2xl tracking-tighter text-primary">{{ brand }}</span>
      <button
        v-if="showClose"
        class="text-on-surface-variant hover:text-on-surface transition-colors p-2 rounded-full hover:bg-surface-container-low"
      >
        <span class="material-symbols-outlined" @click="$emit('close')">close</span>
      </button>
    </header>

    <!-- Card -->
    <main class="w-full max-w-md px-6 z-10 relative pt-24 pb-12">
      <!-- Brand identity (only if no close button, i.e. centered auth screen) -->
      <div v-if="!showClose" class="text-center mb-12">
        <h1 class="font-headline font-black text-4xl tracking-tighter text-primary mb-2">{{ brand }}</h1>
        <p v-if="subtitle" class="font-body text-on-surface-variant text-sm font-medium tracking-wide">{{ subtitle }}</p>
      </div>

      <div class="bg-surface-container-lowest rounded-xl shadow-cloud-lg p-8 relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-container" />

        <div v-if="title || $slots.header" class="mb-8">
          <slot name="header">
            <h2 class="font-headline text-2xl font-bold text-on-surface mb-1">{{ title }}</h2>
          </slot>
        </div>

        <slot />
      </div>

      <slot name="footer" />
    </main>
  </div>
</template>

