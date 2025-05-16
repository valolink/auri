<template>
  <div>
    <p>Output:</p>
    <json-viewer v-if="output" :value="output" :expand-depth="1" copyable boxed sort />

    <p>Settings:</p>
    <json-viewer v-if="settings" :value="settings" :expand-depth="1" copyable boxed sort />

    <p>Geocode:</p>
    <json-viewer
      v-if="jsonData.geoResult"
      :value="JSON.parse(jsonData.geoResult)"
      :expand-depth="2"
      copyable
      boxed
      sort
    />

    <p>Building:</p>
    <json-viewer
      v-if="jsonData.buildingResult"
      :value="JSON.parse(jsonData.buildingResult)"
      :expand-depth="2"
      copyable
      boxed
      sort
    />

    <p>Data Layers:</p>
    <json-viewer
      v-if="jsonData.layerResult"
      :value="JSON.parse(jsonData.layerResult)"
      :expand-depth="2"
      copyable
      boxed
      sort
    />
    <p v-if="jsonData.error" style="color: red; margin-top: 1rem">{{ jsonData.error }}</p>
  </div>
</template>

<script setup lang="ts">
import { useAppState } from '@/useAppState'
// @ts-expect-error no types for jsonviewer
import JsonViewer from 'vue-json-viewer'
import 'vue-json-viewer/style.css'

const { output, settings, jsonData } = useAppState()
</script>
