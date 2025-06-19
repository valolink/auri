<template>
  <div style="padding: 1rem; max-width: 600px; margin: auto">
    <div
      ref="mapRef"
      style="width: 100%; height: 400px; margin-top: 1rem; border: 1px solid #ccc"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppState } from '@/useAppState'

const { mapRef } = useAppState()

onMounted(() => {
  // This ensures the reference is available before `runSolarApi` tries to use it.
  console.log('Map ref ready', mapRef.value)
})
</script>
