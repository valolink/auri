<template>
  <div style="padding: 1rem; max-width: 600px; margin: auto">
    <div
      ref="mapRef"
      style="width: 100%; height: 400px; margin-top: 1rem; border: 1px solid #ccc"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAppState } from '@/useAppState'
import {
  captureMapWithProperSizing, // Add this line
  calculateZoomFromRadius,
} from '@/services/mapService'

const { mapInstance, mapRef, output } = useAppState()
const isCapturing = ref(false)
const capturingStatus = ref('')

const capturePreset = async (presetName: string) => {
  isCapturing.value = true
  capturingStatus.value = `Capturing ${presetName}...`

  const optimalZoom = calculateZoomFromRadius(output.buildingRadius)
  mapInstance.value.setCenter(output.buildingCenter)
  mapInstance.value.setZoom(optimalZoom)

  const imageDataUrl = await captureMapWithProperSizing({
    size: { width: 1200, height: 800 },
  })

  downloadImage(imageDataUrl, `auriapp-${Date.now()}.png`)
  isCapturing.value = false
  capturingStatus.value = ''
}

const downloadImage = (dataUrl: string, filename: string) => {
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

onMounted(() => {
  console.log('Map ref ready', mapRef.value)
})
</script>
