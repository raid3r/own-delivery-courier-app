<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>
<template>
  <div style="text-align:center;padding:40px">
    <h1>404</h1>
    <p>Сторінку не знайдено</p>
    <button @click="router.push('/')">На головну</button>
  </div>
</template>
