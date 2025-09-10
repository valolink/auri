<template>
  <div style="width: 100%; height: 100%; margin: auto">
    <div ref="mapRef" class="map-view"></div>
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
<style scoped>
.map-view {
  width: 100%;
  height: 100%;
  min-height: 500px;
}
</style>
