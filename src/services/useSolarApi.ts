// src/composables/useSolarApi.ts
import { ref } from 'vue'
import { Loader } from '@googlemaps/js-api-loader'
import { geocodeAddress } from '@/services/geocodingApi'
import { findClosestBuilding, getDataLayerUrls } from '@/services/solar'
import { getLayer } from '@/services/layer'
import { useAppState } from '@/useAppState'
import { calculateConfig, findConfigs } from '@/services/configUtils'

const mapRef = ref<HTMLElement | null>(null)
let map: google.maps.Map | null = null
let overlay: google.maps.GroundOverlay | null = null

const apiKey = 'AIzaSyBf1PZHkSB3LPI4sdepIKnr9ItR_Gc_KT4'

const initializeMap = async (lat: number, lng: number) => {
  const loader = new Loader({
    apiKey,
    version: 'weekly',
    libraries: ['places'],
  })
  await loader.load()

  if (!mapRef.value) return

  map = new google.maps.Map(mapRef.value, {
    center: { lat, lng },
    zoom: 18,
    mapTypeId: 'satellite',
    tilt: 0,
    heading: 0,
    gestureHandling: 'greedy',
    rotateControl: false,
    mapId: '',
  })
}

export const runSolarApi = async () => {
  const { output, settings, jsonData, buildingData } = useAppState()

  jsonData.geoResult = jsonData.buildingResult = jsonData.layerResult = jsonData.error = null

  const geo = await geocodeAddress(settings.address, apiKey)
  await initializeMap(geo.lat, geo.lng)
  jsonData.geoResult = JSON.stringify(geo, null, 2)

  buildingData.building = await findClosestBuilding(
    new google.maps.LatLng(geo.lat, geo.lng),
    apiKey,
  )
  jsonData.buildingResult = JSON.stringify(buildingData.building, null, 2)
  // TODO add data to output
  output.static.areaMeters2 = buildingData.building.solarPotential?.buildingStats?.areaMeters2
  output.static.totalEnergyPriceSntPerKwh =
    Number(settings.energyPriceSnt.value) +
    (Number(settings.transmissionPriceSnt.value) + Number(settings.electricityTax.value)) *
      (1 + Number(settings.vat.value) / 100)

  // Sort the data by panelsCount in ascending order
  buildingData.sortedConfigs = buildingData.building.solarPotential.solarPanelConfigs.sort(
    (a, b) => a.panelsCount - b.panelsCount,
  )

  output.technicalMax = calculateConfig(
    buildingData.sortedConfigs[buildingData.sortedConfigs.length - 1],
  )

  findConfigs(false, false, false)

  const data = await getDataLayerUrls({ latitude: geo.lat, longitude: geo.lng }, 100, apiKey)
  jsonData.layerResult = JSON.stringify(data, null, 2)

  const layer = await getLayer('annualFlux', data, apiKey)
  const canvas = layer.render(true, 0, 14)[0]

  overlay?.setMap(null)
  overlay = new google.maps.GroundOverlay(canvas.toDataURL(), layer.bounds)
  overlay.setMap(map!)
}

export const useMapRef = () => mapRef
