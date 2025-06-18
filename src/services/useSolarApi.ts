// src/composables/useSolarApi.ts
import { ref } from 'vue'
import { geocodeAddress, type GeocodeLatLng } from '@/services/geocodingApi'
import {
  type SolarPanel,
  type Bounds,
  type GeoTiff,
  downloadGeoTIFF,
  findClosestBuilding,
  getDataLayerUrls,
  type SolarPanelConfig,
} from '@/services/solar'
import { getLayer } from '@/services/layer'
import { useAppState } from '@/useAppState'
import { drawSolarPanels } from '@/services/drawSolarPanels'
import { initMap, getMap, getGeometry, updateOverlay } from '@/services/mapService'

const { output, input, settings, jsonData, buildingData } = useAppState()

const apiKey = 'AIzaSyBf1PZHkSB3LPI4sdepIKnr9ItR_Gc_KT4'
// Reactive reference for mounting the map container
export const mapRef = ref<HTMLElement | null>(null)

function isPointInPolygon(
  point: google.maps.LatLngLiteral,
  polygon: google.maps.LatLngLiteral[],
): boolean {
  const googlePolygon = new google.maps.Polygon({ paths: polygon })
  return google.maps.geometry.poly.containsLocation(
    new google.maps.LatLng(point.lat, point.lng),
    googlePolygon,
  )
}

function getLatLngForPixel(
  x: number,
  y: number,
  bounds: Bounds,
  width: number,
  height: number,
): google.maps.LatLngLiteral {
  const lat = bounds.north - (y / height) * (bounds.north - bounds.south)
  const lng = bounds.west + (x / width) * (bounds.east - bounds.west)
  return { lat, lng }
}

function getPanelPolygon(
  panel: SolarPanel,
  azimuth: number,
  width: number,
  height: number,
): google.maps.LatLngLiteral[] {
  const w = width / 2
  const h = height / 2
  const orientation = panel.orientation === 'PORTRAIT' ? 90 : 0

  const corners = [
    { x: +w, y: +h },
    { x: +w, y: -h },
    { x: -w, y: -h },
    { x: -w, y: +h },
    { x: +w, y: +h },
  ]

  return corners.map(({ x, y }) =>
    google.maps.geometry.spherical
      .computeOffset(
        { lat: panel.center.latitude, lng: panel.center.longitude },
        Math.sqrt(x * x + y * y),
        Math.atan2(y, x) * (180 / Math.PI) + orientation + azimuth,
      )
      .toJSON(),
  )
}

function getMonthlyFluxForPanelArea(
  layer: GeoTiff,
  polygon: google.maps.LatLngLiteral[],
): number[] {
  const width = layer.width
  const height = layer.height
  const results = new Array(12).fill(0)
  const counts = new Array(12).fill(0)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const latlng = getLatLngForPixel(x, y, layer.bounds, width, height)
      if (isPointInPolygon(latlng, polygon)) {
        for (let month = 0; month < 12; month++) {
          const idx = y * width + x
          results[month] += layer.rasters[month][idx]
          counts[month] += 1
        }
      }
    }
  }

  return results.map((sum, i) => sum / (counts[i] || 1)) // average irradiance per month
}

export const getGeo = async (address = input.address): Promise<GeocodeLatLng> => {
  const geo = await geocodeAddress(address, apiKey)
  return geo
}

export const getBuildingData = async (geo: GeocodeLatLng) => {
  jsonData.geoResult = jsonData.buildingResult = jsonData.layerResult = jsonData.error = null

  if (mapRef.value) {
    await initMap(mapRef.value, geo.lat, geo.lng)
  }

  jsonData.geoResult = JSON.stringify(geo, null, 2)

  buildingData.building = await findClosestBuilding(
    new google.maps.LatLng(geo.lat, geo.lng),
    apiKey,
  )
  jsonData.buildingResult = JSON.stringify(buildingData.building, null, 2)
  output.static.areaMeters2 = buildingData.building.solarPotential.buildingStats.areaMeters2
  output.static.totalEnergyPriceSntPerKwh =
    Number(settings.energyPriceSnt.value) +
    (Number(settings.transmissionPriceSnt.value) + Number(settings.electricityTax.value)) *
      (1 + Number(settings.vat.value) / 100)

  // Sort the data by panelsCount in ascending order and calculate gainPerPanel
  const sorted: SolarPanelConfig[] = buildingData.building.solarPotential.solarPanelConfigs
    .sort((a: SolarPanelConfig, b: SolarPanelConfig) => a.panelsCount - b.panelsCount)
    .map((config: SolarPanelConfig, index: number, array: SolarPanelConfig[]) => {
      if (index === 0) {
        return {
          ...config,
          gainPerPanel: null, // First item has no previous to compare
        }
      }

      const prev = array[index - 1]
      const panelDiff = config.panelsCount - prev.panelsCount
      const energyGain = config.yearlyEnergyDcKwh - prev.yearlyEnergyDcKwh
      const gainPerPanel = panelDiff > 0 ? energyGain / panelDiff : null

      return {
        ...config,
        gainPerPanel,
      }
    })

  buildingData.sortedConfigs = sorted
}

export const getLayerData = async (geo: GeocodeLatLng) => {
  const data = await getDataLayerUrls({ latitude: geo.lat, longitude: geo.lng }, 50, apiKey)
  jsonData.layerResult = JSON.stringify(data, null, 2)

  const layer = await getLayer('annualFlux', data, apiKey)
  const canvas = layer.render(true, 0, 14)[0]

  updateOverlay(canvas, layer.bounds)

  const monthlyFlux = await downloadGeoTIFF(data.monthlyFluxUrl, apiKey)

  const bestPanel = buildingData.building.solarPotential.solarPanels.reduce((a, b) =>
    a.yearlyEnergyDcKwh > b.yearlyEnergyDcKwh ? a : b,
  )
  const azimuth =
    buildingData.building.solarPotential.roofSegmentStats[bestPanel.segmentIndex].azimuthDegrees

  const panelPolygon = getPanelPolygon(
    bestPanel,
    azimuth,
    buildingData.building.solarPotential.panelWidthMeters,
    buildingData.building.solarPotential.panelHeightMeters,
  )

  const monthlyFluxValues = getMonthlyFluxForPanelArea(monthlyFlux, panelPolygon)
  const total = monthlyFluxValues.reduce((a, b) => a + b, 0)
  const bestPanelDistribution = monthlyFluxValues.map((v) => (v / total) * 100)

  output.monthlyDistribution = bestPanelDistribution
}

export const useMapRef = () => mapRef

let currentPolygons: google.maps.Polygon[] = []

export const renderPanels = (panelCount: number = input.panelCount?.value) => {
  const { building, sortedConfigs } = buildingData
  const map = getMap()
  const geometry = getGeometry()

  if (!map || !geometry || sortedConfigs.length === 0) return

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
