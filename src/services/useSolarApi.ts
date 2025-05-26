// src/composables/useSolarApi.ts
import { ref } from 'vue'
import { Loader } from '@googlemaps/js-api-loader'
import { geocodeAddress } from '@/services/geocodingApi'
import { downloadGeoTIFF, findClosestBuilding, getDataLayerUrls } from '@/services/solar'
import { getLayer } from '@/services/layer'
import { useAppState } from '@/useAppState'
import { calculateConfig, findConfigs } from '@/services/configUtils'
import { drawSolarPanels } from '@/services/drawSolarPanels'

export const mapRef = ref<HTMLElement | null>(null)
export let map: google.maps.Map | null = null
export let geometry: typeof google.maps.geometry
let overlay: google.maps.GroundOverlay | null = null

const apiKey = 'AIzaSyBf1PZHkSB3LPI4sdepIKnr9ItR_Gc_KT4'

const loader = new Loader({
  apiKey,
  version: 'weekly',
  libraries: ['geometry'], // ensure 'geometry' is loaded
})

const initializeMap = async (lat: number, lng: number) => {
  await loader.load()
  geometry = google.maps.geometry

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
  renderPanels(output.smartMax.panelsCount)

  const data = await getDataLayerUrls({ latitude: geo.lat, longitude: geo.lng }, 50, apiKey)
  jsonData.layerResult = JSON.stringify(data, null, 2)

  const layer = await getLayer('annualFlux', data, apiKey)
  const canvas = layer.render(true, 0, 14)[0]

  overlay?.setMap(null)
  overlay = new google.maps.GroundOverlay(canvas.toDataURL(), layer.bounds)
  overlay.setMap(map!)

  const monthlyFlux = await downloadGeoTIFF(data.monthlyFluxUrl, apiKey)
  const brightnessByMonth = monthlyFlux.rasters.map((raster) =>
    raster.reduce((sum, value) => sum + value, 0),
  )
  const totalBrightness = brightnessByMonth.reduce((a, b) => a + b, 0)
  const distribution = brightnessByMonth.map((value) => (value / totalBrightness) * 100)

  output.monthlyDistribution = distribution
}

export const useMapRef = () => mapRef

let currentPolygons: google.maps.Polygon[] = []

export const renderPanels = (panelCount: number) => {
  const { building, sortedConfigs } = useAppState().buildingData

  if (!map || !geometry || sortedConfigs.length === 0) return

  // Clear old polygons
  currentPolygons.forEach((p) => p.setMap(null))
  currentPolygons = []

  const solarPotential = building.solarPotential
  const panelConfig = sortedConfigs.find((c) => c.panelsCount === panelCount)

  if (!panelConfig) return

  currentPolygons = drawSolarPanels({
    config: panelConfig,
    solarPanels: solarPotential.solarPanels,
    roofSegments: solarPotential.roofSegmentStats,
    panelWidth: solarPotential.panelWidthMeters,
    panelHeight: solarPotential.panelHeightMeters,
    map,
    geometry,
  })
}
