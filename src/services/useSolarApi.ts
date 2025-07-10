// src/composables/useSolarApi.ts
import { geocodeAddress, type GeocodeLatLng } from '@/services/geocodingApi'
import {
  type SolarPanel,
  type Bounds,
  type GeoTiff,
  type DataLayersResponse,
  downloadGeoTIFF,
  findClosestBuilding,
  type SolarPanelConfig,
  type SortedSolarPanelConfig,
} from '@/services/solar'
import { getLayer } from '@/services/layer'
import { useAppState } from '@/useAppState'
import { drawSolarPanels } from '@/services/drawSolarPanels'
import { getGeometry, updateOverlay } from '@/services/mapService'

const { mapRef, mapInstance, output, input, settings, jsonData, buildingData } = useAppState()

interface BoundingBox {
  sw: {
    latitude: number
    longitude: number
  }
  ne: {
    latitude: number
    longitude: number
  }
}

interface BuildingInfo {
  building: {
    name: string
    center: {
      latitude: number
      longitude: number
    }
    boundingBox: BoundingBox
    // ... other properties
  }
}

export const calculateBoundingBoxDiagonal = (boundingBox: BoundingBox): number => {
  const { sw, ne } = boundingBox

  // Use Haversine formula to calculate distance between SW and NE corners
  const R = 6371000 // Earth's radius in meters
  const lat1 = (sw.latitude * Math.PI) / 180
  const lat2 = (ne.latitude * Math.PI) / 180
  const deltaLat = ((ne.latitude - sw.latitude) * Math.PI) / 180
  const deltaLng = ((ne.longitude - sw.longitude) * Math.PI) / 180

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

export const calculateSolarAPIRadius = (buildingInfo: BuildingInfo): number => {
  const { boundingBox } = buildingInfo.building

  const width = calculateDistance(
    { lat: boundingBox.sw.latitude, lng: boundingBox.sw.longitude },
    { lat: boundingBox.sw.latitude, lng: boundingBox.ne.longitude },
  )

  const height = calculateDistance(
    { lat: boundingBox.sw.latitude, lng: boundingBox.sw.longitude },
    { lat: boundingBox.ne.latitude, lng: boundingBox.sw.longitude },
  )

  let baseRadius = Math.max(width, height) / 2
  baseRadius = baseRadius * 1.1

  const minRadius = 10 // Minimum 50 meters
  const maxRadius = 1000 // Maximum 1000 meters (API limit consideration)

  return Math.min(Math.max(baseRadius, minRadius), maxRadius)
}

const calculateDistance = (
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number },
): number => {
  const R = 6371000 // Earth's radius in meters
  const lat1 = (point1.lat * Math.PI) / 180
  const lat2 = (point2.lat * Math.PI) / 180
  const deltaLat = ((point2.lat - point1.lat) * Math.PI) / 180
  const deltaLng = ((point2.lng - point1.lng) * Math.PI) / 180

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

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

export const getLayerData = async (geo: GeocodeLatLng, radius: number) => {
  // Run both operations in parallel
  await Promise.all([getAnnualFluxLayer(geo, radius), getMonthlyDistribution()])
}

// export const getLayerData = async (geo: GeocodeLatLng, radius: number) => {
//   const data = await getDataLayerUrls(geo, radius, settings.apiKey.value)
//   jsonData.layerResult = JSON.stringify(data, null, 2)
//
//   const layer = await getLayer('annualFlux', data, settings.apiKey.value)
//   const canvas = layer.render(true, 0, 14)[0]
//
//   updateOverlay(canvas, layer.bounds)
//
//   const monthlyFlux = await downloadGeoTIFF(data.monthlyFluxUrl, settings.apiKey.value)
//
//   const bestPanel = buildingData.building.solarPotential.solarPanels.reduce((a, b) =>
//     a.yearlyEnergyDcKwh > b.yearlyEnergyDcKwh ? a : b,
//   )
//   const azimuth =
//     buildingData.building.solarPotential.roofSegmentStats[bestPanel.segmentIndex].azimuthDegrees
//
//   const panelPolygon = getPanelPolygon(
//     bestPanel,
//     azimuth,
//     buildingData.building.solarPotential.panelWidthMeters,
//     buildingData.building.solarPotential.panelHeightMeters,
//   )
//
//   const monthlyFluxValues = getMonthlyFluxForPanelArea(monthlyFlux, panelPolygon)
//   const total = monthlyFluxValues.reduce((a, b) => a + b, 0)
//   const bestPanelDistribution = monthlyFluxValues.map((v) => (v / total) * 100)
//
//   output.monthlyDistribution = bestPanelDistribution
// }

export const getGeo = async (address = input.address): Promise<GeocodeLatLng> => {
  const geo = await geocodeAddress(address, settings.apiKey.value)
  return geo
}

export const getBuildingData = async (geo: GeocodeLatLng) => {
  jsonData.geoResult = jsonData.buildingResult = jsonData.layerResult = jsonData.error = null

  jsonData.geoResult = JSON.stringify(geo, null, 2)

  buildingData.building = await findClosestBuilding(
    new google.maps.LatLng(geo.lat, geo.lng),
    settings.apiKey.value,
  )
  jsonData.buildingResult = JSON.stringify(buildingData.building, null, 2)
  output.static.areaMeters2 = buildingData.building.solarPotential.buildingStats.areaMeters2
  output.static.totalEnergyPriceSntPerKwh =
    Number(settings.energyPriceSnt.value) +
    (Number(settings.transmissionPriceSnt.value) + Number(settings.electricityTax.value)) *
      (1 + Number(settings.vat.value) / 100)

  const sorted: SortedSolarPanelConfig[] = buildingData.building.solarPotential.solarPanelConfigs
    .sort((a: SolarPanelConfig, b: SolarPanelConfig) => a.panelsCount - b.panelsCount)
    .map((config: SolarPanelConfig, index: number, array: SolarPanelConfig[]) => {
      const yearlyEnergyAcKwh = config.yearlyEnergyDcKwh * settings.dcToAcDerate.value
      if (index === 0) {
        return {
          ...config,
          gainPerPanel: null, // First item has no previous to compare
          yearlyEnergyAcKwh,
        }
      }

      const prev = array[index - 1]
      const panelDiff = config.panelsCount - prev.panelsCount
      const energyGain = config.yearlyEnergyDcKwh - prev.yearlyEnergyDcKwh
      const gainPerPanel = panelDiff > 0 ? energyGain / panelDiff : null

      return {
        ...config,
        gainPerPanel,
        yearlyEnergyAcKwh,
      }
    })

  buildingData.sortedConfigs = sorted
  output.buildingCenter = {
    lat: buildingData.building.center.latitude,
    lng: buildingData.building.center.longitude,
  }
  console.log('buildingData', buildingData.building)
  output.buildingRadius = calculateSolarAPIRadius({ building: buildingData.building })
}

export async function getDataLayerUrls(
  location: { lat: number; lng: number },
  radiusMeters: number,
): Promise<DataLayersResponse> {
  const args = {
    'location.latitude': location.lat.toFixed(5),
    'location.longitude': location.lng.toFixed(5),
    radius_meters: Math.min(radiusMeters, 175).toString(),
    requiredQuality: 'MEDIUM',
    exactQualityRequired: 'true',
    // pixelSizeMeters: radiusMeters > 100 ? 0.5 : 0.25,
    pixelSizeMeters: '1',
  }
  console.log('GET dataLayers\n', args)
  const params = new URLSearchParams({ ...args, key: settings.apiKey.value })
  // https://developers.google.com/maps/documentation/solar/reference/rest/v1/dataLayers/get
  return fetch(`https://solar.googleapis.com/v1/dataLayers:get?${params}`).then(
    async (response) => {
      const content = await response.json()
      if (response.status != 200) {
        console.error('getDataLayerUrls\n', content)
        throw content
      }
      console.log('dataLayersResponse', content)
      return content
    },
  )
}

// Handle annual flux visualization for the map
export const getAnnualFluxLayer = async (geo: GeocodeLatLng, radius: number) => {
  const data = await getDataLayerUrls(geo, radius)
  jsonData.layerResult = JSON.stringify(data, null, 2)

  const layer = await getLayer('annualFlux', data, settings.apiKey.value)
  const canvas = layer.render(true, 0, 14)[0]
  updateOverlay(canvas, layer.bounds)
}

// Handle monthly flux calculations for the best panel
export const getMonthlyDistribution = async () => {
  // Get best panel location from building data
  const bestPanel = buildingData.building.solarPotential.solarPanels.reduce((a, b) =>
    a.yearlyEnergyDcKwh > b.yearlyEnergyDcKwh ? a : b,
  )

  const panelLocation = {
    lat: bestPanel.center.latitude,
    lng: bestPanel.center.longitude,
  }

  // Get panel-specific data with small radius
  const panelData = await getDataLayerUrls(panelLocation, 25)
  const monthlyFlux = await downloadGeoTIFF(panelData.monthlyFluxUrl, settings.apiKey.value)

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

let currentPolygons: google.maps.Polygon[] = []

export const renderPanels = (panelCount: number = input.panelCount?.value) => {
  const { building, sortedConfigs } = buildingData
  // await loadGoogleMaps()
  const geometry = getGeometry()
  if (!mapRef.value || !geometry || sortedConfigs.length === 0) return

  currentPolygons.forEach((p) => p.setMap(null))
  currentPolygons = []

  const solarPotential = building.solarPotential
  const panelConfig = sortedConfigs.find((c) => c.panelsCount === panelCount)
  if (!panelConfig) return
  if (!mapInstance.value) {
    throw new Error('Map container element not found')
  }
  currentPolygons = drawSolarPanels({
    config: panelConfig,
    solarPanels: solarPotential.solarPanels,
    roofSegments: solarPotential.roofSegmentStats,
    panelWidth: solarPotential.panelWidthMeters,
    panelHeight: solarPotential.panelHeightMeters,
    map: mapInstance.value,
    geometry,
  })
}
