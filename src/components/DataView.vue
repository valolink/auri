<template>
  <div>
    <p>output:</p>
    <json-viewer v-if="output" :value="output" :expand-depth="1" copyable boxed sort />

    <p>chart:</p>
    <json-viewer v-if="chartRef" :value="chartRef.chart" :expand-depth="1" copyable boxed sort />

    <p>input:</p>
    <json-viewer v-if="input" :value="input" :expand-depth="1" copyable boxed />

    <p>settings:</p>
    <json-viewer v-if="settings" :value="settings" :expand-depth="1" copyable boxed sort />

    <p>building:</p>
    <json-viewer v-if="buildingData" :value="buildingData" :expand-depth="2" copyable boxed />

    <p>geocode:</p>
    <json-viewer
      v-if="jsonData.geoResult"
      :value="JSON.parse(jsonData.geoResult)"
      :expand-depth="2"
      copyable
      boxed
      sort
    />

    <p>dataLayers:</p>
    <json-viewer
      v-if="jsonData.layerResult"
      :value="JSON.parse(jsonData.layerResult)"
      :expand-depth="2"
      copyable
      boxed
    />
    <p v-if="jsonData.error" style="color: red; margin-top: 1rem">{{ jsonData.error }}</p>
  </div>
</template>

<script setup lang="ts">
import { useAppState } from '@/useAppState'
// @ts-expect-error no types for jsonviewer
import JsonViewer from 'vue-json-viewer'
import 'vue-json-viewer/style.css'

const { buildingData, output, input, settings, jsonData, chartRef } = useAppState()
</script>
