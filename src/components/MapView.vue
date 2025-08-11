<template>
  <div style="width: 100%; margin: auto">
    <div ref="mapRef" style="width: 100%; height: 400px; margin-top: 1rem"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppState } from '@/useAppState'

const { mapRef } = useAppState()

onMounted(() => {
  console.log('Map ref ready', mapRef.value)
})
</script>
