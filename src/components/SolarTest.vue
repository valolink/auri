<template>
  <div style="padding: 1rem; max-width: 600px; margin: auto">
    <h2 style="font-size: 1.25rem; margin-bottom: 1rem">
      Solar API with Vue.js and WordPress test
    </h2>
    <n-input-group>
      <n-input
        v-model:value="address"
        type="text"
        placeholder="Syötä osoite"
        :style="{ width: '75%' }"
      />
      <n-button type="primary" @click="runTest">Hae</n-button>
    </n-input-group>
    <div
      ref="mapRef"
      style="width: 100%; height: 400px; margin-top: 1rem; border: 1px solid #ccc"
    ></div>
    <p>Settings:</p>
    <json-viewer v-if="settings" :value="settings" :expand-depth="1" copyable boxed sort />

    <p>Geocode:</p>
    <json-viewer
      v-if="geoResult"
      :value="JSON.parse(geoResult)"
      :expand-depth="2"
      copyable
      boxed
      sort
    />

    <p>Building:</p>
    <json-viewer
      v-if="buildingResult"
      :value="JSON.parse(buildingResult)"
      :expand-depth="2"
      copyable
      boxed
      sort
    />

    <p>Data Layers:</p>
    <json-viewer
      v-if="layerResult"
      :value="JSON.parse(layerResult)"
      :expand-depth="2"
      copyable
      boxed
      sort
    />
    <p v-if="error" style="color: red; margin-top: 1rem">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Loader } from '@googlemaps/js-api-loader'
import { geocodeAddress } from '@/services/geocodingApi'
import { findClosestBuilding, getDataLayerUrls } from '@/services/solar'
import { getLayer } from '@/services/layer'

// @ts-expect-error no types for jsonviewer
import JsonViewer from 'vue-json-viewer'
import 'vue-json-viewer/style.css'

import { NInput, NButton, NInputGroup } from 'naive-ui'

import { useAppState } from '@/useAppState'
const { settings } = useAppState()

const mapRef = ref<HTMLElement | null>(null)
let map: google.maps.Map | null = null
const marker: google.maps.Marker | null = null

const address = ref('Rajatorpantie 8')
const result = ref<string | null>(null)
const error = ref<string | null>(null)
const geoResult = ref<string | null>(null)
const buildingResult = ref<string | null>(null)
const layerResult = ref<string | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const apiKey = 'AIzaSyBf1PZHkSB3LPI4sdepIKnr9ItR_Gc_KT4'

const polygon: google.maps.Polygon | null = null
let overlay: google.maps.GroundOverlay | null = null

const initializeMap = async (lat: number, lng: number) => {
  const loader = new Loader({
    apiKey,
    version: 'weekly',
    libraries: ['places'], // optional if you want places search later
  })

  await loader.load()

  if (!mapRef.value) return

  map = new google.maps.Map(mapRef.value, {
    center: { lat, lng },
    zoom: 18,
    mapTypeId: 'satellite',
    tilt: 0, // ✅ Keep map flat (0° tilt)
    heading: 0, // ✅ Ensure north is up
    gestureHandling: 'greedy', // optional: allow full pan/zoom
    rotateControl: false, // optional: disable rotation UI
    mapId: '', // optional: custom map style ID if needed
  })
  // marker = new google.maps.Marker({
  //   position: { lat, lng },
  //   map,
  //   title: 'Selected Location',
  // })
}

const fetchGeocodeBoundsFromPlaceId = async (placeId: string, apiKey: string) => {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${placeId}&key=${apiKey}`
  const response = await fetch(url)
  const data = await response.json()

  if (
    data.status === 'OK' &&
    data.results.length &&
    data.results[0].geometry &&
    (data.results[0].geometry.bounds || data.results[0].geometry.viewport)
  ) {
    const geom = data.results[0].geometry
    return geom.bounds || geom.viewport
  } else {
    throw new Error('No bounds or viewport available for Place ID')
  }
}

const runTest = async () => {
  //try {
  // if (marker) marker.setMap(null)
  result.value = error.value = null
  geoResult.value = buildingResult.value = layerResult.value = null

  const geo = await geocodeAddress(address.value, apiKey)
  await initializeMap(geo.lat, geo.lng)

  const building = await findClosestBuilding(new google.maps.LatLng(geo.lat, geo.lng), apiKey)
  const placeId = building.name.split('/').pop() || ''
  // const bounds = await fetchGeocodeBoundsFromPlaceId(placeId, apiKey)
  buildingResult.value = JSON.stringify(building, null, 2)
  // if (polygon) polygon.setMap(null) // remove old one

  // const sw = bounds.southwest
  // const ne = bounds.northeast
  // const nw = { lat: ne.lat, lng: sw.lng }
  // const se = { lat: sw.lat, lng: ne.lng }

  // polygon = new google.maps.Polygon({
  //   paths: [sw, se, ne, nw],
  //   strokeColor: '#00f',
  //   strokeOpacity: 1.0,
  //   strokeWeight: 2,
  //   fillColor: '#00f',
  //   fillOpacity: 0.3,
  // })
  // polygon.setMap(map!)
  //
  geoResult.value = JSON.stringify(geo, null, 2)

  const data = await getDataLayerUrls({ latitude: geo.lat, longitude: geo.lng }, 100, apiKey)
  layerResult.value = JSON.stringify(data, null, 2)

  result.value = layerResult.value
  const layer = await getLayer('annualFlux', data, apiKey)

  const canvas = layer.render(true, 0, 14)[0] // showRoofOnly, month=0, day=14

  overlay?.setMap(null) // remove previous one
  overlay = new google.maps.GroundOverlay(canvas.toDataURL(), layer.bounds)
  overlay.setMap(map!)
}
</script>
