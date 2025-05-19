// src/composables/useSolarApi.ts
import { ref } from 'vue'
import { Loader } from '@googlemaps/js-api-loader'
import { geocodeAddress } from '@/services/geocodingApi'
import { findClosestBuilding, getDataLayerUrls } from '@/services/solar'
import { getLayer } from '@/services/layer'
import { useAppState } from '@/useAppState'

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
  const { output, settings, jsonData, calculateConfig } = useAppState()

  jsonData.geoResult = jsonData.buildingResult = jsonData.layerResult = jsonData.error = null

  try {
    const geo = await geocodeAddress(settings.address, apiKey)
    await initializeMap(geo.lat, geo.lng)
    jsonData.geoResult = JSON.stringify(geo, null, 2)

    const building = await findClosestBuilding(new google.maps.LatLng(geo.lat, geo.lng), apiKey)
    jsonData.buildingResult = JSON.stringify(building, null, 2)

    // TODO add data to output
    output.static.areaMeters2 = building.solarPotential?.buildingStats?.areaMeters2
    output.static.totalEnergyPriceSntPerKwh =
      Number(settings.energyPriceSnt.value) +
      (Number(settings.transmissionPriceSnt.value) + Number(settings.electricityTax.value) / 100) *
        (1 + Number(settings.vat.value) / 100)

    // Sort the data by panelsCount in ascending order
    const sortedConfigs = building.solarPotential.solarPanelConfigs.sort(
      (a, b) => a.panelsCount - b.panelsCount,
    )

    output.technicalMax = calculateConfig(sortedConfigs[sortedConfigs.length - 1])

    // Loop to find when the energy gain per additional panel falls below 320 kWh
    for (let i = 1; i < sortedConfigs.length; i++) {
      const prev = sortedConfigs[i - 1]
      const curr = sortedConfigs[i]
      const panelDiff = curr.panelsCount - prev.panelsCount
      const energyGain = curr.yearlyEnergyDcKwh - prev.yearlyEnergyDcKwh
      const gainPerPanel = energyGain / panelDiff

      console.log(
        `From ${prev.panelsCount} to ${curr.panelsCount} panels: Gain = ${energyGain.toFixed(2)} kWh, Gain per panel = ${gainPerPanel.toFixed(2)} kWh`,
      )

      if (gainPerPanel < 320) {
        console.log(
          `Gain per additional panel drops below 320 kWh from ${prev.panelsCount} to ${curr.panelsCount} panels.`,
        )
        break
      }

      output.smartMax = calculateConfig(prev)
    }

    const data = await getDataLayerUrls({ latitude: geo.lat, longitude: geo.lng }, 100, apiKey)
    jsonData.layerResult = JSON.stringify(data, null, 2)

    const layer = await getLayer('annualFlux', data, apiKey)
    const canvas = layer.render(true, 0, 14)[0]

    overlay?.setMap(null)
    overlay = new google.maps.GroundOverlay(canvas.toDataURL(), layer.bounds)
    overlay.setMap(map!)
  } catch (e: any) {
    jsonData.error = e?.message || 'Unexpected error during solar data fetch.'
  }
}

export const useMapRef = () => mapRef
